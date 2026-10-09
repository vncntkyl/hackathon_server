"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TRADES } from "@/lib/mock";
import RepairReport from "@/components/RepairReport";

/**
 * Place in app/chat/page.tsx. Uses the existing steel/hivis Tailwind theme,
 * .btn, .btn-outline, .field, and TRADES: { id: string; label: string }[].
 * Install framer-motion if it is not already in the project.
 *
 * Backend contract:
 * POST CHAT_ENDPOINT with { description, user, conversationId? }.
 * Response: { success, conversationId, data: { reply, isReadyForReport, assessment } }.
 * Follow-ups reuse the returned conversationId; New chat clears it.
 * assessment.trade is matched only when isReadyForReport is true.
 * Consent setup gets location before sending the initial description.
 * Location and consent stay in client state; add them to user only when your schema supports them.
 * Completed assessments are displayed with professionals from IndexedDB.
 * This file is a client UI; the backend must implement the chat endpoint.
 */
const CHAT_ENDPOINT = "http://localhost:3000/api/repairs/chat";
const MAX_LENGTH = 2000;
type Turn = { role: "user" | "assistant"; content: string };
type Report = {
  trade: string | null;
  assessment: Record<string, unknown>;
  summary: string;
};
type Message = Turn & {
  id: string;
  status?: "pending" | "sent" | "failed";
  report?: Report;
  safetyWarning?: string | null;
};
type UserDetails = {
  first_name: string;
  last_name: string;
  gender: string;
  location: { latitude: number; longitude: number; accuracy: number };
  consent: {
    privacyAccepted: true;
    locationAccepted: true;
    acceptedAt: string;
  };
};
type FailedTurn = {
  id: string;
  history: Turn[];
  user: UserDetails;
  conversationId: string | null;
};

const GREETING: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! Tell me what needs fixing or improving. I’ll ask a few questions and help you find the right trade for the job.",
};
const STARTERS = [
  "There’s a leak under my kitchen sink.",
  "Some of my outlets have stopped working.",
  "I need help repairing a wooden door.",
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchingTrades(trade: string | null) {
  if (!trade) return [];
  const target = normalize(trade);
  return TRADES.filter(
    (item) => normalize(item.id) === target || normalize(item.label) === target,
  );
}

async function requestAssistant(
  history: Turn[],
  user: UserDetails,
  conversationId: string | null,
  signal: AbortSignal,
) {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: history[history.length - 1].content,
      ...(conversationId ? { conversationId } : {}),
      // Kept on subsequent requests for schemas that still require user.
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
      },
    }),
    signal,
  });
  const data: unknown = await response.json();
  if (!data || typeof data !== "object")
    throw new Error(
      "The assistant returned an invalid response. Please try again.",
    );
  const payload = data as Record<string, unknown>;
  if (!response.ok || payload.success !== true) {
    throw new Error(
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : "The assistant couldn't reply. Please try again.",
    );
  }
  if (
    !payload.data ||
    typeof payload.data !== "object" ||
    typeof payload.conversationId !== "string" ||
    !payload.conversationId.trim()
  ) {
    throw new Error(
      "The assistant returned an invalid response. Please try again.",
    );
  }
  const result = payload.data as Record<string, unknown>;
  const assessment =
    result.assessment && typeof result.assessment === "object"
      ? (result.assessment as Record<string, unknown>)
      : null;
  if (
    typeof result.reply !== "string" ||
    !result.reply.trim() ||
    typeof result.isReadyForReport !== "boolean"
  ) {
    throw new Error(
      "The assistant returned an invalid response. Please try again.",
    );
  }
  return {
    conversationId: payload.conversationId.trim(),
    message: result.reply.trim(),
    isReadyForReport: result.isReadyForReport,
    assessment: assessment ?? {},
    trade:
      typeof assessment?.trade === "string" && assessment.trade.trim()
        ? assessment.trade.trim()
        : null,
    safetyWarning:
      typeof assessment?.safetyWarning === "string" &&
      assessment.safetyWarning.trim()
        ? assessment.safetyWarning.trim()
        : null,
  };
}

export default function ChatPage() {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [first_name, setfirst_name] = useState("");
  const [last_name, setlast_name] = useState("");
  const [gender, setGender] = useState("");
  const [description, setDescription] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [locationAccepted, setLocationAccepted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const setupBusy = useRef(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [failedTurn, setFailedTurn] = useState<FailedTurn | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const busy = useRef(false);
  const conversationId = useRef<string | null>(null);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const input = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();

  const filteredTrades = useMemo(
    () => (report ? matchingTrades(report.trade) : TRADES),
    [report],
  );
  const hasConversation = messages.some((message) => message.role === "user");
  const transition = { duration: reduceMotion ? 0 : 0.2 };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (nearBottom.current && scroller.current) {
      scroller.current.scrollTo({
        top: scroller.current.scrollHeight,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }, [messages, sending, error, reduceMotion]);

  async function deliver(turn: FailedTurn) {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    setError("");
    setFailedTurn(null);
    setReport(null);
    nearBottom.current = true;
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 45_000);
    try {
      const data = await requestAssistant(
        turn.history,
        turn.user,
        turn.conversationId,
        abort.signal,
      );
      if (!mounted.current) return;
      conversationId.current = data.conversationId;
      const nextReport = data.isReadyForReport
        ? { trade: data.trade, assessment: data.assessment, summary: data.message }
        : null;
      setMessages((previous) => [
        ...previous.map((message) =>
          message.id === turn.id
            ? { ...message, status: "sent" as const }
            : message,
        ),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          safetyWarning: data.safetyWarning,
          ...(nextReport ? { report: nextReport } : {}),
        },
      ]);
      setReport(nextReport);
    } catch (cause) {
      if (!mounted.current) return;
      setMessages((previous) =>
        previous.map((message) =>
          message.id === turn.id ? { ...message, status: "failed" } : message,
        ),
      );
      setFailedTurn(turn);
      setError(
        abort.signal.aborted
          ? "The reply took too long. Please try again."
          : cause instanceof TypeError
            ? "Can’t reach the server. Check your connection and try again."
            : cause instanceof Error
              ? cause.message
              : "Something went wrong. Please try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      busy.current = false;
      controller.current = null;
      if (mounted.current) {
        setSending(false);
        // Wait until the disabled composer has been enabled again.
        window.requestAnimationFrame(() => {
          if (mounted.current) input.current?.focus();
        });
      }
    }
  }

  function send(content: string) {
    const text = content.trim();
    if (!user || !text || text.length > MAX_LENGTH || busy.current) return;
    const history: Turn[] = messages
      .filter(
        (message) => message.id !== GREETING.id && message.status !== "failed",
      )
      .map(({ role, content: value }) => ({ role, content: value }));
    history.push({ role: "user", content: text });
    const id = crypto.randomUUID();
    setMessages((previous) => [
      ...previous,
      { id, role: "user", content: text, status: "pending" },
    ]);
    setDraft("");
    void deliver({ id, history, user, conversationId: conversationId.current });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  function reset() {
    if (busy.current) return;
    setUser(null);
    conversationId.current = null;
    setPrivacyAccepted(false);
    setLocationAccepted(false);
    setDescription("");
    setSetupError("");
    setMessages([GREETING]);
    setDraft("");
    setReport(null);
    setFailedTurn(null);
    setError("");
    nearBottom.current = true;
    input.current?.focus();
  }

  async function startChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (setupBusy.current || busy.current) return;
    if (
      !first_name.trim() ||
      !last_name.trim() ||
      !gender ||
      !description.trim() ||
      description.trim().length > MAX_LENGTH ||
      !privacyAccepted ||
      !locationAccepted
    ) {
      setSetupError(
        "Complete your details, describe the job, and accept both consent options.",
      );
      return;
    }
    if (!window.isSecureContext || !navigator.geolocation) {
      setSetupError(
        "Location access requires a supported browser and HTTPS (or localhost).",
      );
      return;
    }
    setupBusy.current = true;
    setStarting(true);
    setSetupError("");
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: 0,
          });
        },
      );
      if (!mounted.current) return;
      const details: UserDetails = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        gender,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        consent: {
          privacyAccepted: true,
          locationAccepted: true,
          acceptedAt: new Date().toISOString(),
        },
      };
      const content = description.trim();
      const id = crypto.randomUUID();
      setUser(details);
      setMessages([{ id, role: "user", content, status: "pending" }]);
      // Pass details directly: React's state update is asynchronous.
      await deliver({
        id,
        history: [{ role: "user", content }],
        user: details,
        conversationId: null,
      });
    } catch (cause) {
      if (!mounted.current) return;
      const code = (cause as { code?: number } | null)?.code;
      setSetupError(
        code === 1
          ? "Location permission was denied. Allow location in your browser settings, then try again."
          : code === 3
            ? "Location access timed out. Please try again."
            : "Couldn’t determine your location. Check your device’s location settings and try again.",
      );
    } finally {
      setupBusy.current = false;
      if (mounted.current) setStarting(false);
    }
  }

  if (!user)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-steel-900">
        <h1 className="text-3xl font-extrabold">Before we start</h1>
        <p className="mt-2 text-steel-700">
          Share your details and give permission to help us prepare your repair
          request.
        </p>
        <motion.form
          onSubmit={startChat}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="mt-6 rounded-lg border border-steel-500/30 bg-white p-5 sm:p-6"
          aria-busy={starting}
        >
          <fieldset
            disabled={starting}
            className="space-y-5 disabled:opacity-70"
          >
            <legend className="mb-4 font-bold">Your details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                First name
                <input
                  required
                  maxLength={100}
                  autoComplete="given-name"
                  value={first_name}
                  onChange={(e) => setfirst_name(e.target.value)}
                  className="field mt-1 w-full"
                />
              </label>
              <label className="block text-sm font-semibold">
                Last name
                <input
                  required
                  maxLength={100}
                  autoComplete="family-name"
                  value={last_name}
                  onChange={(e) => setlast_name(e.target.value)}
                  className="field mt-1 w-full"
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Gender
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="field mt-1 w-full"
              >
                <option value="">Select an option</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="self_described">Another gender</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              What needs fixing?
              <textarea
                required
                maxLength={MAX_LENGTH}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field mt-1 w-full"
                placeholder="Describe the problem to start your chat."
              />
            </label>
            <div className="rounded-lg border border-steel-500/30 bg-hivis/20 p-4">
              <h2 className="font-bold">Data and location consent</h2>
              <p className="mt-2 text-sm text-steel-700">
                Your name, gender selection, job description, chat messages, and
                device location will be sent to our service and AI processing
                API to prepare your repair request and support location-based
                trade matching.
              </p>
              {/* Link the application's actual privacy notice here before production. */}
              <label className="mt-4 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span>
                  I consent to processing these details for my repair request.
                </span>
              </label>
              <label className="mt-3 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  required
                  checked={locationAccepted}
                  onChange={(e) => setLocationAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span>
                  I agree to share my current location for location-based
                  matching. My browser will ask for permission when I start.
                </span>
              </label>
            </div>
            <p className="text-xs text-steel-500">
              Location permission is required to continue. No chat request is
              sent until location access succeeds.
            </p>
            <button
              type="submit"
              disabled={
                !first_name.trim() ||
                !last_name.trim() ||
                !gender ||
                !description.trim() ||
                !privacyAccepted ||
                !locationAccepted
              }
              className="btn w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting ? "Getting location…" : "Agree and start chat"}
            </button>
          </fieldset>
          {starting && (
            <p role="status" className="mt-3 text-sm text-steel-700">
              Allow location access in your browser to continue.
            </p>
          )}
          {setupError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
              {setupError}
            </p>
          )}
        </motion.form>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold underline"
        >
          Back to browse
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-steel-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Let&apos;s prepare your repair report</h1>
          <p className="mt-1 text-steel-700">
            Describe the job. <strong>repAIrmate</strong> will help you work out
            who you need.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={sending || !hasConversation}
          className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
        >
          New chat
        </button>
      </div>

      <ol className="mt-6 flex gap-2" aria-label="Progress">
        {["Describe the job", "Answer a few questions", "Repair report"].map(
          (label, index) => {
            const activeStep = report ? 2 : hasConversation ? 1 : 0;
            return (
              <li
                key={label}
                className="flex-1"
                aria-current={index === activeStep ? "step" : undefined}
              >
                <div
                  className={`h-1.5 rounded-full ${index <= activeStep ? "bg-hivis" : "bg-steel-500/20"}`}
                />
                <span
                  className={`mt-1 block text-xs font-semibold sm:text-sm ${index === activeStep ? "text-steel-900" : "text-steel-500"}`}
                >
                  {label}
                </span>
              </li>
            );
          },
        )}
      </ol>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <section
          className="min-w-0 overflow-hidden rounded-lg border border-steel-500/30 bg-white"
          aria-label="Chat with your AI assistant"
        >
          <div className="flex items-center gap-3 border-b border-steel-500/20 px-4 py-4 sm:px-5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-hivis/20 text-sm font-extrabold"
            >
              AI
            </span>
            <div>
              <h2 className="font-bold">Your job assistant</h2>
              <p className="text-xs text-steel-500">
                A little guidance before you hire.
              </p>
            </div>
          </div>

          <div
            ref={scroller}
            onScroll={() => {
              const element = scroller.current;
              if (element)
                nearBottom.current =
                  element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight <
                  100;
            }}
            className="h-[min(55dvh,520px)] min-h-72 overflow-y-auto overscroll-contain p-4 sm:p-5"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-relevant="additions text"
            tabIndex={0}
          >
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transition}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[90%] sm:max-w-[85%]">
                      <p
                        className={`mb-1 text-xs font-semibold text-steel-500 ${message.role === "user" ? "text-right" : ""}`}
                      >
                        {message.role === "user" ? "You" : "AI assistant"}
                      </p>
                      <div
                        className={`whitespace-pre-wrap wrap-break-word rounded-lg px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-steel-900 text-white" : "border border-steel-500/20 bg-steel-500/5 text-steel-900"}`}
                      >
                        {message.content}
                      </div>
                      {message.status === "failed" && (
                        <p className="mt-1 text-right text-xs font-semibold text-red-700">
                          Not delivered
                        </p>
                      )}
                      {message.safetyWarning && (
                        <div
                          role="note"
                          className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                        >
                          <p className="font-bold">Safety warning</p>
                          <p className="mt-1 whitespace-pre-wrap">
                            {message.safetyWarning}
                          </p>
                        </div>
                      )}
                      {message.report && (
                        <div className="mt-2 rounded-lg border border-steel-500/30 bg-hivis/20 px-3 py-2 text-xs font-semibold">
                          Repair report ready ·{" "}
                          {matchingTrades(message.report.trade)
                            .map((trade) => trade.label)
                            .join(", ") || "Trade needs clarification"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={transition}
                  role="status"
                  className="flex items-center gap-2 text-sm text-steel-500"
                >
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="h-1.5 w-1.5 rounded-full bg-steel-500"
                        animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: dot * 0.15,
                        }}
                      />
                    ))}
                  </span>
                  Assistant is thinking…
                </motion.div>
              )}
            </div>
          </div>

          {!hasConversation && (
            <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-5">
              {STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  disabled={sending}
                  className="rounded-lg border border-steel-500/30 px-3 py-2 text-left text-xs font-semibold transition hover:border-steel-900 hover:bg-hivis/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel-900"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={submit}
            className="border-t border-steel-500/20 p-4 sm:p-5"
          >
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p role="alert" className="text-sm font-semibold text-red-700">
                  {error}
                </p>
                {failedTurn && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessages((previous) =>
                        previous.map((message) =>
                          message.id === failedTurn.id
                            ? { ...message, status: "pending" }
                            : message,
                        ),
                      );
                      void deliver(failedTurn);
                    }}
                    disabled={sending}
                    className="mt-2 text-sm font-semibold underline"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
            <label
              htmlFor="chat-message"
              className="mb-1 block text-sm font-semibold"
            >
              Your message
            </label>
            <textarea
              ref={input}
              id="chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={sending}
              maxLength={MAX_LENGTH}
              rows={3}
              className="field min-h-24 w-full resize-y disabled:opacity-50"
              placeholder="What’s happening? Where is the problem?"
              aria-describedby="composer-hint"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p id="composer-hint" className="text-xs text-steel-500">
                Enter to send. Shift + Enter for a new line.
                <span className="mt-1 block">
                  {draft.length}/{MAX_LENGTH}
                </span>
              </p>
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="btn shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </section>

        <aside
          className="min-w-0 lg:sticky lg:top-6"
          aria-label="Repair report and matching professionals"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={report ? `ready-${report.trade}` : "waiting"}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className={`rounded-lg border border-steel-500/30 p-5 ${report ? "bg-hivis/20" : "bg-white"}`}
            >
              {report ? (
                <RepairReport
                  assessment={report.assessment}
                  summary={report.summary}
                  tradeKey={matchingTrades(report.trade)[0]?.id ?? report.trade}
                />
              ) : (
                <>
                  <h2 className="text-lg font-bold">Your repair report</h2>
                  <p className="mt-2 text-sm text-steel-700">
                    Tell the assistant what needs fixing. Your report and matching
                    professionals will appear here once the assessment is ready.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          {!report && (
            <div className="mt-5 rounded-lg border border-steel-500/30 bg-white p-5">
              <h3 className="text-sm font-bold">Trades we can help you find</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {filteredTrades.map((trade) => (
                  <li
                    key={trade.id}
                    className="rounded border border-steel-500/20 px-2 py-1 text-xs font-semibold text-steel-700"
                  >
                    {trade.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold underline"
          >
            Browse all professionals
          </Link>
        </aside>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { TRADES } from "@/lib/mock";
import PortfolioPreview from "@/components/PortfolioPreview";
import {
  RATE_UNITS,
  emptyPortfolio,
  licenseTypesFor,
  type Kind,
  type License,
  type Portfolio,
  type RateUnit,
} from "@/lib/portfolio";

const STEPS = ["Type", "Profile", "Contact", "Schedule", "Licenses", "Review"];
const LAST = STEPS.length - 1;
type Errors = Record<string, string>;

const KINDS: { id: Kind; title: string; body: string }[] = [
  {
    id: "business",
    title: "Business",
    body: "A registered shop, company or crew with a business name. You can list a team size and shop address.",
  },
  {
    id: "individual",
    title: "Individual pro",
    body: "You work on your own as a plumber, electrician, carpenter or other trade. Customers see your own name.",
  },
];

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-steel-500">{hint}</span>
      )}
      {error && (
        <span
          role="alert"
          className="mt-1 block text-sm font-semibold text-red-700"
        >
          {error}
        </span>
      )}
    </label>
  );
}

function validate(step: number, p: Portfolio): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!p.kind) e.kind = "Choose how you want to register.";
  }
  if (step === 1) {
    if (p.kind === "business" && !p.businessName.trim())
      e.businessName = "Enter your business name.";
    if (!p.ownerName.trim()) e.ownerName = "Enter your full name.";
    if (!p.trade) e.trade = "Choose your main trade.";
    if (!p.area.trim()) e.area = "Enter the area you serve.";
    const min = Number(p.rateMin);
    const max = p.rateMax ? Number(p.rateMax) : null;
    if (!p.rateMin || !Number.isFinite(min) || min < 1)
      e.rateMin = "Enter your lowest labor fee.";
    else if (max !== null && max < min)
      e.rateMax = "Highest fee must be equal to or more than the lowest.";
  }
  if (step === 2) {
    if (p.phone.replace(/\D/g, "").length < 7)
      e.phone = "Enter a phone number customers can call.";
    if (p.email && !/^\S+@\S+\.\S+$/.test(p.email))
      e.email = "Enter a valid email or leave it blank.";
  }
  if (step === 3) {
    if (!p.schedule.some((d) => d.open))
      e.schedule = "Select at least one working day.";
    p.schedule.forEach((d, i) => {
      if (d.open && d.to <= d.from)
        e[`day-${i}`] = "Closing time must be after opening time.";
    });
  }
  if (step === 4) {
    p.licenses.forEach((l) => {
      if (!l.title.trim())
        e[`lic-${l.id}`] = "Enter the name of the certificate or license.";
    });
  }
  return e;
}

export default function Register() {
  const [p, setP] = useState<Portfolio>(emptyPortfolio());
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isIndividual = p.kind === "individual";

  const update = <K extends keyof Portfolio>(key: K, value: Portfolio[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));

  const text =
    (key: keyof Portfolio) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      update(key, e.target.value as never);

  function chooseKind(kind: Kind) {
    setP((prev) => ({
      ...prev,
      kind,
      // Individuals can't hold the business-registration type, so convert any already added.
      licenses:
        kind === "individual"
          ? prev.licenses.map((l) =>
              l.type === "dti" ? { ...l, type: "other" } : l,
            )
          : prev.licenses,
    }));
    setErrors({});
  }

  function go(next: number) {
    setStep(next);
    setErrors({});
    setSubmitError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onNext() {
    const errs = validate(step, p);
    setErrors(errs);
    if (Object.keys(errs).length === 0) go(step + 1);
  }

  function setDay(i: number, patch: Partial<Portfolio["schedule"][number]>) {
    update(
      "schedule",
      p.schedule.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    );
  }

  function copyFirstOpenDay() {
    const src = p.schedule.find((d) => d.open);
    if (!src) return;
    update(
      "schedule",
      p.schedule.map((d) =>
        d.open ? { ...d, from: src.from, to: src.to } : d,
      ),
    );
  }

  function addLicense() {
    const l: License = {
      id: crypto.randomUUID(),
      type: "tesda",
      title: "",
      number: "",
      expiry: "",
    };
    update("licenses", [...p.licenses, l]);
  }
  function setLicense(id: string, patch: Partial<License>) {
    update(
      "licenses",
      p.licenses.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  }
  function removeLicense(id: string) {
    update(
      "licenses",
      p.licenses.filter((l) => l.id !== id),
    );
  }

  async function submit() {
    if (saving) return;
    setSaving(true);
    setSubmitError("");

    const payload = {
      kind: p.kind,
      businessName: p.businessName,
      ownerName: p.ownerName,
      teamSize: p.teamSize ? Number(p.teamSize) : null,
      trade: p.trade,
      years: p.years ? Number(p.years) : null,
      area: p.area,
      about: p.about,
      phone: p.phone,
      altPhone: p.altPhone,
      email: p.email,
      messenger: p.messenger,
      address: p.address,
      emergency: p.emergency,
      rateMin: p.rateMin ? Number(p.rateMin) : null,
      rateMax: p.rateMax ? Number(p.rateMax) : null,
      rateUnit: p.rateUnit,
      schedule: p.schedule.map((d) => ({
        open: d.open,
        from: d.from,
        to: d.to,
      })),
      licenses: p.licenses.map(({ type, title, number, expiry }) => ({
        type,
        title,
        number,
        expiry,
      })),
    };

    try {
      const res = await fetch("/api/worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const json = (await res.json().catch(() => ({}))) as {
          errors?: Record<string, string>;
        };
        const first = json.errors ? Object.values(json.errors)[0] : undefined;
        setSubmitError(first ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError(
        "Can't reach the server. Check your connection and try again.",
      );
    }
    setSaving(false);
  }

  function registerAnother() {
    setP(emptyPortfolio());
    setStep(0);
    setErrors({});
    setSubmitError("");
    setDone(false);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">You&apos;re listed.</h1>
        <p className="mt-2 text-steel-700">
          Your portfolio is saved. This is how homeowners will see you.
        </p>
        <div className="mt-6">
          <PortfolioPreview p={p} />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn">
            Back to home
          </Link>
          <button onClick={registerAnother} className="btn-outline">
            Register another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Create your portfolio</h1>
      <p className="mt-1 text-steel-700">
        Homeowners will see this when they look for a pro. Takes about five
        minutes.
      </p>

      {/* Progress */}
      <ol className="mt-6 flex gap-1 sm:gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className="flex-1"
            aria-current={i === step ? "step" : undefined}
          >
            <div
              className={`h-1.5 rounded-full ${i <= step ? "bg-hivis" : "bg-steel-500/20"}`}
            />
            <span
              className={`mt-1 block text-xs font-semibold sm:text-sm ${i === step ? "text-steel-900" : "text-steel-500"}`}
            >
              <span className="hidden sm:inline">{i + 1}. </span>
              {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {/* STEP 1: Type */}
          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-bold">
                How do you want to register?
              </legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {KINDS.map((k) => (
                  <label
                    key={k.id}
                    className="block cursor-pointer rounded-lg border-2 border-steel-500/30 bg-white p-5 transition hover:border-steel-900 has-[:checked]:border-steel-900 has-[:checked]:bg-hivis/20 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-steel-900"
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={k.id}
                      checked={p.kind === k.id}
                      onChange={() => chooseKind(k.id)}
                      className="sr-only"
                    />
                    <span className="block text-xl font-extrabold">
                      {k.title}
                    </span>
                    <span className="mt-1 block text-steel-700">{k.body}</span>
                    {p.kind === k.id && (
                      <span className="mt-3 inline-block rounded bg-steel-900 px-2 py-0.5 text-xs font-bold text-white">
                        Selected
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {errors.kind && (
                <p role="alert" className="mt-3 font-semibold text-red-700">
                  {errors.kind}
                </p>
              )}
            </fieldset>
          )}

          {/* STEP 2: Profile */}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {!isIndividual && (
                <Field label="Business name" error={errors.businessName}>
                  <input
                    className="field"
                    value={p.businessName}
                    onChange={text("businessName")}
                    placeholder="e.g. RDC Plumbing & Pipes"
                  />
                </Field>
              )}
              <Field
                label={
                  isIndividual ? "Your full name" : "Owner or contact person"
                }
                error={errors.ownerName}
              >
                <input
                  className="field"
                  value={p.ownerName}
                  onChange={text("ownerName")}
                  autoComplete="name"
                />
              </Field>
              <Field label="Main trade" error={errors.trade}>
                <select
                  className="field"
                  value={p.trade}
                  onChange={text("trade")}
                >
                  <option value="">Select a trade</option>
                  {TRADES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Years of experience">
                <input
                  className="field"
                  type="number"
                  min="0"
                  max="60"
                  value={p.years}
                  onChange={text("years")}
                />
              </Field>
              {!isIndividual && (
                <Field
                  label="Team size (optional)"
                  hint="Number of workers, including you."
                >
                  <input
                    className="field"
                    type="number"
                    min="1"
                    max="500"
                    value={p.teamSize}
                    onChange={text("teamSize")}
                  />
                </Field>
              )}
              <div className={isIndividual ? "sm:col-span-2" : ""}>
                <Field
                  label="Area you serve"
                  error={errors.area}
                  hint="City, district or neighborhoods, separated by commas."
                >
                  <input
                    className="field"
                    value={p.area}
                    onChange={text("area")}
                    placeholder="e.g. Quezon City, Marikina"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1 text-sm font-semibold">
                    Labor fee range (₱)
                  </legend>
                  <p className="mb-3 text-xs text-steel-500">
                    Labor only, not materials. This is an estimate so homeowners
                    know what to expect.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Lowest fee" error={errors.rateMin}>
                      <input
                        className="field"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="50"
                        value={p.rateMin}
                        onChange={text("rateMin")}
                        placeholder="e.g. 800"
                      />
                    </Field>
                    <Field
                      label="Highest fee (optional)"
                      error={errors.rateMax}
                    >
                      <input
                        className="field"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="50"
                        value={p.rateMax}
                        onChange={text("rateMax")}
                        placeholder="e.g. 1200"
                      />
                    </Field>
                    <Field label="Charged">
                      <select
                        className="field"
                        value={p.rateUnit}
                        onChange={(e) =>
                          update("rateUnit", e.target.value as RateUnit)
                        }
                      >
                        {RATE_UNITS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </fieldset>
                <Field label="About your work" hint={`${p.about.length}/500`}>
                  <textarea
                    className="field min-h-28"
                    maxLength={500}
                    value={p.about}
                    onChange={text("about")}
                    placeholder={
                      isIndividual
                        ? "What jobs do you take on? e.g. Leak repairs, water heater installs, bathroom fit-outs."
                        : "What does your business do? e.g. Residential plumbing, repairs and installations with a crew of four."
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 3: Contact */}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mobile number" error={errors.phone}>
                <input
                  className="field"
                  type="tel"
                  value={p.phone}
                  onChange={text("phone")}
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                />
              </Field>
              <Field label="Alternate number (optional)">
                <input
                  className="field"
                  type="tel"
                  value={p.altPhone}
                  onChange={text("altPhone")}
                />
              </Field>
              <Field label="Email (optional)" error={errors.email}>
                <input
                  className="field"
                  type="email"
                  value={p.email}
                  onChange={text("email")}
                  autoComplete="email"
                />
              </Field>
              <Field label="Messenger / Facebook page (optional)">
                <input
                  className="field"
                  value={p.messenger}
                  onChange={text("messenger")}
                  placeholder="e.g. facebook.com/rdcplumbing"
                />
              </Field>
              {!isIndividual && (
                <div className="sm:col-span-2">
                  <Field
                    label="Shop or business address (optional)"
                    hint="Leave blank if you only travel to customers."
                  >
                    <input
                      className="field"
                      value={p.address}
                      onChange={text("address")}
                      autoComplete="street-address"
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Schedule */}
          {step === 3 && (
            <div>
              <p className="text-steel-700">
                {isIndividual
                  ? "Turn on the days you are available and set your hours."
                  : "Turn on the days you work and set your hours."}
              </p>
              {errors.schedule && (
                <p role="alert" className="mt-2 font-semibold text-red-700">
                  {errors.schedule}
                </p>
              )}
              <ul className="mt-4 divide-y divide-steel-500/20 rounded-lg border border-steel-500/30 bg-white">
                {p.schedule.map((d, i) => (
                  <li
                    key={d.day}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3"
                  >
                    <label className="flex w-36 items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-steel-900"
                        checked={d.open}
                        onChange={(e) => setDay(i, { open: e.target.checked })}
                      />
                      <span className="font-semibold">{d.day}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`from-${i}`}>
                        {d.day} opens
                      </label>
                      <input
                        id={`from-${i}`}
                        type="time"
                        className="field w-auto"
                        value={d.from}
                        disabled={!d.open}
                        onChange={(e) => setDay(i, { from: e.target.value })}
                      />
                      <span>to</span>
                      <label className="sr-only" htmlFor={`to-${i}`}>
                        {d.day} closes
                      </label>
                      <input
                        id={`to-${i}`}
                        type="time"
                        className="field w-auto"
                        value={d.to}
                        disabled={!d.open}
                        onChange={(e) => setDay(i, { to: e.target.value })}
                      />
                    </div>
                    {!d.open && (
                      <span className="text-sm text-steel-500">Closed</span>
                    )}
                    {errors[`day-${i}`] && (
                      <p
                        role="alert"
                        className="w-full text-sm font-semibold text-red-700"
                      >
                        {errors[`day-${i}`]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={copyFirstOpenDay}
                className="mt-3 text-sm font-semibold underline"
              >
                Use the first open day&apos;s hours for all open days
              </button>
              <label className="mt-5 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 accent-steel-900"
                  checked={p.emergency}
                  onChange={(e) => update("emergency", e.target.checked)}
                />
                <span>
                  <span className="font-semibold">
                    I take emergency callouts
                  </span>
                  <span className="block text-sm text-steel-500">
                    Outside regular hours, for urgent leaks, power loss and
                    similar.
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* STEP 5: Licenses */}
          {step === 4 && (
            <div>
              <p className="text-steel-700">
                Add your TESDA certificates, PRC license, permits and other
                credentials. This step is optional, but listings with
                credentials build more trust.
              </p>
              <ul className="mt-4 space-y-4">
                {p.licenses.map((l) => {
                  const types = licenseTypesFor(p.kind);
                  const placeholder = types.find(
                    (t) => t.id === l.type,
                  )?.placeholder;
                  return (
                    <li
                      key={l.id}
                      className="rounded-lg border border-steel-500/30 bg-white p-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Type">
                          <select
                            className="field"
                            value={l.type}
                            onChange={(e) =>
                              setLicense(l.id, { type: e.target.value })
                            }
                          >
                            {types.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field
                          label="Certificate or license name"
                          error={errors[`lic-${l.id}`]}
                        >
                          <input
                            className="field"
                            value={l.title}
                            placeholder={placeholder}
                            onChange={(e) =>
                              setLicense(l.id, { title: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Certificate number (optional)">
                          <input
                            className="field"
                            value={l.number}
                            onChange={(e) =>
                              setLicense(l.id, { number: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Valid until (optional)">
                          <input
                            className="field"
                            type="month"
                            value={l.expiry}
                            onChange={(e) =>
                              setLicense(l.id, { expiry: e.target.value })
                            }
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLicense(l.id)}
                        className="mt-3 text-sm font-semibold text-red-700 underline"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={addLicense}
                className="btn-outline mt-4 w-full sm:w-auto"
              >
                + Add a license or certificate
              </button>
            </div>
          )}

          {/* STEP 6: Review */}
          {step === LAST && (
            <div>
              <p className="mb-4 text-steel-700">
                Check how your portfolio looks. Use Back to change anything.
              </p>
              <PortfolioPreview p={p} />
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="btn-outline"
                disabled={saving}
              >
                Back
              </button>
            )}
            {step < LAST ? (
              <button
                type="button"
                onClick={onNext}
                className="btn flex-1 sm:flex-none"
              >
                Continue
              </button>
            ) : (
              <div className="flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="btn w-full disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create my portfolio"}
                </button>
                {submitError && (
                  <p role="alert" className="mt-2 font-semibold text-red-700">
                    {submitError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live preview (desktop only; appears once a type is chosen; the review step shows it inline) */}
        {step > 0 && step < LAST && (
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <p className="mb-2 text-sm font-semibold text-steel-500">
                Live preview
              </p>
              <PortfolioPreview p={p} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { liveQuery } from "dexie";
import { db, type LocalPro } from "@/lib/offline-db";
import { TRADES } from "@/lib/mock";

function fieldLabel(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function reportValue(value: unknown): ReactNode {
  if (value == null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="list-disc space-y-1 pl-4">
        {value.map((item, index) => <li key={index}>{reportValue(item)}</li>)}
      </ul>
    ) : "None listed";
  }
  if (typeof value === "object") {
    return <dl className="space-y-2">{Object.entries(value).map(([key, item]) => (
      <div key={key}><dt className="font-semibold">{fieldLabel(key)}</dt><dd>{reportValue(item)}</dd></div>
    ))}</dl>;
  }
  return "Not provided";
}

export default function RepairReport({ assessment, summary, tradeKey }: {
  assessment: Record<string, unknown>;
  summary: string;
  tradeKey: string | null;
}) {
  const [directory, setDirectory] = useState<{
    key: string | null;
    pros: LocalPro[];
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (!tradeKey) return;
    const subscription = liveQuery(() => db.workers
      .where("trade").equalsIgnoreCase(tradeKey.trim()).toArray())
      .subscribe({
        next: (pros) => setDirectory({ key: tradeKey, pros, error: false }),
        error: () => setDirectory({ key: tradeKey, pros: [], error: true }),
      });
    return () => subscription.unsubscribe();
  }, [tradeKey]);

  const current = directory?.key === tradeKey ? directory : null;
  const tradeName = TRADES.find((trade) => trade.id === tradeKey)?.label ?? tradeKey;

  return (
    <>
      <span className="inline-block rounded bg-steel-900 px-2 py-0.5 text-xs font-bold text-white">Repair report ready</span>
      <h2 className="mt-3 text-lg font-bold">Your repair report</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm text-steel-700">{summary}</p>
      <dl className="mt-4 space-y-3 rounded-lg border border-steel-500/30 bg-white p-4 text-sm">
        {Object.entries(assessment).map(([key, value]) => (
          <div key={key}>
            <dt className="font-bold">{fieldLabel(key)}</dt>
            <dd className="mt-1 whitespace-pre-wrap wrap-break-word text-steel-700">
              {key === "trade" ? tradeName ?? "Needs clarification" : reportValue(value)}
            </dd>
          </div>
        ))}
        {Object.keys(assessment).length === 0 && <div>No assessment details were supplied.</div>}
      </dl>
      <h3 className="mt-5 font-bold">Matching professionals</h3>
      <p className="mt-1 text-xs text-steel-500">From your locally stored directory{tradeName ? ` · ${tradeName}` : ""}.</p>
      <div className="mt-3 space-y-3" aria-live="polite">
        {!tradeKey ? (
          <p className="text-sm">Ask the assistant to clarify the trade to find matching professionals.</p>
        ) : !current ? (
          <p role="status" className="text-sm">Loading professionals…</p>
        ) : current.error ? (
          <p role="alert" className="text-sm text-red-700">Couldn’t read the local directory. Reload to try again.</p>
        ) : current.pros.length === 0 ? (
          <p role="status" className="text-sm">No professionals for this trade are stored on this device yet.</p>
        ) : current.pros.map((pro) => (
          <article key={pro.id} className="rounded-lg border border-steel-500/30 bg-white p-4">
            <h4 className="font-bold">{pro.businessName || pro.displayName}</h4>
            {pro.businessName && <p className="text-sm text-steel-700">{pro.displayName}</p>}
            <p className="mt-1 text-sm text-steel-700">Serves {pro.area}</p>
            {pro.about && <p className="mt-2 text-sm">{pro.about}</p>}
            {pro.phone ? (
              <a href={`tel:${pro.phone.replace(/\s/g, "")}`} className="btn-dark mt-3 block text-center">Call {pro.phone}</a>
            ) : <p className="mt-2 text-xs text-steel-500">Phone number unavailable</p>}
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-steel-500">Keep chatting to refine your repair report.</p>
    </>
  );
}

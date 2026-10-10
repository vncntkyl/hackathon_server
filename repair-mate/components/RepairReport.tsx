"use client";

import { type ReactNode } from "react";
import { TRADES } from "@/lib/mock";

function fieldLabel(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function reportValue(value: unknown): ReactNode {
  if (value == null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="list-disc space-y-1 pl-4">
        {value.map((item, index) => (
          <li key={index}>{reportValue(item)}</li>
        ))}
      </ul>
    ) : (
      "None listed"
    );
  }
  if (typeof value === "object") {
    return (
      <dl className="space-y-2">
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt className="font-semibold">{fieldLabel(key)}</dt>
            <dd>{reportValue(item)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return "Not provided";
}

export default function RepairReport({
  assessment,
  tradeKey,
}: {
  assessment: Record<string, unknown>;
  tradeKey: string | null;
}) {
  const tradeName =
    TRADES.find((trade) => trade.id === tradeKey)?.label ?? tradeKey;

  return (
    <>
      <span className="inline-block rounded bg-steel-900 px-2 py-0.5 text-xs font-bold text-white">
        Repair report ready
      </span>
      <h2 className="mt-3 text-lg font-bold">Your repair report</h2>
      <dl className="mt-4 space-y-3 rounded-lg border border-steel-500/30 bg-white p-4 text-sm">
        {Object.entries(assessment)
          .filter(([key]) => key !== "followUpQuestions")
          .map(([key, value]) => (
            <div key={key}>
              <dt className="font-bold">{fieldLabel(key)}</dt>
              <dd className="mt-1 whitespace-pre-wrap wrap-break-word text-steel-700">
                {key === "trade"
                  ? (tradeName ?? "Needs clarification")
                  : reportValue(value)}
              </dd>
            </div>
          ))}
        {Object.keys(assessment).length === 0 && (
          <div>No assessment details were supplied.</div>
        )}
      </dl>
    </>
  );
}

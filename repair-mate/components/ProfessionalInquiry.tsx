"use client";

function describe(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(describe).filter(Boolean).join("; ");
  if (typeof value === "object") return Object.entries(value).map(([key, item]) => `${label(key)}: ${describe(item)}`).join("; ");
  return String(value);
}

function label(key: string): string {
  const text = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ProfessionalInquiry({ name, phone, location, tradeName, report }: {
  name: string;
  phone: string | null;
  location: string;
  tradeName: string | null;
  report: { summary: string; assessment: Record<string, unknown> };
}) {
    const details = Object.entries(report.assessment)
      .filter(([key, value]) => key !== "followUpQuestions" && key !== "trade" && describe(value))
      .map(([key, value]) => `${label(key)}: ${describe(value)}`);
    const message = [
      `Hi ${name}, I'd like to request your help with a repair in ${location}.`,
      tradeName ? `Service needed: ${tradeName}` : "",
      details.length ? `Assessment details:\n${details.join("\n")}` : "",
      "Are you available to assess this job? Please share your earliest availability and an estimated quote, including labor and any materials. Thank you!",
    ].filter(Boolean).join("\n\n");
  const recipient = phone?.replace(/[^+0-9]/g, "");
  if (!recipient) return <p className="mb-3 text-xs text-steel-500">Messaging unavailable: no phone number provided.</p>;

  return <a
    href={`sms:${recipient}?body=${encodeURIComponent(message)}`}
    className="btn mb-3 w-full"
    aria-label={`Request ${name} by text message`}
  >Send a Message</a>;
}

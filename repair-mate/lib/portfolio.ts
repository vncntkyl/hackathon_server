import { formatPHP } from "./currency";

export type Kind = "business" | "individual";

export type DaySchedule = {
  day: string;
  short: string;
  open: boolean;
  from: string; // "HH:MM" 24h
  to: string;
};

export type License = {
  id: string;
  type: string;
  title: string;
  number: string;
  expiry: string;
};

export type Portfolio = {
  kind: Kind | null;
  businessName: string; // business only
  ownerName: string; // owner (business) or the worker's own name (individual)
  teamSize: string; // business only
  trade: string;
  years: string;
  area: string;
  about: string;
  phone: string;
  altPhone: string;
  email: string;
  messenger: string;
  address: string; // business only
  schedule: DaySchedule[];
  emergency: boolean;
  licenses: License[];
  rateMin: string;
  rateMax: string;
  rateUnit: RateUnit;
};

export type RateUnit = "hour" | "day" | "job";

export const LICENSE_TYPES: { id: string; label: string; placeholder: string; only?: Kind }[] = [
  { id: "tesda", label: "TESDA National Certificate", placeholder: "e.g. Plumbing NC II" },
  { id: "prc", label: "PRC license", placeholder: "e.g. Registered Master Plumber" },
  { id: "dti", label: "DTI / SEC business registration", placeholder: "e.g. DTI Business Name Registration", only: "business" },
  { id: "permit", label: "Barangay / Mayor's permit", placeholder: "e.g. Mayor's Permit 2026" },
  { id: "other", label: "Other certificate or training", placeholder: "e.g. Safety training certificate" },
];

export const licenseTypesFor = (kind: Kind | null) =>
  LICENSE_TYPES.filter((t) => !t.only || t.only === kind);

export const licenseTypeLabel = (id: string) =>
  LICENSE_TYPES.find((t) => t.id === id)?.label ?? "Other";

const DAYS: [string, string][] = [
  ["Monday", "Mon"],
  ["Tuesday", "Tue"],
  ["Wednesday", "Wed"],
  ["Thursday", "Thu"],
  ["Friday", "Fri"],
  ["Saturday", "Sat"],
  ["Sunday", "Sun"],
];

export const defaultSchedule = (): DaySchedule[] =>
  DAYS.map(([day, short], i) => ({
    day,
    short,
    open: i < 6, // Mon-Sat open, Sunday closed
    from: "08:00",
    to: "17:00",
  }));

export const emptyPortfolio = (): Portfolio => ({
  kind: null,
  businessName: "",
  ownerName: "",
  teamSize: "",
  trade: "",
  years: "",
  area: "",
  about: "",
  phone: "",
  altPhone: "",
  email: "",
  messenger: "",
  address: "",
  schedule: defaultSchedule(),
  emergency: false,
  licenses: [],
  rateMin: "",
  rateMax: "",
  rateUnit: "day",
});

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
export const RATE_UNITS: { id: RateUnit; label: string }[] = [
  { id: "hour", label: "per hour" },
  { id: "day", label: "per day" },
  { id: "job", label: "per job" },
];

const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

// "₱800–₱1,200 per day" or "From ₱800 per day"
export function formatRate(
  min: number | null | undefined,
  max: number | null | undefined,
  unit: RateUnit | null | undefined
): string | null {
  if (!min || !unit) return null;
  const label = RATE_UNITS.find((u) => u.id === unit)?.label ?? "";
  if (max && max > min) return `${formatPHP(min)}–${formatPHP(max)} ${label}`;
  return `From ${formatPHP(min)} ${label}`;
}

// Groups consecutive open days with identical hours: "Mon–Fri · 8:00 AM–5:00 PM"
export function summarizeSchedule(days: DaySchedule[]): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < days.length) {
    const d = days[i];
    if (!d.open) {
      i++;
      continue;
    }
    let j = i;
    while (
      j + 1 < days.length &&
      days[j + 1].open &&
      days[j + 1].from === d.from &&
      days[j + 1].to === d.to
    ) {
      j++;
    }
    const range = i === j ? d.short : `${d.short}–${days[j].short}`;
    lines.push(`${range} · ${formatTime(d.from)}–${formatTime(d.to)}`);
    i = j + 1;
  }
  return lines;
}
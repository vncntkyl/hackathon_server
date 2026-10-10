import type { Pro } from "./types";

export const TRADES = [
  { id: "plumbing", label: "Plumber" },
  { id: "electrical", label: "Electrician" },
  { id: "carpentry", label: "Carpenter" },
  { id: "painting", label: "Painter" },
  { id: "appliance", label: "Appliance repair" },
  { id: "general", label: "Handyman" },
];

export const tradeLabel = (id: string) =>
  TRADES.find((t) => t.id === id)?.label ?? "Handyman";


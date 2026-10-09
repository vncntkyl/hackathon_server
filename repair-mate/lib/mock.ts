import type { Pro } from "./types";

export const TRADES = [
  { id: "plumbing", label: "Plumber" },
  { id: "electrical", label: "Electrician" },
  { id: "carpentry", label: "Carpenter" },
  { id: "painting", label: "Painter" },
  { id: "roofing", label: "Roofer" },
  { id: "hvac", label: "Aircon tech" },
  { id: "masonry", label: "Mason / Tiler" },
  { id: "welding", label: "Welder" },
  { id: "appliance", label: "Appliance repair" },
  { id: "general", label: "Handyman" },
];

export const tradeLabel = (id: string) =>
  TRADES.find((t) => t.id === id)?.label ?? "Handyman";

// Sample listings for design purposes only.
export const SAMPLE_PROS: Pro[] = [
  {
      id: "1",
      name: "Ramon Dela Cruz",
      business: "RDC Plumbing & Pipes",
      trade: "plumbing",
      area: "Quezon City",
      years: 14,
      licensed: true,
      about: "Leak repairs, clogged drains, water heater installs. Same-day callouts.",
      phone: "0917 000 0001",
      createdAt: "",
      email: ""
  },
  {
      id: "2",
      name: "Liza Santos",
      business: "Santos Electrical Works",
      trade: "electrical",
      area: "Makati",
      years: 9,
      licensed: true,
      about: "Rewiring, breaker panels, outlet and lighting repairs for homes and condos.",
      phone: "0917 000 0002",
      createdAt: "",
      email: ""
  },
  {
      id: "3",
      name: "Eduardo Reyes",
      business: "",
      trade: "carpentry",
      area: "Pasig",
      years: 22,
      licensed: false,
      about: "Cabinets, doors, shelving and wood floor repairs. Free estimates.",
      phone: "0917 000 0003",
      createdAt: "",
      email: ""
  },
  {
      id: "4",
      name: "Marites Bautista",
      business: "CoolAir Service",
      trade: "hvac",
      area: "Mandaluyong",
      years: 7,
      licensed: true,
      about: "Aircon cleaning, freon refills and repairs for split and window units.",
      phone: "0917 000 0004",
      createdAt: "",
      email: ""
  },
];
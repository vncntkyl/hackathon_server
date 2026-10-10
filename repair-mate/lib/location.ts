// Explicit aliases avoid guessing abbreviations or matching unrelated cities.
const CITY_ALIASES: Record<string, string> = {
  qc: "quezon",
  "q c": "quezon",
};

export function normalizeCity(value: string): string {
  const city = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\./g, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^city of\s+/, "")
    .replace(/\s+city$/, "")
    .trim();
  return CITY_ALIASES[city] ?? city;
}

export function servesCity(serviceAreas: string, location: string): boolean {
  const city = normalizeCity(location);
  console.log(city)
  return (
    city !== "" &&
    serviceAreas.split(",").some((area) => normalizeCity(area) === city)
  );
}

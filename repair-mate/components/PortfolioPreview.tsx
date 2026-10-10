import { tradeLabel } from "@/lib/mock";
import {
  formatRate,
  licenseTypeLabel,
  summarizeSchedule,
  type Portfolio,
} from "@/lib/portfolio";

export default function PortfolioPreview({ p }: { p: Portfolio }) {
  const hours = summarizeSchedule(p.schedule);
  const isIndividual = p.kind === "individual";
  const headline = isIndividual ? p.ownerName : p.businessName;
  const placeholder = isIndividual
    ? "Your name"
    : p.kind === "business"
      ? "Your business name"
      : "Your name or business";
  const trade = p.trade ? tradeLabel(p.trade) : "";

  const rate = formatRate(
    p.rateMin ? Number(p.rateMin) : null,
    p.rateMax ? Number(p.rateMax) : null,
    p.rateUnit,
  );

  return (
    <article className="overflow-hidden rounded-lg border border-steel-500/30 bg-white">
      <div className="border-b-4 border-hivis bg-steel-900 p-4 text-white">
        {p.kind && (
          <span className="mb-2 inline-block rounded bg-hivis px-2 py-0.5 text-xs font-bold text-steel-900">
            {isIndividual ? "Independent pro" : "Business"}
          </span>
        )}
        <h3 className="text-xl font-extrabold leading-tight">
          {headline || <span className="text-steel-500">{placeholder}</span>}
        </h3>
        <p className="mt-1 text-sm text-steel-100">
          {isIndividual
            ? trade || "Your trade"
            : `${p.ownerName || "Owner"}${trade ? ` · ${trade}` : ""}`}
        </p>
      </div>

      <div className="space-y-4 p-4 text-sm">
        <p>
          {p.area ? `Serves ${p.area}` : "Service area"}
          {p.years ? ` · ${p.years} yrs experience` : ""}
          {!isIndividual && p.teamSize ? ` · Team of ${p.teamSize}` : ""}
        </p>

        {p.about && <p className="text-steel-700">{p.about}</p>}

        <section>
          <h4 className="font-bold">Labor fee</h4>
          {rate ? (
            <>
              <p className="mt-1 text-base font-bold">{rate}</p>
              <p className="text-xs text-steel-500">
                Estimate for labor only. Materials not included. Final price
                after inspection.
              </p>
            </>
          ) : (
            <p className="mt-1 text-steel-500">Labor fee range</p>
          )}
        </section>

        <section>
          <h4 className="font-bold">
            {isIndividual ? "Availability" : "Working hours"}
          </h4>
          {hours.length ? (
            <ul className="mt-1 space-y-0.5 text-steel-700">
              {hours.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-steel-500">No days selected</p>
          )}
          {p.emergency && (
            <p className="mt-2 inline-block rounded bg-hivis px-2 py-1 text-xs font-bold">
              Emergency callouts available
            </p>
          )}
        </section>

        <section>
          <h4 className="font-bold">Licenses &amp; certificates</h4>
          {p.licenses.length ? (
            <ul className="mt-2 space-y-2">
              {p.licenses.map((l) => (
                <li
                  key={l.id}
                  className="rounded border border-steel-500/30 p-2"
                >
                  <p className="font-semibold">{l.title || "Untitled"}</p>
                  <p className="text-xs text-steel-500">
                    {licenseTypeLabel(l.type)}
                    {l.number ? ` · No. ${l.number}` : ""}
                    {l.expiry ? ` · Valid until ${l.expiry}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-steel-500">None added yet</p>
          )}
          {p.licenses.length > 0 && (
            <p className="mt-2 text-xs text-steel-500">
              Self-declared. Verification coming soon.
            </p>
          )}
        </section>

        <section>
          <h4 className="font-bold">Contact</h4>
          <ul className="mt-1 space-y-0.5 text-steel-700">
            <li>{p.phone || "Phone number"}</li>
            {p.altPhone && <li>{p.altPhone}</li>}
            {p.email && <li>{p.email}</li>}
            {p.messenger && <li>Messenger / Facebook: {p.messenger}</li>}
            {!isIndividual && p.address && <li>{p.address}</li>}
          </ul>
        </section>
      </div>
    </article>
  );
}

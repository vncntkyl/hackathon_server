"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { db, type LocalPro } from "@/lib/offline-db";
import { TRADES } from "@/lib/mock";
import { servesCity } from "@/lib/location";
import { formatPHP } from "@/lib/currency";
import ProfessionalInquiry from "@/components/ProfessionalInquiry";

export default function MatchingProfessionals({
  tradeKey,
  location,
  report,
}: {
  tradeKey: string | null;
  location: string;
  report: { summary: string; assessment: Record<string, unknown> };
}) {
  const [directory, setDirectory] = useState<{
    key: string;
    pros: LocalPro[];
    error: boolean;
  } | null>(null);
  const [kind, setKind] = useState("");
  const [experience, setExperience] = useState("");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [unit, setUnit] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!tradeKey) return;
    const subscription = liveQuery(() =>
      db.workers.where("trade").equalsIgnoreCase(tradeKey.trim()).toArray(),
    ).subscribe({
      next: (pros) => setDirectory({ key: tradeKey, pros, error: false }),
      error: () => setDirectory({ key: tradeKey, pros: [], error: true }),
    });
    return () => subscription.unsubscribe();
  }, [tradeKey]);

  const current = directory?.key === tradeKey ? directory : null;
  const pros = (current?.pros ?? []).filter((pro) =>
    servesCity(pro.area, location),
  );
  const invalidRange =
    minimum !== "" && maximum !== "" && Number(minimum) > Number(maximum);
  const filtered = pros.filter(
    (pro) =>
      (!kind || pro.kind === kind) &&
      (!experience ||
        (pro.yearsExperience !== null &&
          pro.yearsExperience >= Number(experience))) &&
      (!unit || pro.rateUnit === unit) &&
      (!emergency || pro.emergency) &&
      (!verified || pro.licenses.some((license) => license.verified)) &&
      (minimum === "" ||
        (pro.rateMin !== null && pro.rateMin >= Number(minimum))) &&
      (maximum === "" ||
        (pro.rateMax !== null && pro.rateMax <= Number(maximum))),
  );
  const tradeName =
    TRADES.find((trade) => trade.id === tradeKey)?.label ?? tradeKey;

  function clearFilters() {
    setKind("");
    setExperience("");
    setMinimum("");
    setMaximum("");
    setUnit("");
    setEmergency(false);
    setVerified(false);
  }

  return (
    <section
      aria-label="Matching professionals"
      className="mt-8 rounded-lg border border-steel-500/30 bg-white p-5 sm:p-6"
    >
      <h2 className="text-xl font-bold">Matching professionals</h2>
      <p className="mt-1 text-sm text-steel-700">
        {tradeName ? `${tradeName} · ` : ""}Professionals serving {location}{" "}
        from your locally stored directory.
      </p>
      <fieldset
        className="mt-5"
        disabled={!current || current.error || !pros.length}
      >
        <legend className="font-semibold">Filter professionals</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold">
            Professional type
            <select
              className="field mt-1 w-full"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="">All types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Minimum years of experience
            <input
              type="number"
              min="0"
              step="1"
              className="field mt-1 w-full"
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              placeholder="Any experience"
            />
          </label>
          <label className="text-sm font-semibold">
            Minimum rate (PHP)
            <input
              type="number"
              min="0"
              step="any"
              className="field mt-1 w-full"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              placeholder="No minimum"
              aria-describedby="rate-filter-hint"
              aria-invalid={invalidRange}
            />
          </label>
          <label className="text-sm font-semibold">
            Maximum rate (PHP)
            <input
              type="number"
              min="0"
              step="any"
              className="field mt-1 w-full"
              value={maximum}
              onChange={(event) => setMaximum(event.target.value)}
              placeholder="No maximum"
              aria-describedby="rate-filter-hint"
              aria-invalid={invalidRange}
            />
          </label>
          <label className="text-sm font-semibold">
            Rate unit
            <select
              className="field mt-1 w-full"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            >
              <option value="">All rate units</option>
              <option value="HOUR">Per hour</option>
              <option value="DAY">Per day</option>
              <option value="JOB">Per job</option>
            </select>
          </label>
        </div>
        <p id="rate-filter-hint" className="mt-2 text-xs text-steel-500">
          Minimum checks their starting rate; maximum checks their highest rate.
          Professionals without the required rate detail are excluded. Choose a
          rate unit to compare like rates.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(event) => setEmergency(event.target.checked)}
            />
            Emergency service
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={verified}
              onChange={(event) => setVerified(event.target.checked)}
            />
            Verified credentials
          </label>
          <button
            type="button"
            onClick={clearFilters}
            className="font-semibold underline"
          >
            Clear filters
          </button>
        </div>
      </fieldset>
      <div className="mt-5" aria-live="polite">
        {!tradeKey ? (
          <p>
            Ask the assistant to clarify the trade to find matching
            professionals.
          </p>
        ) : !current ? (
          <p role="status">Loading professionals…</p>
        ) : current.error ? (
          <p role="alert">
            Couldn't read the local directory. Reload to try again.
          </p>
        ) : !pros.length ? (
          <p>
            No professionals for this trade serving {location} are stored on
            this device yet.
          </p>
        ) : invalidRange ? (
          <p role="alert" className="text-red-700">
            Minimum rate must be less than or equal to maximum rate.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-steel-700">
              {filtered.length} of {pros.length} professionals match your
              filters.
            </p>
            {!filtered.length && <p>Try adjusting or clearing your filters.</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((pro) => (
                <article
                  key={pro.id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-steel-500/30 wrap-break-word"
                >
                  <header className="flex items-start justify-between gap-3 border-b-4 border-hivis bg-steel-700 px-4 py-4 text-white">
                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold leading-tight">
                        {pro.businessName || pro.displayName}
                      </h3>
                      <p className="mt-1 text-sm text-white/80">
                        {pro.kind === "BUSINESS" ? "Business" : "Individual"}
                      </p>
                    </div>
                    <span className="max-w-[45%] shrink-0 rounded-md border border-white/25 bg-white/15 px-2.5 py-1 text-right text-xs font-semibold">
                      {tradeName}
                    </span>
                  </header>
                  <div className="flex flex-1 flex-col p-4">
                    <ul
                      aria-label="Service areas"
                      className="mb-3 flex flex-wrap gap-2"
                    >
                      {[
                        ...new Set(
                          pro.area
                            .split(",")
                            .map((city) => city.trim())
                            .filter(Boolean),
                        ),
                      ].map((city) => (
                        <li
                          key={city}
                          className="rounded-full border border-steel-500/20 bg-steel-100 px-2.5 py-1 text-xs font-semibold text-steel-900"
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-sm">
                      {pro.yearsExperience === null
                        ? "Experience not provided"
                        : `${pro.yearsExperience} years of experience`}
                    </p>
                    {pro.teamSize !== null && (
                      <p className="mt-1 text-sm">Team of {pro.teamSize}</p>
                    )}
                    <p className="mt-2 font-semibold">
                      {pro.rateMin === null && pro.rateMax === null
                        ? "Ask for a quote"
                        : pro.rateMin !== null && pro.rateMax !== null
                          ? `${formatPHP(pro.rateMin)} – ${formatPHP(pro.rateMax)}`
                          : pro.rateMin !== null
                            ? `From ${formatPHP(pro.rateMin)}`
                            : `Up to ${formatPHP(pro.rateMax!)}`}
                      {pro.rateUnit ? ` / ${pro.rateUnit.toLowerCase()}` : ""}
                    </p>
                    {pro.emergency && (
                      <p className="mt-2 text-xs font-semibold">
                        Emergency service available
                      </p>
                    )}
                    {pro.licenses.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {pro.licenses.map((license, index) => (
                          <li key={index}>
                            {license.title || license.type}
                            {license.verified ? " · Verified" : " · Unverified"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {pro.about && (
                      <p className="mt-2 text-sm text-steel-700">{pro.about}</p>
                    )}
                    <div className="mt-auto pt-4">
                      <ProfessionalInquiry
                        phone={pro.phone}
                        name={pro.businessName || pro.displayName}
                        location={location}
                        tradeName={tradeName}
                        report={report}
                      />
                      {pro.phone ? (
                        <a
                          href={`tel:${pro.phone.replace(/\s/g, "")}`}
                          className="btn-dark block text-center"
                        >
                          Call {pro.phone}
                        </a>
                      ) : (
                        <p className="text-xs text-steel-500">
                          Phone number unavailable
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

import { tradeLabel } from "@/lib/mock";
import type { Pro } from "@/lib/types";

export default function ProCard({ pro }: { pro: Pro }) {
  return (
    <article className="flex flex-col rounded-lg border border-steel-500/30 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold leading-tight">
            {pro.business || pro.name}
          </h3>
          <p className="text-sm text-steel-500">
            {pro.business ? `${pro.name} · ` : ""}
            {tradeLabel(pro.trade)}
          </p>
        </div>
        {pro.licensed && (
          <span className="shrink-0 rounded bg-hivis px-2 py-1 text-xs font-bold">
            Licensed
          </span>
        )}
      </div>
      <p className="mt-2 text-sm">
        Serves {pro.area} · {pro.years} yrs experience
      </p>
      <p className="mt-2 text-base font-extrabold">
        {pro.rate ?? "Ask for a quote"}
      </p>
      <p className="mt-2 flex-1 text-sm text-steel-700">{pro.about}</p>
      <a
        href={`tel:${pro.phone.replace(/\s/g, "")}`}
        className="btn-dark mt-3 w-full"
      >
        Call {pro.phone}
      </a>
    </article>
  );
}

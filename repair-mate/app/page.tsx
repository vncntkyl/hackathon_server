import Link from "next/link";
import ProCard from "@/components/Procard";

const STEPS = [
  {
    title: "Describe the problem",
    body: "Tell repAIrmate what's broken in your own words.",
  },
  {
    title: "Get matched",
    body: "We pick professionals fit for the job and available around the area.",
  },
  {
    title: "Call and compare",
    body: "Phone them directly and get a written quote.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero with the two user paths */}
      <section className="bg-steel-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Home repair problems? Find the right man for the job.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-steel-100">
            repAIrmate connects homeowners with trusted blue collar
            professionals.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-hivis p-6 text-steel-900">
              <h2 className="text-2xl font-extrabold">I need a repair</h2>
              <p className="mt-1">
                Chat about your home repair request and get matched with a blue
                collar professional near you.
              </p>
              <Link href="/chat" className="btn-dark mt-5 w-full sm:w-auto">
                Chat Home Repair Request
              </Link>
            </div>
            <div className="rounded-lg border-2 border-white/30 p-6">
              <h2 className="text-2xl font-extrabold">
                I&apos;m a Blue Collar Professional
              </h2>
              <p className="mt-1 text-steel-100">
                List your business for free and let homeowners in your area call
                you directly.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-white px-5 py-3 font-bold text-steel-900 hover:bg-steel-100 sm:w-auto"
              >
                Register your business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trades
      <section className="mx-auto max-w-5xl px-4 pt-10">
        <h2 className="text-2xl font-extrabold">
          Skills available on repAIrmate
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TRADES.map((t) => (
            <li key={t.id}>
              <Link
                href={`/chat?trade=${t.id}`}
                className="block rounded-full border-2 border-steel-900 px-4 py-2 text-sm font-semibold hover:bg-hivis"
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </section> */}

      {/* Sample pros
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-extrabold">Pros near you</h2>
          <span className="text-sm text-steel-500">Sample listings</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_PROS.map((p) => (
            <ProCard key={p.id} pro={p} />
          ))}
        </div>
      </section> */}

      {/* How it works */}
      <section className="border-t border-steel-500/20 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="text-2xl font-extrabold">How it works</h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-steel-900 font-bold text-hivis">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-steel-700">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

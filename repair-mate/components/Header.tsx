import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b-4 border-hivis bg-steel-900 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          rep<span className="text-hivis">AI</span>rmate
        </Link>
        <nav className="flex gap-1 text-sm font-semibold sm:gap-3">
          <Link href="/chat" className="rounded px-3 py-2 hover:bg-steel-700">
            Report a problem
          </Link>
          <Link
            href="/register"
            className="rounded bg-hivis px-3 py-2 text-steel-900 hover:bg-hivis-dark"
          >
            Register as a pro
          </Link>
        </nav>
      </div>
    </header>
  );
}

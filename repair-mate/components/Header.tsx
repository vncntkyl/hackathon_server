import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b-4 border-hivis bg-steel-900 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          rep<span className="text-hivis">AI</span>rmate
        </Link>
      </div>
    </header>
  );
}

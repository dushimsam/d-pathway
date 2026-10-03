import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-300 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="rounded-sm text-[20px] font-semibold text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          D-Pathway
        </Link>
        <Link
          href="/signin"
          className="rounded-sm px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

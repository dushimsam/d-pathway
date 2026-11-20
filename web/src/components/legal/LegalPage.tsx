import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared layout for the public legal pages (/privacy, /terms). Light, high-
 * contrast reading surface matching the public profile page, with the app's
 * display font for headings and a comfortable measure on phones.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#0b1020]">
      <header className="border-b border-[#eef0f6]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-[20px] font-extrabold tracking-tight">
            D<span className="text-[#2847d3]">·</span>Pathway
          </Link>
          <Link
            href="/login"
            className="text-[14px] font-semibold text-[#2847d3] hover:underline"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-[13px] font-medium text-[#7a8198]">
          Last updated: {lastUpdated}
        </p>
        {intro && (
          <p className="mt-5 text-[15px] leading-relaxed text-[#3a4056]">{intro}</p>
        )}

        <div className="mt-8 flex flex-col gap-8">{children}</div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#eef0f6] pt-6 text-[14px]">
          <Link href="/privacy" className="text-[#2847d3] hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[#2847d3] hover:underline">
            Terms of Use
          </Link>
          <Link href="/" className="text-[#7a8198] hover:text-[#0b1020]">
            Back to home
          </Link>
        </div>
        <p className="mt-6 font-mono text-[12px] leading-relaxed text-[#9aa0b4]">
          Built in Kigali. Personal data is stored in Rwanda, aligned with Law
          No. 058/2021 on personal data protection.
        </p>
      </main>
    </div>
  );
}

/** One titled section of a legal page. `n` renders a leading number for Terms. */
export function LegalSection({
  title,
  n,
  children,
}: {
  title: string;
  n?: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-[20px] font-bold text-[#0b1020]">
        {n != null && <span className="text-[#2847d3]">{n}. </span>}
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-2 text-[15px] leading-relaxed text-[#3a4056]">
        {children}
      </div>
    </section>
  );
}

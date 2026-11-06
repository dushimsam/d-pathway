'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

const AVATARS = [
  '/images/real/work-tailors.jpg',
  '/images/real/work-market.jpg',
  '/images/real/work-agritech.jpg',
  '/images/real/work-mobile.jpg',
];

const PARTNERS = ['ALU', 'University of Rwanda', 'CMU-Africa', 'AUCA', 'INES', 'RCA'];

const HERO_GRADIENT =
  'radial-gradient(130% 120% at 88% 108%, rgba(90,150,255,0.65) 0%, rgba(60,90,230,0) 45%),' +
  'radial-gradient(90% 90% at 12% 0%, rgba(120,140,255,0.28) 0%, rgba(10,25,80,0) 55%),' +
  'linear-gradient(118deg, #0a1550 0%, #122a7a 52%, #2a56d6 100%)';

/**
 * Landing-page first screen: a light top nav, a blue gradient hero card with a
 * real photo and floating project cards, and a "trusted by" partner strip.
 * The STUDENT / ORGANISATION toggle retargets the primary CTA and the copy.
 */
export function HeroScreen({ home }: { home: string | null }) {
  const [mode, setMode] = useState<'STUDENT' | 'ORGANISATION'>('STUDENT');
  const isStudent = mode === 'STUDENT';

  const primaryHref =
    home ?? (isStudent ? '/register/graduate' : '/register/company');
  const primaryLabel = home ? 'Continue to dashboard' : 'Start free trial';

  return (
    <div className="bg-white text-[#0b1020]">
      <div className="b-container b-container--wide pb-16 pt-5">
        {/* ---- Nav ---- */}
        <nav className="mb-7 flex items-center justify-between">
          <Link
            href="/"
            className="text-[22px] font-extrabold tracking-tight text-[#0b1020] no-underline"
          >
            D<span className="text-[#2847d3]">·</span>Pathway
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            <a href="#how" className="text-[15px] font-medium text-[#2b3040] transition-colors hover:text-[#2847d3]">
              How it works
            </a>
            <a href="#briefs" className="text-[15px] font-medium text-[#2b3040] transition-colors hover:text-[#2847d3]">
              For students
            </a>
            <a href="#why" className="text-[15px] font-medium text-[#2b3040] transition-colors hover:text-[#2847d3]">
              For organisations
            </a>
          </div>

          <div className="flex items-center gap-3">
            {home ? (
              <Link
                href={home}
                className="rounded-[10px] bg-[#2847d3] px-[18px] py-2.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(40,71,211,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-[10px] border border-[#e3e6ee] bg-white px-[18px] py-2.5 text-[15px] font-semibold text-[#1b2030] transition-colors hover:border-[#c7ccda] sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/register/graduate"
                  className="rounded-[10px] bg-[#2847d3] px-[18px] py-2.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(40,71,211,0.35)] transition-transform hover:-translate-y-0.5"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* ---- Hero card ---- */}
        <section
          className="relative min-h-[500px] overflow-hidden rounded-[26px]"
          style={{ background: HERO_GRADIENT }}
        >
          {/* photo, faded into the gradient on its left edge (desktop only) */}
          <div
            aria-hidden
            className="absolute right-0 top-0 hidden h-full w-[54%] md:block"
            style={{
              backgroundImage: "url('/images/real/hero-collaborate.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 28%',
              WebkitMaskImage:
                'linear-gradient(90deg, transparent 0%, #000 26%, #000 100%)',
              maskImage:
                'linear-gradient(90deg, transparent 0%, #000 26%, #000 100%)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(118deg, rgba(10,21,80,0.55) 0%, rgba(18,42,122,0.12) 40%, transparent 70%)',
              }}
            />
          </div>

          {/* content */}
          <div className="relative z-[2] flex min-h-[500px] flex-col p-8 sm:p-11">
            <div className="inline-flex w-max gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur">
              {(['STUDENT', 'ORGANISATION'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-[12px] font-bold tracking-[0.06em] transition-colors',
                    mode === m ? 'bg-white text-[#10204f]' : 'text-[#cfd6ff] hover:text-white',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <h1 className="mt-7 font-display text-[clamp(2.4rem,4.6vw,4.25rem)] font-extrabold leading-[1.02] tracking-tight text-white">
              {isStudent ? (
                <>
                  Prove you&apos;re
                  <br />
                  <span className="text-[#b9c0ff]">the best.</span>
                </>
              ) : (
                <>
                  Meet the Best.
                  <br />
                  <span className="text-[#b9c0ff]">Hire on real work.</span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-[430px] text-[15.5px] leading-relaxed text-[#cdd6f5]">
              {isStudent
                ? "Win real briefs from Kigali's companies — judged on the work you deliver, not your CV."
                : "Post a brief, review real deliverables from Kigali's sharpest students, and invite the best to interview."}
            </p>

            <div className="mt-7">
              <Link
                href={primaryHref}
                className="inline-block rounded-xl bg-white px-6 py-3 text-[15px] font-bold text-[#10204f] shadow-[0_10px_30px_rgba(5,12,40,0.25)] transition-transform hover:-translate-y-0.5"
              >
                {primaryLabel}
              </Link>
            </div>

            <div className="mt-auto flex items-center gap-3 pt-8">
              <div className="flex">
                {AVATARS.map((a, i) => (
                  <span
                    key={a}
                    aria-hidden
                    className="h-[34px] w-[34px] rounded-full border-2 border-[#15265f] bg-cover bg-center"
                    style={{ backgroundImage: `url('${a}')`, marginLeft: i ? -10 : 0 }}
                  />
                ))}
              </div>
              <p className="text-[14px] font-medium text-[#d7ddf6]">
                Join 1000+ students
              </p>
            </div>
          </div>

          {/* floating project cards (desktop only) */}
          <div className="absolute right-10 top-[150px] hidden w-[230px] rounded-[14px] bg-white p-4 shadow-[0_18px_40px_rgba(8,16,50,0.28)] md:block">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[15px] font-extrabold text-[#141a2e]">
                <span className="h-5 w-5 rounded-[6px] bg-gradient-to-br from-[#2847d3] to-[#1d3fb0]" />
                Nyamirambo
              </span>
              <span className="rounded-full bg-[#eaeeff] px-2.5 py-1 text-[11px] font-bold text-[#2847d3]">
                Open
              </span>
            </div>
            <p className="mt-3 text-[15px] font-bold text-[#10204f]">
              Community events page
            </p>
            <p className="mt-0.5 text-[13px] text-[#7a8198]">Kigali · Web</p>
          </div>

          <div className="absolute right-[180px] top-[250px] hidden w-[180px] rounded-[14px] bg-white p-3 shadow-[0_18px_40px_rgba(8,16,50,0.28)] md:block">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[15px] font-extrabold text-[#141a2e]">
                <span className="h-5 w-5 rounded-[6px] bg-gradient-to-br from-[#2847d3] to-[#1d3fb0]" />
                Tailors
              </span>
              <span className="rounded-full bg-[#2847d3] px-2.5 py-1 text-[11px] font-bold text-white">
                RWF 50,000
              </span>
            </div>
          </div>

          <div className="absolute right-[300px] top-[338px] hidden w-[62px] rounded-[14px] bg-white py-2 text-center shadow-[0_18px_40px_rgba(8,16,50,0.28)] md:block">
            <div className="text-[11px] font-extrabold tracking-[0.08em] text-[#2847d3]">
              NOV
            </div>
            <div className="text-[20px] font-extrabold text-[#10204f]">13</div>
          </div>
        </section>

        {/* ---- Trusted strip ---- */}
        <div className="mt-11 text-center">
          <p className="text-[15px] text-[#8a90a2]">
            Trusted by universities and organisations across Rwanda
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="text-[17px] font-bold tracking-wide text-[#5c6276] opacity-80"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

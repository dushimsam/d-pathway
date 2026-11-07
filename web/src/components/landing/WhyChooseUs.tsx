import Link from 'next/link';
import { BadgeCheck, Lightbulb, Rocket, Target } from 'lucide-react';
import { Reveal } from './Reveal';

/** Soft blue gradient blob tucked into the top-right corner of each light card. */
function CornerBlob() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full"
      style={{
        background:
          'radial-gradient(circle, rgba(40,71,211,0.18) 0%, rgba(40,71,211,0.09) 40%, transparent 70%)',
      }}
    />
  );
}

/**
 * Landing section 4 — "Why choose us", built to match the reference bento:
 * two small cards + a wide card on the left, and a tall filled accent card on
 * the right. Icon tile, title and a short paragraph per card.
 */
export function WhyChooseUs() {
  return (
    <section id="why" className="bg-white text-[#0b1020]">
      <div className="b-container b-container--wide py-20">
        <Reveal className="max-w-2xl">
          <span className="inline-block rounded-full bg-[#eaeeff] px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#2847d3]">
            Why choose us
          </span>
          <h2 className="mt-5 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-extrabold leading-[1.1] tracking-tight">
            Why trust us with your next hire?{' '}
            <span className="rounded-lg bg-[#2847d3] px-2 text-white [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              It&apos;s not just talk.
            </span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {/* A — Trusted (small) */}
          <Reveal className="relative overflow-hidden rounded-[20px] border border-[#ecedf4] bg-[#f6f7fb] p-7">
            <CornerBlob />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#eaeeff] text-[#2847d3]">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <h3 className="relative mt-5 text-[19px] font-bold text-[#10204f]">
              Trusted by Rwanda&apos;s organisations
            </h3>
            <p className="relative mt-2 text-[13.5px] leading-relaxed text-[#5c6276]">
              Companies across Kigali — from cooperatives to startups — post real
              briefs and judge students on the work they actually deliver, not a CV.
            </p>
          </Reveal>

          {/* B — Fast (small) */}
          <Reveal delay={110} className="relative overflow-hidden rounded-[20px] border border-[#ecedf4] bg-[#f6f7fb] p-7">
            <CornerBlob />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#eaeeff] text-[#2847d3]">
              <Rocket className="h-5 w-5" />
            </span>
            <h3 className="relative mt-5 text-[19px] font-bold text-[#10204f]">
              Fast &amp; simple hiring
            </h3>
            <p className="relative mt-2 text-[13.5px] leading-relaxed text-[#5c6276]">
              No screening marathons. Post a brief, review the deliverables that come
              in, score them, and invite the strongest to interview.
            </p>
          </Reveal>

          {/* D — Scalable (accent, tall, right) */}
          <Reveal
            variant="zoom"
            delay={160}
            className="relative row-span-1 flex flex-col overflow-hidden rounded-[20px] p-7 text-white md:col-start-3 md:row-span-2"
            style={{
              background:
                'radial-gradient(130% 90% at 90% 108%, rgba(120,150,255,0.5) 0%, rgba(60,90,230,0) 50%), linear-gradient(155deg, #0a1550 0%, #2a56d6 100%)',
            }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/15 text-white backdrop-blur">
              <Lightbulb className="h-6 w-6" />
            </span>
            <h3 className="mt-6 font-display text-[26px] font-extrabold leading-[1.15] tracking-tight">
              Scales with your growth
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-[#cdd6f5]">
              Whether you&apos;re making your first hire or building a whole team,
              D·Pathway grows with you — from a single brief to a steady pipeline of
              proven, interview-ready talent.
            </p>
            <Link
              href="/register/company"
              className="mt-auto inline-block rounded-xl bg-white px-6 py-3 text-center text-[15px] font-bold text-[#10204f] shadow-[0_10px_30px_rgba(5,12,40,0.3)] transition-transform hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </Reveal>

          {/* C — Quality (wide, bottom-left) */}
          <Reveal delay={80} className="relative overflow-hidden rounded-[20px] border border-[#ecedf4] bg-[#f6f7fb] p-7 md:col-span-2 md:col-start-1 md:row-start-2">
            <CornerBlob />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#eaeeff] text-[#2847d3]">
              <Target className="h-5 w-5" />
            </span>
            <h3 className="relative mt-5 text-[19px] font-bold text-[#10204f]">
              Quality over quantity
            </h3>
            <p className="relative mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#5c6276]">
              You won&apos;t drown in applications that don&apos;t fit. You get real,
              bounded deliverables from motivated students — concrete work you can
              assess side by side, so the decision is about substance, not polish.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

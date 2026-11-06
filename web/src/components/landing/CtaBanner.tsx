import Link from 'next/link';
import { Star } from 'lucide-react';

/**
 * Landing CTA banner (before the FAQ) — matches the reference: a vivid gradient
 * card with a cut-out person overflowing the top edge and floating info cards.
 */
export function CtaBanner() {
  return (
    <section className="bg-white">
      <div className="b-container b-container--wide pb-20 pt-48">
        <div
          className="relative rounded-[28px] px-8 py-14 sm:px-14"
          style={{ background: 'linear-gradient(115deg, #3b6bff 0%, #243dc4 60%, #16267a 100%)' }}
        >
          {/* soft glow bottom-right */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{
              background:
                'radial-gradient(120% 120% at 85% 130%, rgba(255,255,255,0.20), transparent 50%)',
            }}
          />

          {/* content */}
          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-extrabold leading-[1.08] tracking-tight text-white">
              Kick off your hiring now — quick and easy!
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register/company"
                className="rounded-[11px] bg-white px-5 py-3 text-[14px] font-bold text-[#10204f] shadow-[0_10px_30px_rgba(5,12,40,0.25)] transition-transform hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <a
                href="mailto:hello@d-pathway.rw"
                className="rounded-[11px] border border-white/40 px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Contact us
              </a>
            </div>
          </div>

          {/* cut-out person — waist sits at the banner's bottom edge, head overflows the top */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/real/person-cutout-top.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-[3%] hidden h-[440px] w-auto drop-shadow-[0_18px_40px_rgba(10,20,80,0.3)] md:block"
          />

          {/* floating card — a live brief */}
          <div className="absolute bottom-[96px] right-[220px] z-10 hidden w-[224px] rounded-[13px] bg-white p-3.5 shadow-[0_18px_40px_rgba(8,16,50,0.28)] lg:block">
            <p className="text-[13px] font-bold text-[#10204f]">Logo &amp; brand kit</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] text-[#7a8198]">
                <span className="h-4 w-4 rounded-[5px] bg-gradient-to-br from-[#2847d3] to-[#1d3fb0]" />
                Kigali Tailors
              </span>
              <span className="rounded-full bg-[#2847d3] px-2 py-0.5 text-[11px] font-bold text-white">
                RWF 50,000
              </span>
            </div>
          </div>

          {/* floating card — a stat */}
          <div className="absolute bottom-[32px] right-[300px] z-10 hidden w-[168px] items-center gap-2.5 rounded-[13px] bg-white p-2.5 shadow-[0_18px_40px_rgba(8,16,50,0.28)] lg:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaeeff] text-[#2847d3]">
              <Star className="h-4 w-4 fill-[#2847d3]" />
            </span>
            <div>
              <p className="text-[15px] font-extrabold leading-none text-[#10204f]">8+</p>
              <p className="mt-0.5 text-[11px] text-[#7a8198]">Open briefs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

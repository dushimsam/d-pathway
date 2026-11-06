import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Brief {
  org: string;
  title: string;
  meta: string;
  skills: string[];
  applyBy: string;
  prize?: string;
}

// A curated showcase mirroring the real catalogue; "Browse all" opens the live one.
const BRIEFS: Brief[] = [
  {
    org: 'Nyamirambo Youth Media',
    title: 'Community events landing page',
    meta: 'Kigali · Repository link',
    skills: ['html', 'css', 'design'],
    applyBy: '13 Nov',
    prize: 'RWF 75,000',
  },
  {
    org: 'Kigali Tailors Cooperative',
    title: 'Logo & brand kit',
    meta: 'Kigali · File',
    skills: ['design', 'branding'],
    applyBy: '14 Nov',
    prize: 'RWF 50,000',
  },
  {
    org: 'Gasabo Farmers Cooperative',
    title: 'WhatsApp produce order form',
    meta: 'Gasabo · Link',
    skills: ['web', 'forms'],
    applyBy: '10 Nov',
  },
  {
    org: 'Strettch Cloud',
    title: 'Internal metrics dashboard',
    meta: 'Remote · Repository link',
    skills: ['typescript', 'react'],
    applyBy: '12 Nov',
    prize: 'RWF 150,000',
  },
  {
    org: 'Kigali Tailors Cooperative',
    title: 'Simple order & inventory tracker',
    meta: 'Kigali · Repository link',
    skills: ['spreadsheets', 'web'],
    applyBy: '11 Nov',
  },
  {
    org: 'Gasabo Farmers Cooperative',
    title: 'Harvest record spreadsheet',
    meta: 'Gasabo · File',
    skills: ['spreadsheets', 'data'],
    applyBy: '15 Nov',
  },
];

/** Landing section 3 — a showcase grid of open briefs (their "Talents Pool"). */
export function OpenBriefs() {
  return (
    <section id="briefs" className="bg-white text-[#0b1020]">
      <div className="b-container b-container--wide py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-[#eaeeff] px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#2847d3]">
              Open briefs
            </span>
            <h2 className="mt-5 font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-tight">
              Take a look at the{' '}
              <span className="rounded-lg bg-[#2847d3] px-2 text-white [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                open briefs
              </span>{' '}
              live right now
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#2847d3] px-[18px] py-2.5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(40,71,211,0.35)] transition-transform hover:-translate-y-0.5"
          >
            Browse all briefs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {BRIEFS.map((b) => (
            <div
              key={`${b.org}-${b.title}`}
              className="flex flex-col rounded-[18px] border border-[#e7eaf4] bg-white p-6 shadow-[0_10px_30px_-20px_rgba(16,32,79,0.4)] transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#2847d3] to-[#1d3fb0] text-[15px] font-extrabold text-white">
                    {b.org.charAt(0)}
                  </span>
                  <span className="text-[13px] font-semibold text-[#5c6276]">
                    {b.org}
                  </span>
                </div>
                {b.prize ? (
                  <span className="shrink-0 rounded-full bg-[#2847d3] px-2.5 py-1 text-[11px] font-bold text-white">
                    {b.prize}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-[#eaeeff] px-2.5 py-1 text-[11px] font-bold text-[#2847d3]">
                    Open
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-[18px] font-bold text-[#10204f]">
                {b.title}
              </h3>
              <p className="mt-1 text-[13px] text-[#7a8198]">{b.meta}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {b.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[12px] font-medium text-[#2847d3]"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#f0f2f8] pt-4">
                <span className="text-[13px] text-[#7a8198]">
                  Apply by {b.applyBy}
                </span>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-1 rounded-[9px] border border-[#dfe3f0] px-3.5 py-2 text-[13px] font-semibold text-[#10204f] transition-colors hover:border-[#2847d3] hover:text-[#2847d3]"
                >
                  View brief
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

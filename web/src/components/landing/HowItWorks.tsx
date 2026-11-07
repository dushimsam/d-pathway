import { FileText, Trophy, UploadCloud } from 'lucide-react';
import { Reveal } from './Reveal';

const STEPS = [
  {
    n: '01',
    Icon: FileText,
    title: 'An organisation posts a brief',
    body: 'A real, bounded project — with a deadline, a deliverable format and clear IP terms. No busywork, no trick take-homes.',
  },
  {
    n: '02',
    Icon: UploadCloud,
    title: 'Students deliver the work',
    body: 'They accept the terms and submit one real deliverable — solo, or as a small team led by one student.',
  },
  {
    n: '03',
    Icon: Trophy,
    title: 'You invite the best',
    body: 'Review the actual work, score it 1–5, leave feedback, and invite the strongest to interview.',
  },
];

/**
 * Landing second section — "How it works". Light band that flows out of the
 * white hero, with the blue theme and a highlighter-marker keyword.
 */
export function HowItWorks() {
  return (
    <section id="how" className="bg-[#f5f7ff] text-[#0b1020]">
      <div className="b-container b-container--wide py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[#eaeeff] px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#2847d3]">
            How it works
          </span>
          <h2 className="mt-5 font-display text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-tight">
            How D·Pathway turns briefs into{' '}
            <span className="rounded-lg bg-[#2847d3] px-2 text-white [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              real hires
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-[#5c6276]">
            One loop, end to end — a company sets a real problem, students prove
            themselves on it, and the work does the talking.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, Icon, title, body }, i) => (
            <Reveal
              key={n}
              delay={i * 120}
              className="group relative rounded-[20px] border border-[#e7eaf4] bg-white p-7 shadow-[0_10px_30px_-18px_rgba(16,32,79,0.35)] transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2847d3] to-[#1d3fb0] text-white shadow-[0_8px_20px_rgba(40,71,211,0.35)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display text-[34px] font-extrabold leading-none text-[#e7eaf4] transition-colors group-hover:text-[#c7cef0]">
                  {n}
                </span>
              </div>
              <h3 className="mt-5 text-[18px] font-bold text-[#10204f]">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#5c6276]">
                {body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

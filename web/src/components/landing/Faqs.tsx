const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'What is D·Pathway?',
    a: "A project platform where Kigali's students prove themselves on real, bounded briefs from organisations — judged on the work they deliver, not a CV.",
  },
  {
    q: 'Who can use D·Pathway?',
    a: 'Any organisation in Rwanda — from cooperatives and small businesses to startups and larger companies — plus students and recent graduates.',
  },
  {
    q: 'Is D·Pathway free to use?',
    a: 'Yes. Students and organisations join for free. Some briefs also carry a cash prize, funded by the organisation that posts them.',
  },
  {
    q: 'How is the work evaluated?',
    a: 'You score each deliverable from 1–5, leave written feedback, and mark whether the student is selected for an interview. The work speaks for itself.',
  },
  {
    q: 'How do I post a brief?',
    a: "Create an organisation account, click 'New project,' and fill in the brief, deadlines, deliverable format and IP terms — it takes a few minutes.",
  },
  {
    q: 'Can students work in teams?',
    a: 'Yes. A student applies as the lead and invites teammates. Accepting the application accepts the whole team — up to four people.',
  },
  {
    q: 'How are students matched to my brief?',
    a: 'Students browse the open catalogue and apply to briefs that fit their skills. You review every applicant and accept the ones you want.',
  },
  {
    q: 'Can I edit an evaluation or allow a resubmission?',
    a: 'Yes. Organisations can edit an evaluation, and students can resubmit after feedback — the evaluation is then flagged for a quick re-review.',
  },
  {
    q: 'Can I contact the students directly?',
    a: 'Once you select a team and review their work, you invite the strongest to an interview — arranged directly with them, off-platform.',
  },
  {
    q: 'Who owns the work and the IP?',
    a: "Every brief states its IP terms up front, and students accept them before applying — so ownership is clear and agreed before any work starts.",
  },
];

import { Reveal } from './Reveal';

/** Landing FAQ — two-column Q&A with "?" badges, matching the reference. */
export function Faqs() {
  return (
    <section id="faqs" className="bg-[#f1f3fd] text-[#0b1020]">
      <div className="b-container b-container--wide py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[#eaeeff] px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#2847d3]">
            FAQs
          </span>
          <h2 className="mt-5 font-display text-[clamp(1.9rem,3.6vw,2.9rem)] font-extrabold leading-[1.12] tracking-tight">
            <span className="rounded-lg bg-[#2847d3] px-2 text-white [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              You&apos;ve got questions?
            </span>{' '}
            We&apos;ve got answers!
          </h2>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-x-12 gap-y-9 md:grid-cols-2">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} variant="fade" delay={(i % 2) * 90} className="flex gap-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaeeff] text-[14px] font-bold text-[#2847d3]">
                ?
              </span>
              <div>
                <h3 className="text-[16px] font-bold text-[#10204f]">{f.q}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#5c6276]">
                  {f.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-16 text-center text-[15px] text-[#5c6276]">
          Do you have any other questions? Please{' '}
          <a
            href="mailto:hello@d-pathway.rw"
            className="font-semibold text-[#2847d3] underline underline-offset-2 hover:text-[#2436c4]"
          >
            contact us
          </a>
          .
        </p>
      </div>
    </section>
  );
}

import Link from 'next/link';

const COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Open briefs', href: '#briefs' },
      { label: 'How it works', href: '#how' },
      { label: 'Why D·Pathway', href: '#why' },
      { label: 'Student portal', href: '/register/graduate' },
    ],
  },
  {
    heading: 'Organisations',
    links: [
      { label: 'Post a brief', href: '/register/company' },
      { label: 'Kigali Tailors Cooperative', href: '#briefs' },
      { label: 'Gasabo Farmers Cooperative', href: '#briefs' },
      { label: 'Nyamirambo Youth Media', href: '#briefs' },
    ],
  },
  {
    heading: 'Governance',
    links: [
      { label: 'Student IP rights', href: '#why' },
      { label: 'How work is evaluated', href: '#how' },
      { label: 'Cash prizes', href: '#briefs' },
      { label: 'Account login', href: '/login' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer
      className="text-[#cdd6f5]"
      style={{
        background:
          'radial-gradient(100% 160% at 85% 130%, rgba(90,150,255,0.30) 0%, rgba(60,90,230,0) 55%),' +
          'radial-gradient(80% 130% at 8% -20%, rgba(120,140,255,0.16) 0%, rgba(10,25,80,0) 55%),' +
          'linear-gradient(135deg, #0a1550 0%, #122a7a 55%, #1d3f9e 100%)',
      }}
    >
      <div className="b-container b-container--wide py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2 text-[20px] font-extrabold tracking-tight text-white no-underline">
              <span className="relative inline-block h-6 w-6 rounded-[7px] bg-white">
                <span
                  className="absolute inset-1 bg-[#2436c4]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)' }}
                />
              </span>
              <span>
                D<span className="text-white">·</span>Pathway
              </span>
            </Link>
            <p className="mt-4 text-[14px] leading-relaxed text-[#cdd6f8]">
              A project platform for Kigali&apos;s students and graduates — real
              briefs, honest scores, direct interviews.
            </p>
            <span className="mt-4 inline-block font-mono text-[12px] uppercase tracking-[0.12em] text-[#bcd0ff]">
              Kigali · Rwanda
            </span>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[13px] font-bold uppercase tracking-[0.1em] text-white">
                {col.heading}
              </h4>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('/') ? (
                      <Link href={l.href} className="text-[14px] text-[#dfe5ff] transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="text-[14px] text-[#dfe5ff] transition-colors hover:text-white">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="font-mono text-[12px] leading-relaxed text-[#b3bdeb]">
            Built in Kigali. Personal data is stored in Rwanda, aligned with Law
            No. 058/2021 on personal data protection.
          </p>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <span className="text-[13px] text-[#b3bdeb]">
              © 2026 D·Pathway · Kigali, Rwanda.
            </span>
            <div className="flex items-center gap-6 text-[13px] text-[#c4ccec]">
              <a href="#why" className="transition-colors hover:text-white">Privacy</a>
              <a href="#why" className="transition-colors hover:text-white">Terms</a>
              <a href="#why" className="transition-colors hover:text-white">Sovereignty</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

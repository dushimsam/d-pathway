import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, Trophy, Users } from 'lucide-react';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink font-sans text-hi">
      {/* ---------- Brand panel (desktop) ---------- */}
      <aside className="relative hidden w-[46%] overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -left-20 -top-24 h-[480px] w-[480px] rounded-full opacity-60 blur-[120px]"
          style={{ background: 'radial-gradient(closest-side, rgba(46,230,200,0.20), transparent)' }}
        />
        <Link href="/" className="relative font-display text-[22px] font-bold tracking-tight">
          D<span className="text-teal">·</span>Pathway
        </Link>

        <div className="relative">
          <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight">
            Your work, not just your CV,{' '}
            <span className="bg-gradient-to-r from-teal to-cyan bg-clip-text text-transparent">
              opens the door.
            </span>
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            <Perk icon={<CheckCircle2 className="h-4 w-4" />} text="Real, bounded projects from Kigali organisations" />
            <Perk icon={<Trophy className="h-4 w-4" />} text="Some projects carry cash prizes" />
            <Perk icon={<Users className="h-4 w-4" />} text="Companies, cooperatives and community groups" />
          </ul>
        </div>

        <p className="relative text-[12px] text-dim">
          For the Kigali graduate labour market · Data stays in Rwanda.
        </p>
      </aside>

      {/* ---------- Form panel ---------- */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Link href="/" className="font-display text-[22px] font-bold tracking-tight text-hi">
              D<span className="text-teal">·</span>Pathway
            </Link>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-n0 p-8 text-n900 shadow-2xl">
            <h1 className="font-display text-[22px] font-bold tracking-tight text-n900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-[14px] text-n500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <p className="mt-5 text-center text-[14px] text-mid">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

function Perk({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-[14px] text-mid">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-teal">
        {icon}
      </span>
      {text}
    </li>
  );
}

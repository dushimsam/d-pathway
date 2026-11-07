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
    <div className="app-light flex min-h-screen bg-white font-sans text-[#0b1020]">
      {/* ---------- Brand panel (desktop) — navy gradient, matching the landing ---------- */}
      <aside
        className="relative hidden w-[46%] overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
        style={{ background: 'linear-gradient(160deg, #0a1550 0%, #122a7a 55%, #2a56d6 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-[480px] w-[480px] rounded-full opacity-70 blur-[120px]"
          style={{ background: 'radial-gradient(closest-side, rgba(90,150,255,0.45), transparent)' }}
        />
        <Link href="/" className="relative font-display text-[22px] font-bold tracking-tight text-white">
          D<span className="text-[#8aa6ff]">·</span>Pathway
        </Link>

        <div className="relative">
          <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight text-white">
            Your work, not just your CV,{' '}
            <span className="text-[#8aa6ff]">opens the door.</span>
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            <Perk icon={<CheckCircle2 className="h-4 w-4" />} text="Real, bounded projects from Kigali organisations" />
            <Perk icon={<Trophy className="h-4 w-4" />} text="Some projects carry cash prizes" />
            <Perk icon={<Users className="h-4 w-4" />} text="Companies, cooperatives and community groups" />
          </ul>
        </div>

        <p className="relative text-[12px] text-white/70">
          For the Kigali graduate labour market · Data stays in Rwanda.
        </p>
      </aside>

      {/* ---------- Form panel — light ---------- */}
      <main className="flex flex-1 items-center justify-center bg-[#f5f7ff] p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Link href="/" className="font-display text-[22px] font-bold tracking-tight text-[#10204f]">
              D<span className="text-[#2847d3]">·</span>Pathway
            </Link>
          </div>

          <div className="rounded-[20px] border border-[#e7eaf4] bg-white p-8 text-[#0b1020] shadow-[0_18px_50px_-20px_rgba(16,32,79,0.25)]">
            <h1 className="font-display text-[22px] font-bold tracking-tight text-[#10204f]">{title}</h1>
            {subtitle && <p className="mt-1.5 text-[14px] text-[#5c6276]">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <p className="mt-5 text-center text-[14px] text-[#5c6276]">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

function Perk({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 text-[14px] text-white/85">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8aa6ff]">
        {icon}
      </span>
      {text}
    </li>
  );
}

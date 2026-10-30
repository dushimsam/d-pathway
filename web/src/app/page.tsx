import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Search,
  Sprout,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { getCurrentUserServer } from '@/lib/server-api';

export default async function LandingPage() {
  const user = await getCurrentUserServer();
  const home = user ? (user.role === 'COMPANY' ? '/projects' : '/dashboard') : null;

  return (
    <div className="min-h-screen bg-ink font-sans text-hi antialiased">
      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-[20px] font-bold tracking-tight text-hi">
            D<span className="text-teal">·</span>Pathway
          </span>
          <nav className="hidden items-center gap-8 text-[14px] text-mid md:flex">
            <a href="#how" className="transition-colors hover:text-hi">How it works</a>
            <a href="#who" className="transition-colors hover:text-hi">Who it&apos;s for</a>
            <a href="#prizes" className="transition-colors hover:text-hi">Prizes</a>
          </nav>
          <div className="flex items-center gap-2">
            {home ? (
              <Link
                href={home}
                className="rounded-full bg-teal px-4 py-2 text-[14px] font-semibold text-ink transition hover:brightness-110"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-[14px] font-medium text-mid transition hover:text-hi"
                >
                  Log in
                </Link>
                <Link
                  href="/register/graduate"
                  className="rounded-full bg-teal px-4 py-2 text-[14px] font-semibold text-ink transition hover:brightness-110"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        {/* glows */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
          style={{ background: 'radial-gradient(closest-side, rgba(46,230,200,0.22), transparent)' }}
        />
        <div
          className="pointer-events-none absolute right-[-10%] top-40 h-[380px] w-[380px] rounded-full opacity-50 blur-[120px]"
          style={{ background: 'radial-gradient(closest-side, rgba(56,217,246,0.16), transparent)' }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-mid">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Kigali graduate labour market · pilot
            </span>

            <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.05] tracking-tight text-hi sm:text-[58px]">
              Prove your skills
              <br />
              on real work.{' '}
              <span className="bg-gradient-to-r from-teal to-cyan bg-clip-text text-transparent">
                Get hired for it.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[16px] leading-7 text-mid">
              D-Pathway connects graduates with real, bounded projects from companies,
              cooperatives and community groups. Pick a project, ship the deliverable,
              and let your work — not just your CV — open the door to an interview.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {home ? (
                <Link
                  href={home}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3 text-[15px] font-semibold text-ink transition hover:brightness-110"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register/graduate"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3 text-[15px] font-semibold text-ink transition hover:brightness-110"
                  >
                    I&apos;m a graduate <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register/company"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 text-[15px] font-medium text-hi transition hover:bg-white/[0.06]"
                  >
                    I&apos;m an organisation
                  </Link>
                </>
              )}
            </div>

            <p className="mt-5 text-[13px] text-dim">
              Already have an account?{' '}
              <Link href="/login" className="text-teal hover:underline">
                Log in
              </Link>
            </p>
          </div>

          {/* product preview */}
          <HeroPreview />
        </div>

        {/* trusted-by strip */}
        <div className="relative mx-auto max-w-6xl px-6 pb-16">
          <p className="mb-4 text-center text-[12px] uppercase tracking-[0.2em] text-dim">
            Organisations on the pilot
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[15px] font-medium text-mid/70">
            <span>Strettch Cloud</span>
            <span className="text-dim">·</span>
            <span>Kigali Tailors Cooperative</span>
            <span className="text-dim">·</span>
            <span>Gasabo Farmers Cooperative</span>
            <span className="text-dim">·</span>
            <span>Nyamirambo Youth Media</span>
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-y border-white/5 bg-ink-rise">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-6 py-4 md:grid-cols-4">
          <Stat value="4" label="Organisations posting" />
          <Stat value="RWF" label="Prizes on select projects" />
          <Stat value="< 72h" label="Median feedback turnaround" />
          <Stat value="1 : 1" label="Real problem → real evidence" />
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-teal">
            How it works
          </p>
          <h2 className="mt-3 font-display text-[32px] font-bold tracking-tight text-hi sm:text-[38px]">
            From catalogue to interview, in four honest steps.
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h3 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-mid">
              For graduates
            </h3>
            <div className="flex flex-col">
              <StepRow n="01" icon={<Search className="h-5 w-5" />} title="Browse the catalogue" body="Filter real projects by skill, organisation, or prize. Read the brief and IP terms." />
              <StepRow n="02" icon={<FileCheck2 className="h-5 w-5" />} title="Apply and build" body="Accept the terms, apply, and once accepted submit one deliverable — a repo link or a file." />
              <StepRow n="03" icon={<CheckCircle2 className="h-5 w-5" />} title="Get feedback & interviews" body="Every deliverable is scored with written feedback. The strongest are invited to interview." last />
            </div>
          </div>
          <div>
            <h3 className="mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-mid">
              For organisations
            </h3>
            <div className="flex flex-col">
              <StepRow n="01" icon={<Trophy className="h-5 w-5" />} title="Post a real project" body="Turn an actual internal task into a bounded project with deadlines and, optionally, a prize." />
              <StepRow n="02" icon={<Users className="h-5 w-5" />} title="Review applicants" body="See each applicant's skills and prior work, then accept or decline with a reason." />
              <StepRow n="03" icon={<Star className="h-5 w-5" />} title="Evaluate & hire" body="Score deliverables, give feedback, and invite the strongest graduates to interview." last />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Who it's for / prizes ---------- */}
      <section id="who" className="border-t border-white/5 bg-ink-rise py-24">
        <div id="prizes" className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-teal">
              Built for Kigali
            </p>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-tight text-hi sm:text-[38px]">
              Not just big companies. Real work, at any scale.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<Trophy className="h-5 w-5 text-teal" />}
              title="Some projects carry prizes"
              body="Many projects are their own reward — real experience and a shot at a job. Some also offer a cash prize for a selected deliverable."
            />
            <FeatureCard
              icon={<Sprout className="h-5 w-5 text-teal" />}
              title="Companies & cooperatives alike"
              body="A tailors' cooperative, a farmers' group, a youth collective — any organisation with real work can post. Projects fit their scale."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-5 w-5 text-teal" />}
              title="Your work speaks first"
              body="Instead of filtering on a CV alone, organisations watch you solve their real problem before they decide."
            />
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden py-28">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[120px]"
          style={{ background: 'radial-gradient(closest-side, rgba(46,230,200,0.18), transparent)' }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-[34px] font-bold tracking-tight text-hi sm:text-[44px]">
            Ready to let your work do the talking?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-mid">
            Join the pilot in Kigali — free for graduates and organisations.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register/graduate"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-7 py-3.5 text-[15px] font-semibold text-ink transition hover:brightness-110"
            >
              Join as a graduate <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register/company"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.02] px-7 py-3.5 text-[15px] font-medium text-hi transition hover:bg-white/[0.06]"
            >
              Register your organisation
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-[13px] text-dim sm:flex-row">
          <span className="font-display font-bold text-mid">
            D<span className="text-teal">·</span>Pathway
          </span>
          <span>For the Kigali graduate labour market · Data stays in Rwanda.</span>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HeroPreview() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] opacity-70 blur-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(46,230,200,0.18), rgba(56,217,246,0.10))' }}
      />
      <div className="rounded-[24px] border border-white/10 bg-surface/80 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-wide text-dim">
            Catalogue
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-[12px] font-semibold text-teal">
            <Trophy className="h-3.5 w-3.5" /> RWF 150,000
          </span>
        </div>

        <div className="rounded-[16px] border border-white/10 bg-ink/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-wide text-dim">
              Strettch Cloud
            </span>
            <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-semibold text-teal">
              Open
            </span>
          </div>
          <h3 className="mt-2 font-display text-[18px] font-semibold text-hi">
            Internal metrics dashboard
          </h3>
          <p className="mt-1.5 text-[13px] leading-5 text-mid">
            Build a small dashboard that reads our metrics API and surfaces the
            three numbers we check daily.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['typescript', 'react'].map((s) => (
              <span
                key={s}
                className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-mid"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-[12px] text-dim">Apply by · 10 days left</span>
            <span className="rounded-full bg-teal px-3 py-1 text-[12px] font-semibold text-ink">
              View brief
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.02] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/15 text-teal">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-hi">Selected for interview</p>
            <p className="truncate text-[12px] text-dim">
              Strong work — feedback: 5/5. We&apos;ll be in touch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-6 text-center md:text-left">
      <p className="font-display text-[28px] font-bold tracking-tight text-hi">{value}</p>
      <p className="mt-1 text-[13px] text-mid">{label}</p>
    </div>
  );
}

function StepRow({
  n,
  icon,
  title,
  body,
  last,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-teal">
          {icon}
        </div>
        {!last && <div className="my-1 w-px flex-1 bg-gradient-to-b from-teal/30 to-transparent" />}
      </div>
      <div className={last ? '' : 'pb-8'}>
        <div className="flex items-center gap-2">
          <span className="font-display text-[13px] font-bold text-teal">{n}</span>
          <p className="text-[16px] font-semibold text-hi">{title}</p>
        </div>
        <p className="mt-1.5 text-[14px] leading-6 text-mid">{body}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-[18px] border border-white/10 bg-white/[0.02] p-6 transition hover:border-teal/30 hover:bg-white/[0.04]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-ink">
        {icon}
      </div>
      <h3 className="font-display text-[17px] font-semibold text-hi">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-mid">{body}</p>
    </div>
  );
}

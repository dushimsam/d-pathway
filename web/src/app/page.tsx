import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileCheck2,
  Search,
  Sprout,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getCurrentUserServer } from '@/lib/server-api';

export default async function LandingPage() {
  const user = await getCurrentUserServer();
  const home = user ? (user.role === 'COMPANY' ? '/projects' : '/dashboard') : null;

  return (
    <div className="min-h-screen bg-n0 text-n900">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-[20px] font-bold text-primary-dark">D·Pathway</span>
        <nav className="flex items-center gap-3">
          {home ? (
            <Link href={home}>
              <Button size="sm">Go to your dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register/graduate">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50 to-n0" />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-n0 px-4 py-1.5 text-[12px] font-medium text-primary-dark shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <Trophy className="h-3.5 w-3.5" /> Real projects · real feedback · some with prizes
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[40px] font-bold leading-tight text-n900 sm:text-[48px]">
            Prove your skills on real work.{' '}
            <span className="text-primary">Get hired for it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-7 text-n700">
            D-Pathway connects Kigali graduates with real, bounded projects from
            companies, cooperatives and community groups. Pick a project, build the
            deliverable, and let your work — not just your CV — open the door to an
            interview.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {home ? (
              <Link href={home}>
                <Button className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register/graduate">
                  <Button className="gap-2">
                    I&apos;m a graduate <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register/company">
                  <Button variant="secondary">I&apos;m an organisation</Button>
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-[12px] text-n500">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-[18px] font-semibold text-n900">For graduates</h2>
            <ol className="mt-5 flex flex-col gap-5">
              <Step
                icon={<Search className="h-5 w-5" />}
                title="Browse the catalogue"
                body="Filter real projects by skill, organisation, or prize. Read the brief and IP terms."
              />
              <Step
                icon={<FileCheck2 className="h-5 w-5" />}
                title="Apply and build"
                body="Accept the terms, apply, and once accepted submit one deliverable — a repo link or a file."
              />
              <Step
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Get feedback & interviews"
                body="Every deliverable is evaluated with a score and written feedback. The strongest are invited to interview."
              />
            </ol>
          </div>
          <div>
            <h2 className="text-[18px] font-semibold text-n900">For organisations</h2>
            <ol className="mt-5 flex flex-col gap-5">
              <Step
                icon={<Briefcase className="h-5 w-5" />}
                title="Post a real project"
                body="Turn an actual internal task into a bounded project with deadlines and, optionally, a prize."
              />
              <Step
                icon={<Users className="h-5 w-5" />}
                title="Review applicants"
                body="See each applicant's skills and prior work, then accept or decline with a reason."
              />
              <Step
                icon={<Trophy className="h-5 w-5" />}
                title="Evaluate & hire"
                body="Score deliverables, give feedback, and invite the strongest graduates to interview — off-platform."
              />
            </ol>
          </div>
        </div>
      </section>

      {/* Prizes + who it's for */}
      <section className="bg-n100 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          <Feature
            icon={<Trophy className="h-6 w-6 text-warning" />}
            title="Some projects carry prizes"
            body="Many projects are their own reward — real experience and a shot at a job. Some also offer a cash prize for a selected deliverable."
          />
          <Feature
            icon={<Sprout className="h-6 w-6 text-success" />}
            title="Not just big companies"
            body="A tailors' cooperative, a farmers' group, a youth collective — any organisation with real work can post. Projects fit their scale."
          />
          <Feature
            icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
            title="Your work speaks"
            body="Instead of filtering on a CV alone, organisations watch you solve their real problem before they decide."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-[28px] font-bold text-n900">Ready to start?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[14px] text-n700">
          Join the pilot in Kigali. It&apos;s free for graduates and organisations.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register/graduate">
            <Button>Join as a graduate</Button>
          </Link>
          <Link href="/register/company">
            <Button variant="secondary">Register your organisation</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-n300 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-[12px] text-n500">
          D·Pathway — for the Kigali graduate labour market. Data stays in Rwanda.
        </div>
      </footer>
    </div>
  );
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-primary-50 text-primary-dark">
        {icon}
      </span>
      <div>
        <p className="text-[16px] font-medium text-n900">{title}</p>
        <p className="mt-1 text-[14px] leading-6 text-n700">{body}</p>
      </div>
    </li>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[16px] bg-n0 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="mb-3">{icon}</div>
      <h3 className="text-[16px] font-semibold text-n900">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-n700">{body}</p>
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Award,
  Briefcase,
  ExternalLink,
  GraduationCap,
  MapPin,
  Star,
  Trophy,
} from 'lucide-react';
import { callApi } from '@/lib/server-api';
import { formatMoney } from '@/lib/money';
import type { StudentProfile } from '@/lib/types';

export default async function PublicStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await callApi(`/talent/${id}/public`, { method: 'GET' }, undefined);
  if (!res.ok) notFound();
  const s = (await res.json()) as StudentProfile;

  const stats: Array<{ icon: React.ReactNode; label: string; value: string }> = [
    {
      icon: <Briefcase className="h-4 w-4" />,
      label: 'Briefs completed',
      value: String(s.stats.briefsCompleted),
    },
    {
      icon: <Star className="h-4 w-4" />,
      label: 'Avg score',
      value: s.stats.briefsCompleted > 0 ? `${s.stats.avgScore}/5` : '—',
    },
    {
      icon: <Award className="h-4 w-4" />,
      label: 'Interview picks',
      value: String(s.stats.interviewsSelected),
    },
    {
      icon: <Trophy className="h-4 w-4" />,
      label: 'Prizes won',
      value:
        s.stats.prizesWon > 0
          ? `${s.stats.prizesWon} · ${formatMoney(s.stats.prizeTotal)}`
          : '0',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0b1020]">
      <header className="border-b border-[#eef0f6]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-[20px] font-extrabold tracking-tight">
            D<span className="text-[#2847d3]">·</span>Pathway
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] bg-[#2847d3] px-4 py-2 text-[14px] font-semibold text-white"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#eef0f6] bg-[#f6f7fb] text-[30px] font-extrabold text-[#2847d3]">
            {s.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              s.fullName.charAt(0)
            )}
          </div>
          <div>
            <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-extrabold tracking-tight">
              {s.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-[#5c6276]">
              {s.education && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> {s.education}
                </span>
              )}
              {s.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {s.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {s.skills.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {s.skills.map((sk) => (
              <span
                key={sk}
                className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[12px] font-medium text-[#2847d3]"
              >
                {sk}
              </span>
            ))}
          </div>
        )}

        {s.links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {s.links.map((l) => (
              <a
                key={l}
                href={l}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] text-[#2847d3] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {l.replace(/^https?:\/\//, '')}
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="rounded-[14px] border border-[#e7eaf4] bg-white p-4">
              <div className="mb-1 flex items-center gap-2 text-[#7a8198]">
                {st.icon}
                <span className="text-[12px] font-medium">{st.label}</span>
              </div>
              <p className="text-[22px] font-bold text-[#10204f]">{st.value}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-4 mt-12 text-[18px] font-bold text-[#10204f]">
          Work history ({s.history.length})
        </h2>
        {s.history.length === 0 ? (
          <p className="text-[14px] text-[#7a8198]">No scored work on D·Pathway yet.</p>
        ) : (
          <div className="space-y-3">
            {s.history.map((h) => (
              <div
                key={h.projectId}
                className="flex items-center justify-between gap-4 rounded-[14px] border border-[#e7eaf4] bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#10204f]">
                    {h.projectTitle}
                  </p>
                  <p className="text-[13px] text-[#7a8198]">{h.companyName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {h.outcome === 'SELECTED_FOR_INTERVIEW' && (
                    <span className="rounded-full bg-[#e8f7ee] px-2.5 py-1 text-[12px] font-medium text-[#1f9254]">
                      Interview
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[15px] font-bold text-[#10204f]">
                    <Star className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
                    {h.score}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

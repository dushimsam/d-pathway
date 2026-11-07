import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, MapPin, Star, Users } from 'lucide-react';
import { callApi } from '@/lib/server-api';
import { formatMoney } from '@/lib/money';
import type { CompanyReviews, PublicCompany } from '@/lib/types';

export default async function PublicCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [res, reviewsRes] = await Promise.all([
    callApi(`/companies/${id}/public`, { method: 'GET' }, undefined),
    callApi(`/companies/${id}/reviews`, { method: 'GET' }, undefined),
  ]);
  if (!res.ok) notFound();
  const c = (await res.json()) as PublicCompany;
  const reviews = reviewsRes.ok ? ((await reviewsRes.json()) as CompanyReviews) : null;

  return (
    <div className="min-h-screen bg-white text-[#0b1020]">
      <header className="border-b border-[#eef0f6]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#eef0f6] bg-[#f6f7fb] text-[26px] font-extrabold text-[#2847d3]">
            {c.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              c.name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-extrabold tracking-tight">
              {c.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-[#5c6276]">
              {c.rating.count > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-[#10204f]">
                  <Star className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
                  {c.rating.average}
                  <span className="font-normal text-[#7a8198]">
                    ({c.rating.count} review{c.rating.count > 1 ? 's' : ''})
                  </span>
                </span>
              )}
              {c.industry && <span>{c.industry}</span>}
              {c.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {c.location}
                </span>
              )}
              {c.size && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" /> {c.size}
                </span>
              )}
              {c.website && (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#2847d3] hover:underline"
                >
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        {c.description && (
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[#3a4056]">
            {c.description}
          </p>
        )}

        <h2 className="mb-4 mt-12 text-[18px] font-bold text-[#10204f]">
          Open briefs ({c.openProjects.length})
        </h2>
        {c.openProjects.length === 0 ? (
          <p className="text-[14px] text-[#7a8198]">No open briefs right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.openProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex flex-col gap-3 rounded-[16px] border border-[#e7eaf4] bg-white p-5 transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] font-bold text-[#10204f]">{p.title}</h3>
                  {p.prizeAmount != null && (
                    <span className="shrink-0 rounded-full bg-[#2847d3] px-2.5 py-1 text-[11px] font-bold text-white">
                      {formatMoney(p.prizeAmount, p.prizeCurrency ?? 'rwf')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.requiredSkills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[12px] font-medium text-[#2847d3]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}

        {reviews && reviews.items.length > 0 && (
          <>
            <h2 className="mb-4 mt-12 text-[18px] font-bold text-[#10204f]">
              What graduates say ({reviews.summary.count})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reviews.items.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[16px] border border-[#e7eaf4] bg-white p-5"
                >
                  <div className="mb-2 flex items-center gap-1 text-[#f5a623]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.rating
                            ? 'h-4 w-4 fill-[#f5a623] text-[#f5a623]'
                            : 'h-4 w-4 text-[#d7dbe8]'
                        }
                      />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-[14px] leading-relaxed text-[#3a4056]">
                      “{r.comment}”
                    </p>
                  )}
                  <p className="mt-3 text-[13px] text-[#7a8198]">
                    {r.graduateName} · {r.projectTitle}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

import { getPathways } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { PathwayCard } from '@/components/pathway-card';
import { EmptyState } from '@/components/empty-state';

export default async function HomePage() {
  const result = await getPathways('PUBLISHED');
  const pathways = result.ok ? result.pathways : [];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6">
        <section className="max-w-[640px] py-16">
          <h1 className="text-[32px] font-semibold leading-tight text-neutral-900 md:text-[40px]">
            Companies define the path. Graduates climb it.
          </h1>
          <p className="mt-4 text-[16px] font-normal text-neutral-500">
            D-Pathway turns a company&apos;s hiring bar into a clear ladder of
            stages, so Kigali graduates know exactly what to learn and build to
            become hire-ready.
          </p>
          <a
            href="#pathways"
            className="mt-8 inline-flex items-center rounded-md bg-primary-600 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-primary-600/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            Browse pathways
          </a>
        </section>

        <section id="pathways" className="pb-20">
          <h2 className="text-[20px] font-semibold text-neutral-900">
            Published pathways
          </h2>

          {!result.ok && (
            <div className="mt-4 rounded-md bg-warning-50 px-4 py-3 text-[14px] font-normal text-warning-600">
              The API is not reachable. Start it with{' '}
              <code className="font-medium">npm run dev</code> in{' '}
              <code className="font-medium">api/</code>.
            </div>
          )}

          <div className="mt-6">
            {pathways.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {pathways.map((pathway) => (
                  <PathwayCard key={pathway.id} pathway={pathway} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

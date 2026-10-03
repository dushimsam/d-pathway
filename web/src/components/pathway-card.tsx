import type { Pathway } from '@/lib/types';

export function PathwayCard({ pathway }: { pathway: Pathway }) {
  return (
    <article className="rounded-lg bg-white p-6">
      <p className="text-[12px] font-medium text-primary-600">
        {pathway.companyName}
      </p>
      <h3 className="mt-1 text-[18px] font-semibold text-neutral-900">
        {pathway.title}
      </h3>
      {pathway.description && (
        <p className="mt-2 text-[14px] font-normal text-neutral-700">
          {pathway.description}
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-[12px] font-medium text-success-600">
          Published
        </span>
        <span className="text-[13px] font-normal text-neutral-500">
          {pathway.intakeQuota} places, {pathway.deadlineMonths} months
        </span>
      </div>
    </article>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { projectSchema } from '@/lib/schemas';
import type { Project } from '@/lib/types';

const STATUSES = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED'] as const;

const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function ProjectBuilder() {
  const router = useRouter();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const editId = search.get('id');

  const [projectId, setProjectId] = useState<string | null>(editId);
  const [status, setStatus] = useState<string>('DRAFT');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [deliverableFormat, setDeliverableFormat] = useState('REPOSITORY_LINK');
  const [ipTerms, setIpTerms] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [prizeCurrency, setPrizeCurrency] = useState('RWF');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const existing = useQuery({
    queryKey: ['project', editId],
    queryFn: () => api.get<Project>(`/projects/${editId}`),
    enabled: Boolean(editId),
  });

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setProjectId(p.id);
    setStatus(p.status);
    setTitle(p.title);
    setBrief(p.brief);
    setSkillsText(p.requiredSkills.join(', '));
    setApplicationDeadline(isoToLocalInput(p.applicationDeadline));
    setSubmissionDeadline(isoToLocalInput(p.submissionDeadline));
    setDeliverableFormat(p.deliverableFormat);
    setIpTerms(p.ipTerms);
    setPrizeAmount(p.prizeAmount != null ? String(p.prizeAmount) : '');
    setPrizeCurrency(p.prizeCurrency ?? 'RWF');
  }, [existing.data]);

  const locked = status !== 'DRAFT';

  function collect() {
    const trimmedPrize = prizeAmount.trim();
    return {
      title,
      brief,
      requiredSkills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      applicationDeadline,
      submissionDeadline,
      deliverableFormat: deliverableFormat as
        | 'REPOSITORY_LINK'
        | 'FILE'
        | 'LINK',
      ipTerms,
      ...(trimmedPrize
        ? { prizeAmount: Number(trimmedPrize), prizeCurrency }
        : {}),
    };
  }

  function validate(): ReturnType<typeof projectSchema.safeParse> {
    const parsed = projectSchema.safeParse(collect());
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
    } else {
      setErrors({});
    }
    return parsed;
  }

  function payload() {
    const v = collect();
    return {
      ...v,
      applicationDeadline: new Date(v.applicationDeadline).toISOString(),
      submissionDeadline: new Date(v.submissionDeadline).toISOString(),
    };
  }

  async function saveDraft(): Promise<string | null> {
    const parsed = validate();
    if (!parsed.success) return null;
    setSaving(true);
    setFormError(null);
    try {
      if (projectId) {
        await api.patch(`/projects/${projectId}`, payload());
        return projectId;
      }
      const created = await api.post<Project>('/projects', payload());
      setProjectId(created.id);
      return created.id;
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Could not save.');
      return null;
    } finally {
      setSaving(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'company'] });
    }
  }

  async function publish() {
    const id = await saveDraft();
    if (!id) return;
    setSaving(true);
    try {
      await api.post(`/projects/${id}/publish`);
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'company'] });
      router.replace('/projects');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Could not publish.');
    } finally {
      setSaving(false);
    }
  }

  // Publish checklist (P3), mirrored from the server for UX.
  const checklist = [
    { ok: brief.trim().length > 0, label: 'A non-empty brief' },
    {
      ok: skillsText.split(',').some((s) => s.trim()),
      label: 'At least one required skill',
    },
    {
      ok:
        Boolean(applicationDeadline) &&
        new Date(applicationDeadline).getTime() > Date.now(),
      label: 'Application deadline in the future',
    },
    {
      ok:
        Boolean(applicationDeadline) &&
        Boolean(submissionDeadline) &&
        new Date(submissionDeadline).getTime() >
          new Date(applicationDeadline).getTime(),
      label: 'Submission deadline after the application deadline',
    },
  ];

  if (editId && existing.isLoading) return <Skeleton className="h-96 max-w-3xl" />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <PageHeader
          title={projectId ? 'Edit project' : 'New project'}
          action={
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                ← Projects
              </Button>
            </Link>
          }
        />

        {locked && (
          <p className="mb-4 rounded-[8px] bg-warning-50 p-3 text-[14px] text-warning">
            This project is published; its brief, deadlines, skills and terms are
            frozen and can no longer be edited.
          </p>
        )}

        <Card className="flex flex-col gap-4">
          <Field label="Title" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              value={title}
              disabled={locked}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Brief" htmlFor="brief" error={errors.brief} hint="Describe the real problem and what to deliver.">
            <Textarea
              id="brief"
              rows={6}
              value={brief}
              disabled={locked}
              onChange={(e) => setBrief(e.target.value)}
            />
          </Field>
          <Field label="Required skills" htmlFor="skills" error={errors.requiredSkills} hint="Comma-separated, e.g. typescript, react">
            <Input
              id="skills"
              value={skillsText}
              disabled={locked}
              onChange={(e) => setSkillsText(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Application deadline" htmlFor="appDeadline" error={errors.applicationDeadline}>
              <Input
                id="appDeadline"
                type="datetime-local"
                value={applicationDeadline}
                disabled={locked}
                onChange={(e) => setApplicationDeadline(e.target.value)}
              />
            </Field>
            <Field label="Submission deadline" htmlFor="subDeadline" error={errors.submissionDeadline}>
              <Input
                id="subDeadline"
                type="datetime-local"
                value={submissionDeadline}
                disabled={locked}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Deliverable format" htmlFor="format">
            <Select
              id="format"
              value={deliverableFormat}
              disabled={locked}
              onChange={(e) => setDeliverableFormat(e.target.value)}
            >
              <option value="REPOSITORY_LINK">Repository link</option>
              <option value="FILE">File upload</option>
              <option value="LINK">Link</option>
            </Select>
          </Field>
          <Field
            label="Prize (optional)"
            htmlFor="prizeAmount"
            error={errors.prizeAmount}
            hint="Leave blank for no prize. Awarded if a deliverable is selected."
          >
            <div className="flex gap-2">
              <Select
                value={prizeCurrency}
                disabled={locked}
                onChange={(e) => setPrizeCurrency(e.target.value)}
                className="w-28"
              >
                <option value="RWF">RWF</option>
                <option value="USD">USD</option>
              </Select>
              <Input
                id="prizeAmount"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="e.g. 50000"
                value={prizeAmount}
                disabled={locked}
                onChange={(e) => setPrizeAmount(e.target.value)}
              />
            </div>
          </Field>
          <Field label="IP terms" htmlFor="ipTerms" error={errors.ipTerms} hint="Shown to the graduate before they apply.">
            <Textarea
              id="ipTerms"
              rows={4}
              value={ipTerms}
              disabled={locked}
              onChange={(e) => setIpTerms(e.target.value)}
            />
          </Field>

          {formError && <p className="text-[14px] text-danger">{formError}</p>}

          {!locked && (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={saving} onClick={saveDraft}>
                Save as draft
              </Button>
              <Button disabled={saving} onClick={publish}>
                {saving ? 'Working…' : 'Publish'}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <aside className="flex flex-col gap-4">
        <Card>
          <h3 className="mb-3 text-[14px] font-semibold text-n900">Status</h3>
          <div className="flex flex-col gap-2">
            {STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={
                    s === status ? 'h-2 w-2 rounded-full bg-primary' : 'h-2 w-2 rounded-full bg-n300'
                  }
                />
                <span
                  className={
                    s === status ? 'text-[14px] font-medium text-n900' : 'text-[14px] text-n500'
                  }
                >
                  {s === status ? <Badge variant="info">{s.replace(/_/g, ' ')}</Badge> : s.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-[14px] font-semibold text-n900">
            Ready to publish?
          </h3>
          <ul className="flex flex-col gap-2">
            {checklist.map((c) => (
              <li
                key={c.label}
                className={`flex items-start gap-2 text-[14px] ${c.ok ? 'text-n700' : 'text-n500'}`}
              >
                <Check
                  className={`mt-0.5 h-4 w-4 ${c.ok ? 'text-success' : 'text-n300'}`}
                />
                {c.label}
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 max-w-3xl" />}>
      <ProjectBuilder />
    </Suspense>
  );
}

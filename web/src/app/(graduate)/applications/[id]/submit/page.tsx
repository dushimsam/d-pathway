'use client';

import { use, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DeadlineChip } from '@/components/ui/DeadlineChip';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { Deliverable, MyApplication, SignedUpload } from '@/lib/types';

export default function SubmitDeliverablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [linkUrl, setLinkUrl] = useState('');
  const [note, setNote] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [filePublicId, setFilePublicId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appsQuery = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => api.get<MyApplication[]>('/applications/mine'),
  });
  // Prefill when replacing an existing deliverable before the deadline.
  const existingQuery = useQuery({
    queryKey: ['deliverable', id],
    queryFn: async () => {
      try {
        const d = await api.get<Deliverable>(`/applications/${id}/deliverable`);
        if (d.linkUrl) setLinkUrl(d.linkUrl);
        if (d.note) setNote(d.note);
        if (d.fileUrl) {
          setFileUrl(d.fileUrl);
          setFilePublicId(d.filePublicId);
          setFileName('Previously uploaded file');
        }
        return d;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });

  const app = appsQuery.data?.find((a) => a.id === id);

  const submit = useMutation({
    mutationFn: () =>
      api.post<Deliverable>(`/applications/${id}/deliverable`, {
        linkUrl: linkUrl.trim() || undefined,
        fileUrl: fileUrl ?? undefined,
        filePublicId: filePublicId ?? undefined,
        note: note.trim(),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['deliverable', id] });
      queryClient.invalidateQueries({ queryKey: ['applications', 'mine'] });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'Could not submit the deliverable.'),
  });

  async function handleFile(file: File) {
    setError(null);
    setUploadPct(0);
    try {
      const signed = await api.post<SignedUpload>('/uploads/sign', {
        folder: 'deliverables',
      });
      const result = await uploadToCloudinary(file, signed, setUploadPct);
      setFileUrl(result.secureUrl);
      setFilePublicId(result.publicId);
      setFileName(file.name);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploadPct(null);
    }
  }

  if (appsQuery.isLoading || existingQuery.isLoading) {
    return <Skeleton className="h-96 max-w-2xl" />;
  }
  if (appsQuery.isError || !app) {
    return (
      <ErrorState
        message="Could not load this application."
        onRetry={() => appsQuery.refetch()}
      />
    );
  }

  const deadlinePassed =
    new Date(app.project.submissionDeadline).getTime() < Date.now();
  const canSubmit =
    !deadlinePassed &&
    note.trim().length > 0 &&
    (Boolean(linkUrl.trim()) || Boolean(fileUrl)) &&
    !submit.isPending;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Submit your deliverable"
        description={app.project.title}
        action={
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Dashboard
            </Button>
          </Link>
        }
      />

      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <DeadlineChip iso={app.project.submissionDeadline} label="Submit by" />
          {submit.isSuccess && (
            <span className="flex items-center gap-1.5 text-[14px] text-success">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>

        {deadlinePassed ? (
          <p className="rounded-[8px] bg-danger-50 p-3 text-[14px] text-danger">
            The submission deadline has passed. You can no longer submit or change
            your deliverable.
          </p>
        ) : (
          <p className="text-[14px] text-n500">
            Before the deadline you can replace your submission as many times as
            you like. Provide a repository link, an uploaded file, or both.
          </p>
        )}

        <Field
          label="Repository or link"
          htmlFor="linkUrl"
          hint="e.g. https://github.com/you/project"
        >
          <Input
            id="linkUrl"
            value={linkUrl}
            disabled={deadlinePassed}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>

        <Field label="File upload (optional)" htmlFor="file">
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              id="file"
              type="file"
              className="hidden"
              disabled={deadlinePassed}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={deadlinePassed || uploadPct !== null}
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud className="h-4 w-4" />
              {uploadPct !== null ? `Uploading ${uploadPct}%` : 'Choose file'}
            </Button>
            {fileName && uploadPct === null && (
              <span className="truncate text-[14px] text-n500">{fileName}</span>
            )}
          </div>
        </Field>

        <Field label="Note to the reviewer" htmlFor="note">
          <Textarea
            id="note"
            value={note}
            disabled={deadlinePassed}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the reviewer should know…"
          />
        </Field>

        {error && <p className="text-[14px] text-danger">{error}</p>}

        <div className="flex justify-end">
          <Button disabled={!canSubmit} onClick={() => submit.mutate()}>
            {submit.isPending
              ? 'Submitting…'
              : submit.isSuccess
                ? 'Update deliverable'
                : 'Submit deliverable'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

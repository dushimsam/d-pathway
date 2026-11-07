'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { CompanyProfile, SignedUpload } from '@/lib/types';

const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

export default function CompanySettingsPage() {
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['company', 'me'],
    queryFn: () => api.get<CompanyProfile>('/companies/me'),
  });

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPublicId, setLogoPublicId] = useState<string | null>(null);
  const [logoPct, setLogoPct] = useState<number | null>(null);

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  useEffect(() => {
    const c = data;
    if (!c) return;
    setName(c.name);
    setIndustry(c.industry ?? '');
    setWebsite(c.website ?? '');
    setLocation(c.location ?? '');
    setSize(c.size ?? '');
    setDescription(c.description ?? '');
    setLogoUrl(c.logoUrl);
    setLogoPublicId(c.logoPublicId);
  }, [data]);

  async function handleLogo(file: File) {
    setProfileErr(null);
    setLogoPct(0);
    try {
      const signed = await api.post<SignedUpload>('/uploads/sign', { folder: 'company-logos' });
      const r = await uploadToCloudinary(file, signed, setLogoPct);
      setLogoUrl(r.secureUrl);
      setLogoPublicId(r.publicId);
    } catch {
      setProfileErr('Logo upload failed. Please try again.');
    } finally {
      setLogoPct(null);
    }
  }

  const saveProfile = useMutation({
    mutationFn: () =>
      api.patch('/companies/me', {
        name: name.trim(),
        industry,
        website,
        location,
        size,
        description,
        logoUrl: logoUrl ?? '',
        logoPublicId: logoPublicId ?? '',
      }),
    onSuccess: () => {
      setProfileErr(null);
      setProfileMsg('Profile saved.');
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    },
    onError: (e) =>
      setProfileErr(e instanceof ApiError ? e.message : 'Could not save your profile.'),
  });

  // --- password ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const changePassword = useMutation({
    mutationFn: () => api.post('/auth/change-password', { currentPassword, newPassword }),
    onSuccess: () => {
      setPwErr(null);
      setPwMsg('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
    },
    onError: (e) => setPwErr(e instanceof ApiError ? e.message : 'Could not change password.'),
  });

  // --- delete ---
  const [delPassword, setDelPassword] = useState('');
  const [delErr, setDelErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function doDelete() {
    setDelErr(null);
    try {
      await fetch('/api/v1/auth/me', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: delPassword }),
      }).then(async (r) => {
        if (!r.ok) {
          const b = await r.json().catch(() => ({}));
          throw new ApiError(r.status, b.message ?? 'Could not delete account.');
        }
      });
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/';
    } catch (e) {
      setDelErr(e instanceof ApiError ? e.message : 'Could not delete account.');
    }
  }

  if (isLoading) return <Skeleton className="h-96 max-w-2xl" />;
  if (isError || !data)
    return <ErrorState message="Could not load your settings." onRetry={() => refetch()} />;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Your company profile, security, and account." />

      {/* Profile */}
      <Card className="mb-6 flex flex-col gap-5">
        <h2 className="text-[16px] font-semibold text-n900">Company profile</h2>

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-n300 bg-n100">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-n500" />
            )}
          </div>
          <div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleLogo(f);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={logoPct !== null}
              onClick={() => logoRef.current?.click()}
            >
              <UploadCloud className="h-4 w-4" />
              {logoPct !== null ? `Uploading ${logoPct}%` : 'Upload logo'}
            </Button>
            <p className="mt-1.5 text-[12px] text-n500">Square image works best.</p>
          </div>
        </div>

        <Field label="Company name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Industry" htmlFor="industry">
            <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </Field>
          <Field label="Team size" htmlFor="size">
            <Select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">—</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Website" htmlFor="website">
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Location" htmlFor="location">
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kigali, Rwanda" />
          </Field>
        </div>
        <Field label="About" htmlFor="description">
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What your organisation does…"
          />
        </Field>

        {profileErr && <p className="text-[14px] text-danger">{profileErr}</p>}
        {profileMsg && <p className="text-[14px] text-success">{profileMsg}</p>}
        <div className="flex justify-end">
          <Button disabled={!name.trim() || saveProfile.isPending} onClick={() => saveProfile.mutate()}>
            {saveProfile.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </Card>

      {/* Password */}
      <Card className="mb-6 flex flex-col gap-5">
        <h2 className="text-[16px] font-semibold text-n900">Password</h2>
        <Field label="Current password" htmlFor="cpw">
          <Input id="cpw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Field>
        <Field label="New password" htmlFor="npw" hint="At least 8 characters.">
          <Input id="npw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        {pwErr && <p className="text-[14px] text-danger">{pwErr}</p>}
        {pwMsg && <p className="text-[14px] text-success">{pwMsg}</p>}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            disabled={!currentPassword || newPassword.length < 8 || changePassword.isPending}
            onClick={() => changePassword.mutate()}
          >
            {changePassword.isPending ? 'Updating…' : 'Change password'}
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="flex flex-col gap-4 border border-danger-50">
        <h2 className="text-[16px] font-semibold text-danger">Delete account</h2>
        <p className="text-[14px] text-n700">
          Permanently deletes your company, its projects and data. This can&apos;t be undone.
        </p>
        {!confirmDelete ? (
          <div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete account
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label="Enter your password to confirm" htmlFor="delpw">
              <Input id="delpw" type="password" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} />
            </Field>
            {delErr && <p className="text-[14px] text-danger">{delErr}</p>}
            <div className="flex gap-2">
              <Button variant="danger" disabled={!delPassword} onClick={doDelete}>
                Permanently delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

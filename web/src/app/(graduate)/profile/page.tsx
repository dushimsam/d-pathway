'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, UserRound, UploadCloud } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { api, ApiError } from '@/lib/api-client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { GraduateProfile, SignedUpload } from '@/lib/types';

export default function GraduateProfilePage() {
  const queryClient = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['graduate', 'me'],
    queryFn: () => api.get<GraduateProfile>('/graduates/me'),
  });

  const [fullName, setFullName] = useState('');
  const [education, setEducation] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPublicId, setPhotoPublicId] = useState<string | null>(null);
  const [photoPct, setPhotoPct] = useState<number | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setFullName(data.fullName);
    setEducation(data.education ?? '');
    setLocation(data.location ?? '');
    setSkills(data.skills);
    setLinks(data.links);
    setPhotoUrl(data.photoUrl);
    setPhotoPublicId(data.photoPublicId);
  }, [data]);

  async function handlePhoto(file: File) {
    setProfileErr(null);
    setPhotoPct(0);
    try {
      const signed = await api.post<SignedUpload>('/uploads/sign', { folder: 'student-photos' });
      const r = await uploadToCloudinary(file, signed, setPhotoPct);
      setPhotoUrl(r.secureUrl);
      setPhotoPublicId(r.publicId);
    } catch {
      setProfileErr('Photo upload failed. Please try again.');
    } finally {
      setPhotoPct(null);
    }
  }

  const saveProfile = useMutation({
    mutationFn: () =>
      api.patch('/graduates/me', {
        fullName: fullName.trim(),
        education,
        location,
        skills,
        links,
        photoUrl: photoUrl ?? '',
        photoPublicId: photoPublicId ?? '',
      }),
    onSuccess: () => {
      setProfileErr(null);
      setProfileMsg('Profile saved.');
      queryClient.invalidateQueries({ queryKey: ['graduate', 'me'] });
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
    return <ErrorState message="Could not load your profile." onRetry={() => refetch()} />;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Your profile"
        description="This is what companies see in Talent search and on your public profile."
        action={
          data.id ? (
            <Link href={`/u/${data.id}`} target="_blank">
              <Button variant="secondary" size="sm">
                <ExternalLink className="h-4 w-4" /> View public profile
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Profile */}
      <Card className="mb-6 flex flex-col gap-5">
        <h2 className="text-[16px] font-semibold text-n900">Profile</h2>

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-n300 bg-n100">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-7 w-7 text-n500" />
            )}
          </div>
          <div>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handlePhoto(f);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={photoPct !== null}
              onClick={() => photoRef.current?.click()}
            >
              <UploadCloud className="h-4 w-4" />
              {photoPct !== null ? `Uploading ${photoPct}%` : 'Upload photo'}
            </Button>
            <p className="mt-1.5 text-[12px] text-n500">A clear headshot works best.</p>
          </div>
        </div>

        <Field label="Full name" htmlFor="name">
          <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Education" htmlFor="education">
            <Input
              id="education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="BSc Software Engineering, ALU"
            />
          </Field>
          <Field label="Location" htmlFor="location">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kigali, Rwanda"
            />
          </Field>
        </div>
        <Field label="Skills" htmlFor="skills" hint="Press Enter or comma to add. These power Talent search.">
          <TagInput id="skills" value={skills} onChange={setSkills} placeholder="e.g. React, Figma" />
        </Field>
        <Field label="Portfolio links" htmlFor="links" hint="GitHub, Behance, personal site…">
          <TagInput id="links" value={links} onChange={setLinks} placeholder="https://github.com/you" />
        </Field>

        {profileErr && <p className="text-[14px] text-danger">{profileErr}</p>}
        {profileMsg && <p className="text-[14px] text-success">{profileMsg}</p>}
        <div className="flex justify-end">
          <Button disabled={!fullName.trim() || saveProfile.isPending} onClick={() => saveProfile.mutate()}>
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
          Permanently deletes your profile, applications and data. This can&apos;t be undone.
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import {
  registerGraduateSchema,
  type RegisterGraduateInput,
} from '@/lib/schemas';

export default function RegisterGraduatePage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [skillsText, setSkillsText] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterGraduateInput>({
    resolver: zodResolver(registerGraduateSchema),
  });

  async function onSubmit(values: RegisterGraduateInput) {
    setFormError(null);
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch('/api/auth/register/graduate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, skills }),
    });
    const data = (await res.json()) as { message?: string | string[] };
    if (!res.ok) {
      const msg = Array.isArray(data.message) ? data.message[0] : data.message;
      setFormError(msg ?? 'Could not register.');
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell
      title="Join as a graduate"
      subtitle="Browse projects, apply, and submit your work."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-teal hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <Input id="fullName" {...register('fullName')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label="Education" htmlFor="education" error={errors.education?.message} hint="e.g. BSc Software Engineering, ALU, 2026">
          <Input id="education" {...register('education')} />
        </Field>
        <Field label="Skills" htmlFor="skills" hint="Comma-separated, e.g. typescript, react">
          <Input
            id="skills"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
        </Field>
        <Field label="Location" htmlFor="location" error={errors.location?.message} hint="e.g. Kigali, Gasabo">
          <Input id="location" {...register('location')} />
        </Field>
        {formError && <p className="text-[14px] text-danger">{formError}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}

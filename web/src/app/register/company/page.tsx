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
  registerCompanySchema,
  type RegisterCompanyInput,
} from '@/lib/schemas';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCompanyInput>({
    resolver: zodResolver(registerCompanySchema),
  });

  async function onSubmit(values: RegisterCompanyInput) {
    setFormError(null);
    const res = await fetch('/api/auth/register/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string | string[] };
    if (!res.ok) {
      const msg = Array.isArray(data.message) ? data.message[0] : data.message;
      setFormError(msg ?? 'Could not register.');
      return;
    }
    router.replace('/projects');
    router.refresh();
  }

  return (
    <AuthShell
      title="Register your organisation"
      subtitle="Company, cooperative or community group — post projects and review applicants."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Organisation name" htmlFor="companyName" error={errors.companyName?.message}>
          <Input id="companyName" {...register('companyName')} />
        </Field>
        <Field label="Sector" htmlFor="industry" error={errors.industry?.message} hint="e.g. Cloud, Garments & crafts, Agriculture">
          <Input id="industry" {...register('industry')} />
        </Field>
        <Field label="Your role" htmlFor="title" error={errors.title?.message} hint="e.g. CTO, Cooperative Coordinator, Secretary">
          <Input id="title" {...register('title')} />
        </Field>
        <Field label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        {formError && <p className="text-[14px] text-danger">{formError}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}

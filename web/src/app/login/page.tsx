'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { loginSchema, type LoginInput } from '@/lib/schemas';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as {
      user?: { role: string };
      message?: string | string[];
    };
    if (!res.ok) {
      const msg = Array.isArray(data.message) ? data.message[0] : data.message;
      setFormError(msg ?? 'Could not sign in.');
      return;
    }
    const next =
      search.get('next') ??
      (data.user?.role === 'COMPANY' ? '/projects' : '/dashboard');
    router.replace(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to D-Pathway."
      footer={
        <>
          New here?{' '}
          <Link href="/register/graduate" className="text-teal hover:underline">
            Join as a graduate
          </Link>{' '}
          or{' '}
          <Link href="/register/company" className="text-teal hover:underline">
            as a company
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
        </Field>
        {formError && <p className="text-[14px] text-danger">{formError}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

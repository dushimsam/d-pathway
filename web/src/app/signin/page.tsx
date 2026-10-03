'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Authentication is not implemented in this phase — show a placeholder notice
    // instead of calling an endpoint.
    setNotice(true);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto flex max-w-5xl items-start justify-center px-6 py-16">
        <div className="w-full max-w-[400px] rounded-lg bg-white p-8">
          <h1 className="text-[24px] font-semibold text-neutral-900">Sign in</h1>
          <p className="mt-1 text-[14px] font-normal text-neutral-500">
            Welcome back. Sign in to continue to D-Pathway.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-[13px] font-medium text-neutral-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-500 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-neutral-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-500 focus-visible:border-primary-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-600"
              />
            </div>

            {notice && (
              <div
                role="status"
                className="rounded-md bg-warning-50 px-4 py-3 text-[14px] font-normal text-warning-600"
              >
                Authentication arrives in a later phase. This foundation build
                does not sign users in yet.
              </div>
            )}

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-md bg-primary-600 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-primary-600/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-[13px] font-normal text-neutral-500">
            <Link
              href="/"
              className="rounded-sm font-medium text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Back to pathways
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

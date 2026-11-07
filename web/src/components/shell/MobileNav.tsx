'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { NavItem } from './NavItem';
import { LogoutButton } from './LogoutButton';
import { WalletNavLink } from './WalletNavLink';
import type { NavLink } from './Shell';

/** Mobile-only top bar with a slide-in drawer; the sidebar is hidden on phones. */
export function MobileNav({
  email,
  roleLabel,
  nav,
}: {
  email: string;
  roleLabel: string;
  nav: NavLink[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-n300 bg-n0 px-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-n300 text-n900"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="text-[16px] font-bold text-primary-dark">
          D·Pathway
        </Link>
        <WalletNavLink />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex h-full w-72 max-w-[82%] flex-col bg-n0 px-4 py-5">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-[18px] font-bold text-primary-dark"
                >
                  D·Pathway
                </Link>
                <p className="mt-0.5 text-[12px] text-n500">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-n300 text-n900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
              {nav.map((item) => (
                <NavItem key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
            <div className="mt-auto border-t border-n300 pt-4">
              <p className="mb-3 truncate text-[13px] text-n500">{email}</p>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavItem } from './NavItem';
import { LogoutButton } from './LogoutButton';
import { WalletNavLink } from './WalletNavLink';
import { MobileNav } from './MobileNav';

export interface NavLink {
  href: string;
  label: string;
}

export function Shell({
  email,
  roleLabel,
  nav,
  children,
}: {
  email: string;
  roleLabel: string;
  nav: NavLink[];
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === '1');
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem('sidebar-collapsed', c ? '0' : '1');
      return !c;
    });

  return (
    <div className="app-light flex min-h-screen bg-n100 text-n900">
      {/* Desktop sidebar — foldable */}
      {!collapsed && (
        <aside className="hidden w-60 shrink-0 flex-col border-r border-n300 bg-n0 px-4 py-6 md:flex">
          <div className="mb-8 flex items-start justify-between px-3">
            <div>
              <Link
                href="/"
                className="text-[18px] font-bold text-primary-dark transition-opacity hover:opacity-80"
                aria-label="D·Pathway home"
              >
                D·Pathway
              </Link>
              <p className="mt-0.5 text-[12px] text-n500">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-n500 transition-colors hover:bg-n100 hover:text-n900"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-16 items-center justify-between border-b border-n300 bg-n0 px-6 md:flex">
          {collapsed ? (
            <button
              type="button"
              onClick={toggle}
              aria-label="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-n300 text-n900 transition-colors hover:border-primary hover:text-primary"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4">
            <WalletNavLink />
            <span className="text-[14px] text-n500">{email}</span>
            <LogoutButton />
          </div>
        </header>

        <MobileNav email={email} roleLabel={roleLabel} nav={nav} />

        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

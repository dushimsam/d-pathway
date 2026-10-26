import type { ReactNode } from 'react';
import { NavItem } from './NavItem';
import { LogoutButton } from './LogoutButton';

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
  return (
    <div className="flex min-h-screen bg-n100">
      <aside className="flex w-60 shrink-0 flex-col border-r border-n300 bg-n0 px-4 py-6">
        <div className="mb-8 px-3">
          <span className="text-[18px] font-bold text-primary-dark">D·Pathway</span>
          <p className="mt-0.5 text-[12px] text-n500">{roleLabel}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b border-n300 bg-n0 px-8">
          <div className="flex items-center gap-4">
            <span className="text-[14px] text-n500">{email}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

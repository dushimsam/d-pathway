'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-[8px] px-3 py-2 text-[14px] font-medium transition-colors',
        active
          ? 'bg-primary-50 text-primary-dark'
          : 'text-n700 hover:bg-n100',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          active ? 'bg-primary-dark' : 'bg-n300',
        )}
        aria-hidden
      />
      {label}
    </Link>
  );
}

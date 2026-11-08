import { redirect } from 'next/navigation';
import { Shell } from '@/components/shell/Shell';
import { getCurrentUserServer } from '@/lib/server-api';
import { UserRole } from '@/lib/types';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/saved', label: 'Saved' },
  { href: '/applications', label: 'Applications' },
  { href: '/profile', label: 'Profile' },
];

export default async function GraduateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/login');
  if (user.role !== UserRole.GRADUATE) redirect('/projects');

  return (
    <Shell email={user.email} roleLabel="Graduate" nav={NAV}>
      {children}
    </Shell>
  );
}

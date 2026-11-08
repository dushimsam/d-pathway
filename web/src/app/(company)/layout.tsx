import { redirect } from 'next/navigation';
import { Shell } from '@/components/shell/Shell';
import { getCurrentUserServer } from '@/lib/server-api';
import { UserRole } from '@/lib/types';

const NAV = [
  { href: '/projects', label: 'Projects' },
  { href: '/talent', label: 'Talent' },
  { href: '/settings', label: 'Settings' },
];

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/login');
  if (user.role !== UserRole.COMPANY) redirect('/dashboard');

  return (
    <Shell email={user.email} roleLabel="Company" nav={NAV}>
      {children}
    </Shell>
  );
}

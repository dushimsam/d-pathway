import { redirect } from 'next/navigation';
import { Shell } from '@/components/shell/Shell';
import { getCurrentUserServer } from '@/lib/server-api';

const NAV = [
  { href: '/projects', label: 'Projects' },
  { href: '/projects/new', label: 'New project' },
];

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/login');
  if (user.role !== 'COMPANY') redirect('/dashboard');

  return (
    <Shell email={user.email} roleLabel="Company" nav={NAV}>
      {children}
    </Shell>
  );
}

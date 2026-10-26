import { redirect } from 'next/navigation';
import { Shell } from '@/components/shell/Shell';
import { getCurrentUserServer } from '@/lib/server-api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/catalogue', label: 'Catalogue' },
];

export default async function GraduateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserServer();
  if (!user) redirect('/login');
  if (user.role !== 'GRADUATE') redirect('/projects');

  return (
    <Shell email={user.email} roleLabel="Graduate" nav={NAV}>
      {children}
    </Shell>
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserAppShell } from '@/components/layout/user-app-shell';
import { DashboardHome } from '@/components/dashboard/dashboard-home';

export const metadata = {
  title: 'Dashboard',
  description: 'Manage servers where DJ Ramu Kaka is installed',
};

/** Same cookie name as apps/api cookieSession (`mbs_session`). */
const SESSION_COOKIE = 'mbs_session';

export default function DashboardPage() {
  const session = cookies().get(SESSION_COOKIE);
  if (!session?.value) {
    redirect('/login?next=/dashboard');
  }

  return (
    <UserAppShell
      title="Dashboard"
      description="System overview, users, servers, and playlist controls."
    >
      <DashboardHome />
    </UserAppShell>
  );
}

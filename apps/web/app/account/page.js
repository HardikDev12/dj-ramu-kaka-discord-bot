import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserAppShell } from '@/components/layout/user-app-shell';
import { CompleteProfileForm } from '@/components/account/complete-profile-form';

/** Same cookie name as apps/api cookieSession (`mbs_session`). */
const SESSION_COOKIE = 'mbs_session';

export const metadata = {
  title: 'Account',
  description: 'Profile and display name for DJ Ramu Kaka',
};

export default function AccountPage({ searchParams }) {
  const session = cookies().get(SESSION_COOKIE);
  if (!session?.value) {
    redirect('/login?next=/account');
  }
  const next = typeof searchParams?.next === 'string' && searchParams.next.startsWith('/')
    ? searchParams.next
    : '/dashboard';

  return (
    <UserAppShell
      title="Account"
      description="Your profile appears in the header and across the console."
    >
      <CompleteProfileForm defaultNext={next} />
    </UserAppShell>
  );
}

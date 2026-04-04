import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserAppShell } from '@/components/layout/user-app-shell';

/** Same cookie name as apps/api cookieSession (`mbs_session`). */
const SESSION_COOKIE = 'mbs_session';

export default function PlaylistsLayout({ children }) {
  const session = cookies().get(SESSION_COOKIE);
  if (!session?.value) {
    redirect('/login?next=/playlists');
  }
  return (
    <UserAppShell
      title="My Playlists"
      description="Manage your saved tracks and keep them synced with your Discord bot commands."
    >
      {children}
    </UserAppShell>
  );
}

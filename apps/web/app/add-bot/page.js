import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserAppShell } from '@/components/layout/user-app-shell';
import { getDiscordBotInviteUrl } from '../../lib/discord-bot-invite';

export const metadata = {
  title: 'Add bot to your server',
  description: 'Invite the music bot via Discord (web)',
};

/** Same cookie name as apps/api cookieSession (`mbs_session`). */
const SESSION_COOKIE = 'mbs_session';

export default function AddBotPage() {
  const session = cookies().get(SESSION_COOKIE);
  if (!session?.value) {
    redirect('/login?next=/add-bot');
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const permissions = process.env.NEXT_PUBLIC_DISCORD_BOT_PERMISSIONS || '36785152';
  const inviteUrl = getDiscordBotInviteUrl(clientId, permissions);

  return (
    <UserAppShell
      title="Add Bot"
      description="Invite the bot to your Discord server and complete setup."
    >
      <main className="mx-auto max-w-2xl space-y-4">
        <p className="rounded-md border border-[#262626] bg-[#131313] p-3 text-sm text-[#adaaaa]">
          This opens Discord&apos;s official invite page. Install the bot on a server where you have{' '}
          <strong>Manage Server</strong>.
        </p>

        {!inviteUrl ? (
          <p className="rounded-md border border-[#6e4a12] bg-[#2e2415] p-4 text-sm text-[#ffd184]">
            Set <code>CLIENT_ID</code> (or <code>NEXT_PUBLIC_DISCORD_CLIENT_ID</code>) in root <code>.env</code>,
            then restart <code>npm run dev:web</code>.
          </p>
        ) : (
          <div className="space-y-3 rounded-lg border border-[#262626] bg-[#131313] p-4 sm:p-5">
            <a
              href={inviteUrl}
              className="inline-flex w-full items-center justify-center rounded-md bg-gradient-to-r from-[#5865F2] to-[#4752C4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 sm:w-auto"
            >
              Add to Discord
            </a>
            <p className="text-sm text-[#adaaaa]">
              After installing, the bot appears in your server. Voice playback needs Lavalink and slash commands configured.
            </p>
          </div>
        )}

        <p className="text-sm text-[#adaaaa]">
          <Link href="/playlists" className="underline underline-offset-4">
            Go to playlists
          </Link>
        </p>
      </main>
    </UserAppShell>
  );
}

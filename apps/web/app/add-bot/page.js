import Link from 'next/link';
import { getDiscordBotInviteUrl } from '../../lib/discord-bot-invite';

export const metadata = {
  title: 'Add bot to your server',
  description: 'Invite the music bot via Discord (web)',
};

export default function AddBotPage() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const permissions = process.env.NEXT_PUBLIC_DISCORD_BOT_PERMISSIONS || '36785152';
  const inviteUrl = getDiscordBotInviteUrl(clientId, permissions);

  return (
    <main style={{ maxWidth: '36rem' }}>
      <p>
        <Link href="/">← Home</Link>
      </p>
      <h1>Add bot to your server</h1>
      <p>
        This opens Discord’s official page so you can install the bot on a server where you have{' '}
        <strong>Manage Server</strong>. No terminal required.
      </p>

      {!inviteUrl ? (
        <p style={{ color: '#b45309', padding: '1rem', background: '#fffbeb', borderRadius: 8 }}>
          Set <code>CLIENT_ID</code> (or <code>NEXT_PUBLIC_DISCORD_CLIENT_ID</code>) in the repo root{' '}
          <code>.env</code> to your Discord Application ID, then restart <code>npm run dev:web</code>.
        </p>
      ) : (
        <>
          <p>
            <a
              href={inviteUrl}
              style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: '#5865F2',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Add to Discord
            </a>
          </p>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>
            After installing, the bot appears in your server’s member list. Voice playback still needs
            Lavalink running and slash commands (Phase 3).
          </p>
        </>
      )}
    </main>
  );
}

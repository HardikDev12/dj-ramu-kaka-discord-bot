import { LandingPage } from '@/components/landing/landing-page';
import { getDiscordBotInviteUrl } from '@/lib/discord-bot-invite';

export const metadata = {
  title: 'DJ Ramu Kaka — Discord music bot',
  description:
    'Voice-first Discord music bot: YouTube playback, queues, slash commands, and web playlists synced with your account.',
};

export default function Home() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const permissions = process.env.NEXT_PUBLIC_DISCORD_BOT_PERMISSIONS || '36785152';
  const inviteUrl = getDiscordBotInviteUrl(clientId, permissions);

  return <LandingPage inviteUrl={inviteUrl} />;
}

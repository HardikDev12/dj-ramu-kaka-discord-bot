import Link from 'next/link';
import { PublicSiteShell } from '@/components/layout/public-site-shell';

export const metadata = {
  title: 'Privacy',
  description: 'Privacy policy for DJ Ramu Kaka web app',
};

export default function PrivacyPage() {
  return (
    <PublicSiteShell>
      <main className="min-h-screen px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="font-display text-3xl font-black sm:text-4xl">Privacy Policy</h1>
          <p className="text-[#adaaaa]">
            DJ Ramu Kaka stores only required account and playlist metadata needed for app and bot functionality.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[#d0d0d0]">
            <li>Discord OAuth data is used only for authentication and authorized features.</li>
            <li>No audio files are stored by this dashboard.</li>
            <li>You can request account data removal by contacting the maintainer.</li>
          </ul>
          <p>
            <Link href="/" className="text-[#fdd400] underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </PublicSiteShell>
  );
}

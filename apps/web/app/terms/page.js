import Link from 'next/link';
import { PublicSiteShell } from '@/components/layout/public-site-shell';

export const metadata = {
  title: 'Terms',
  description: 'Terms of service for DJ Ramu Kaka web app',
};

export default function TermsPage() {
  return (
    <PublicSiteShell>
      <main className="min-h-screen px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="font-display text-3xl font-black sm:text-4xl">Terms of Service</h1>
          <p className="text-[#adaaaa]">
            By using DJ Ramu Kaka, you agree to use the service responsibly and follow Discord platform rules.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[#d0d0d0]">
            <li>Do not abuse playback features or spam commands.</li>
            <li>Respect copyright and server moderation policies.</li>
            <li>Service availability can change during maintenance windows.</li>
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

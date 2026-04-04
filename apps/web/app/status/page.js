import Link from 'next/link';
import { PublicSiteShell } from '@/components/layout/public-site-shell';

export const metadata = {
  title: 'Status',
  description: 'Service status for DJ Ramu Kaka',
};

export default function StatusPage() {
  return (
    <PublicSiteShell>
      <main className="min-h-screen px-4 py-10 text-white sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="font-display text-3xl font-black sm:text-4xl">Service Status</h1>
          <div className="rounded-xl border border-[#2f3f2f] bg-[#132013] p-4">
            <p className="text-sm font-semibold text-[#9fe29f]">All systems operational</p>
            <p className="mt-1 text-sm text-[#b8c8b8]">Web, API, and Bot services are currently healthy.</p>
          </div>
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

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const discordHref = `/auth/discord?next=${encodeURIComponent(nextPath)}`;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Login failed');
        return;
      }
      router.push(nextPath.startsWith('/') ? nextPath : '/playlists');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Access the Stage" subtitle="Sign in to control your soundscape.">
      <div className="space-y-6">
        <a
          href={discordHref}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] active:scale-95"
        >
          Login with Discord
        </a>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-[#484847]" />
          <span className="mx-4 text-xs font-bold uppercase tracking-[0.2em] text-[#adaaaa]">or email login</span>
          <div className="grow border-t border-[#484847]" />
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block px-1 text-xs font-black uppercase tracking-widest text-[#ffa84f]" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              className="w-full rounded-xl border-b-2 border-transparent bg-black py-3.5 pl-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#fdd400]"
              placeholder="dj@ramukaka.audio"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-xs font-black uppercase tracking-widest text-[#ffa84f]" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="w-full rounded-xl border-b-2 border-transparent bg-black py-3.5 pl-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#fdd400]"
              placeholder="........"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-[#ff7351]">{error}</p> : null}

          <button
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#ffa84f] to-[#fe9400] py-4 text-sm font-black uppercase tracking-widest text-[#231000] transition-all hover:shadow-[0_0_20px_rgba(255,168,79,0.3)] active:scale-95 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Entering...' : 'Enter the Console'}
          </button>
        </form>

        <footer className="space-y-3 pt-2 text-center">
          <p className="text-sm text-[#adaaaa]">
            New producer?{' '}
            <Link className="font-bold text-[#fdd400] underline decoration-2 underline-offset-4" href={`/register?next=${encodeURIComponent(nextPath)}`}>
              Create an account
            </Link>
          </p>
          <p className="text-xs text-white/40">
            <Link href="/" className="underline underline-offset-4 hover:text-white">
              Back to home
            </Link>
          </p>
        </footer>
      </div>
    </AuthShell>
  );
}

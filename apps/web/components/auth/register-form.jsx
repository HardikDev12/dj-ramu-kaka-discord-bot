'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError('First name and last name are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, firstName: fn, lastName: ln }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Registration failed');
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

  const discordHref = `/auth/discord?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthShell title="Create Account" subtitle="Fill in your details to start your musical journey.">
      <div className="space-y-6">
        <a
          href={discordHref}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] active:scale-95"
        >
          Register with Discord
        </a>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-[#484847]" />
          <span className="mx-4 text-xs font-bold uppercase tracking-[0.2em] text-[#adaaaa]">or email signup</span>
          <div className="grow border-t border-[#484847]" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block px-1 text-xs font-black uppercase tracking-widest text-[#ffa84f]" htmlFor="firstName">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className="w-full rounded-xl border-b-2 border-transparent bg-black py-3.5 pl-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#fdd400]"
                placeholder="Ramu"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block px-1 text-xs font-black uppercase tracking-widest text-[#ffa84f]" htmlFor="lastName">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className="w-full rounded-xl border-b-2 border-transparent bg-black py-3.5 pl-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#fdd400]"
                placeholder="Kaka"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block px-1 text-xs font-black uppercase tracking-widest text-[#ffa84f]" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border-b-2 border-transparent bg-black py-3.5 pl-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#fdd400]"
              placeholder="dj@soundstage.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block px-1 text-xs font-black uppercase tracking-widest text-[#ffa84f]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border-b-2 border-transparent bg-black py-3.5 pl-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-[#fdd400]"
              placeholder="........"
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
            {loading ? 'Creating account…' : 'Create My Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#adaaaa]">
          Already have an account?{' '}
          <Link className="font-bold text-[#fdd400] underline decoration-2 underline-offset-4" href={`/login?next=${encodeURIComponent(nextPath)}`}>
            Login here
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

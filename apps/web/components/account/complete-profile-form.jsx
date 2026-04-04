'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/page-loader';

function clientProfileOk(firstName, lastName, displayName) {
  const fn = String(firstName || '').trim();
  const ln = String(lastName || '').trim();
  const dn = String(displayName || '').trim();
  if (fn && ln) return true;
  if (dn.length >= 2) return true;
  return false;
}

export function CompleteProfileForm({ defaultNext = '/dashboard' }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          router.push('/login?next=/account');
          return;
        }
        const data = await res.json().catch(() => ({}));
        const u = data.user;
        if (cancelled || !u) return;
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setDisplayName(u.displayName || '');
        setEmail(u.email || '');
        setProvider(u.provider || '');
        setDiscordUsername(u.username || '');
        setAvatarUrl(u.avatarUrl || '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!clientProfileOk(firstName, lastName, displayName)) {
      setError('Enter first and last name, or a display name of at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/data/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, displayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Could not save profile');
        return;
      }
      const next = defaultNext.startsWith('/') ? defaultNext : '/dashboard';
      router.push(next);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader label="Loading profile" />;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-[#262626] bg-[#131313] p-5 sm:flex-row sm:items-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl border border-[#262626] object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[#262626] bg-[#1f1f1f] text-lg font-bold text-[#fdd400]">
            {(firstName?.[0] || displayName?.[0] || email?.[0] || '?').toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#adaaaa]">Signed in</p>
          <p className="truncate font-semibold text-white">{email || discordUsername || 'Discord user'}</p>
          {provider === 'discord' ? (
            <p className="mt-1 text-sm text-[#adaaaa]">
              Discord: <span className="text-[#fdd400]">@{discordUsername || 'user'}</span>
            </p>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[#262626] bg-[#131313] p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Your name</h3>
          <p className="mt-1 text-sm text-[#adaaaa]">
            Use your first and last name, or a single display name (at least 2 characters).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#ffa84f]" htmlFor="pf-first">
              First name
            </label>
            <input
              id="pf-first"
              className="w-full rounded-xl border border-[#262626] bg-black px-3 py-2.5 text-sm text-white focus:border-[#ffa84f] focus:outline-none"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#ffa84f]" htmlFor="pf-last">
              Last name
            </label>
            <input
              id="pf-last"
              className="w-full rounded-xl border border-[#262626] bg-black px-3 py-2.5 text-sm text-white focus:border-[#ffa84f] focus:outline-none"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#ffa84f]" htmlFor="pf-display">
            Display name <span className="font-normal text-[#767575]">(optional if first and last are set)</span>
          </label>
          <input
            id="pf-display"
            className="w-full rounded-xl border border-[#262626] bg-black px-3 py-2.5 text-sm text-white focus:border-[#ffa84f] focus:outline-none"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            placeholder="How you want to appear in the app"
          />
        </div>

        {error ? <p className="text-sm text-[#ff7351]">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-r from-[#ffa84f] to-[#fe9400] py-3 text-sm font-bold uppercase tracking-widest text-[#231000] hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}

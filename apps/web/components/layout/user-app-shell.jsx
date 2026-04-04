'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/playlists', label: 'Playlists' },
  { href: '/add-bot', label: 'Add Bot' },
  { href: '/account', label: 'Account' },
];

export function UserAppShell({ title = 'Dashboard', description, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setMe(null);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setMe(data.user || null);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (meLoading || !me) return;
    if (me.profileComplete) return;
    if (pathname === '/account' || pathname?.startsWith('/account/')) return;
    const next = encodeURIComponent(pathname || '/dashboard');
    router.replace(`/account?next=${next}`);
  }, [meLoading, me, pathname, router]);

  async function onLogout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
    router.refresh();
  }

  const onAccount = pathname === '/account' || pathname?.startsWith('/account/');
  const blockContent = !onAccount && (meLoading || (me && !me.profileComplete));

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#262626] bg-[#0e0e0e] p-4 md:flex md:flex-col">
          <div className="mb-5 rounded-xl border border-[#262626] bg-[#131313] p-3">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo-transparent.png"
                alt="DJ Ramu Kaka"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg bg-[#fe9400]/10 object-contain p-1"
              />
              <div>
                <p className="font-display text-sm font-bold text-[#ffa84f]">DJ Ramu Kaka</p>
                <p className="text-[10px] uppercase tracking-widest text-[#adaaaa]">Audio Console</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-lg px-3 py-2.5 text-sm transition-all',
                    active
                      ? 'bg-gradient-to-r from-[#ffa84f] to-[#fe9400] font-semibold text-[#231000] shadow-[0_0_16px_rgba(255,168,79,0.25)]'
                      : 'text-[#adaaaa] hover:bg-[#131313] hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-[#262626] bg-[#131313] p-3">
            <p className="text-xs text-[#adaaaa]">Session</p>
            <Button
              type="button"
              className="mt-2 w-full bg-gradient-to-r from-[#ffa84f] to-[#fe9400] text-[#231000] hover:opacity-90"
              onClick={onLogout}
            >
              Log out
            </Button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#262626] bg-[#0e0e0e]/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                {description ? <p className="mt-1 text-sm text-[#adaaaa]">{description}</p> : null}
              </div>
              <div className="hidden min-w-[220px] flex-1 md:block md:max-w-md">
                <input
                  className="w-full rounded-xl border border-[#262626] bg-[#131313] px-3 py-2 text-sm text-white placeholder:text-[#767575] focus:border-[#ffa84f] focus:outline-none"
                  placeholder="Search playlists, tracks..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-2">
                {!meLoading && me ? (
                  <Link
                    href="/account"
                    className="flex max-w-[220px] items-center gap-2 rounded-xl border border-[#262626] bg-[#131313] py-1.5 pl-1.5 pr-3 transition-colors hover:border-[#ffa84f]/50"
                  >
                    {me.avatarUrl ? (
                      <img
                        src={me.avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1f1f1f] text-xs font-bold text-[#fdd400]">
                        {(me.displayLabel || me.username || me.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold text-white">{me.displayLabel || me.username || 'User'}</p>
                      <p className="truncate text-[11px] text-[#767575]">
                        {me.email || (me.provider === 'discord' ? `@${me.username || 'discord'}` : '')}
                      </p>
                    </div>
                  </Link>
                ) : null}
                <Button type="button" className="md:hidden" onClick={onLogout}>
                  Log out
                </Button>
              </div>
            </div>
            <nav className="mt-4 flex flex-wrap gap-2 md:hidden">
              {navItems.map((item) => {
                const active =
                  pathname === item.href || (item.href !== '/' && pathname?.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm transition-colors',
                      active ? 'bg-[#ffa84f]/20 text-[#ffa84f]' : 'bg-[#131313] text-[#adaaaa] hover:text-white'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <div className="px-4 py-6 md:px-8">
            {blockContent ? <PageLoader label="Loading your profile" /> : children}
          </div>
        </section>
      </div>
    </div>
  );
}

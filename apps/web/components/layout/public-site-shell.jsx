'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function PublicSiteShell({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const res = await fetch('/auth/me', { credentials: 'include' });
        if (!cancelled) setIsLoggedIn(res.ok);
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      }
    }
    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#0e0e0e] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[#262626] bg-[#0e0e0e]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image src="/brand/logo-transparent.png" alt="DJ RAMU KAKA" fill className="object-contain" />
            </div>
            <span className="font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">DJ RAMU KAKA</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="hidden px-4 py-2 text-sm font-bold text-gray-300 transition-colors hover:text-white sm:block"
              href={isLoggedIn ? '/dashboard' : '/login'}
            >
              {isLoggedIn ? 'Dashboard' : 'Login'}
            </Link>
            <Link
              href={isLoggedIn ? '/dashboard' : '/register'}
              className="rounded-xl bg-gradient-to-r from-[#ffa84f] to-[#fe9400] px-4 py-2.5 text-sm font-black text-[#231000] transition-transform duration-200 hover:scale-[1.03]"
            >
              {isLoggedIn ? 'Open Admin Panel' : 'Join'}
            </Link>
          </div>
        </nav>
      </header>

      {children}

      <footer className="border-t border-[#262626] bg-[#0e0e0e] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden">
                <Image src="/brand/logo-transparent.png" alt="DJ RAMU KAKA" fill className="object-contain" />
              </div>
              <span className="font-display text-lg font-bold text-[#fdd400]">DJ RAMU KAKA</span>
            </div>
            <p className="text-sm uppercase tracking-wide text-gray-500">2026 DJ RAMU KAKA. HIGH-OCTANE AUDIO.</p>
          </div>

          <div className="flex gap-6 text-sm uppercase tracking-wide text-gray-500 sm:gap-8">
            <Link className="transition-colors duration-200 hover:text-[#fdd400]" href="/terms">
              Terms
            </Link>
            <Link className="transition-colors duration-200 hover:text-[#fdd400]" href="/privacy">
              Privacy
            </Link>
            <Link className="transition-colors duration-200 hover:text-[#fdd400]" href="/status">
              Status
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-screen-2xl border-t border-[#262626] pt-5 text-center text-sm text-[#adaaaa]">
          Made by Hardik ·{' '}
          <a
            href="https://github.com/HardikDev12"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#fdd400] underline underline-offset-4 hover:text-white"
          >
            github.com/HardikDev12
          </a>
        </div>
      </footer>
    </div>
  );
}

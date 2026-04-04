"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * @param {{ inviteUrl: string | null }} props
 */
export function LandingPage({ inviteUrl }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const reduceMotion = useReducedMotion();

  const inView = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.55, ease: "easeOut" },
      };

  function scrollToSection(e, sectionId) {
    e.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;
    const headerOffset = 96;
    const top =
      target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({
      top,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
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
    <div className="bg-[#0e0e0e] text-white selection:bg-[#ffa84f] selection:text-[#231000]">
      <header className="fixed top-0 z-50 w-full bg-[#0e0e0e]/60 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src="/brand/logo-transparent.png"
                alt="DJ RAMU KAKA"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">
              DJ RAMU KAKA
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wide text-gray-300 md:flex">
            <a
              className="cursor-pointer border-b-2 border-[#fdd400] pb-1 text-[#fdd400]"
              href="#features"
              onClick={(e) => scrollToSection(e, "features")}
            >
              Features
            </a>
            <a
              className="cursor-pointer transition-colors hover:text-white"
              href="#commands"
              onClick={(e) => scrollToSection(e, "commands")}
            >
              Commands
            </a>
            <a
              className="cursor-pointer transition-colors hover:text-white"
              href="#support"
              onClick={(e) => scrollToSection(e, "support")}
            >
              Support
            </a>
          </div>

          <div className="flex items-center gap-3">
            {!isLoggedIn && (
              <Link
                className="hidden px-4 py-2 text-sm font-bold text-gray-300 transition-colors hover:text-white sm:block"
                href="/login"
              >
                Login
              </Link>
            )}
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-r from-[#ffa84f] to-[#fe9400] px-5 py-2.5 text-sm font-black text-[#231000] transition-transform duration-200 hover:scale-[1.03]"
              >
                Open Dashboard
              </Link>
            ) : (
              <a
                href={inviteUrl || "/add-bot"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-gradient-to-r from-[#ffa84f] to-[#fe9400] px-5 py-2.5 text-sm font-black text-[#231000] transition-transform duration-200 hover:scale-[1.03]"
              >
                Add to Discord
              </a>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-20 pt-32 lg:px-8">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-[#fe9400] blur-[120px]" />
            <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-[#fdd400] blur-[120px]" />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <motion.div className="space-y-8 lg:col-span-7" {...inView}>
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-[#484847]/30 bg-[#262626] px-4 py-1.5"
                {...inView}
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5fe00]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#c5fe00]">
                  Now Streaming
                </span>
              </motion.div>

              <h1 className="font-display text-5xl font-black leading-[0.9] tracking-tighter text-white md:text-7xl lg:text-8xl">
                THE <span className="text-gradient">ULTIMATE</span>
                <br />
                DISCORD RHYTHM.
              </h1>

              <p className="max-w-xl text-lg leading-relaxed text-[#adaaaa] md:text-xl">
                Experience low-latency, high-fidelity audio that transforms your
                server into a premium soundstage. No lag, just pure energy.
              </p>

              <motion.div
                className="flex flex-wrap gap-4 pt-2"
                {...inView}
                transition={{
                  duration: 0.55,
                  ease: "easeOut",
                  delay: reduceMotion ? 0 : 0.1,
                }}
              >
                {inviteUrl ? (
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-gradient-to-br from-[#ffa84f] to-[#fe9400] px-8 py-4 text-base font-black text-[#231000] transition-transform hover:scale-[1.03]"
                  >
                    {isLoggedIn ? "OPEN DASHBOARD" : "ADD TO DISCORD"}
                  </a>
                ) : (
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/add-bot"}
                    className="rounded-xl bg-gradient-to-br from-[#ffa84f] to-[#fe9400] px-8 py-4 text-base font-black text-[#231000] transition-transform hover:scale-[1.03]"
                  >
                    {isLoggedIn ? "OPEN DASHBOARD" : "ADD TO DISCORD"}
                  </Link>
                )}
                <a
                  href="#commands"
                  onClick={(e) => scrollToSection(e, "commands")}
                  className="rounded-xl border border-[#484847]/60 bg-[#262626] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#2c2c2c]"
                >
                  VIEW COMMANDS
                </a>
              </motion.div>

              <motion.div
                className="flex items-end gap-1 pt-3 opacity-50"
                aria-hidden
                {...inView}
              >
                {[8, 16, 10, 14, 6, 12].map((h, i) => (
                  <span
                    key={`${h}-${i}`}
                    className="inline-block w-1 rounded-full bg-[#fdd400]"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative lg:col-span-5"
              {...inView}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: reduceMotion ? 0 : 0.15,
              }}
            >
              <motion.div
                className="relative z-10 rotate-2 overflow-hidden rounded-3xl border border-white/5 bg-[#1a1919] shadow-2xl shadow-black/60 transition-transform duration-500 hover:rotate-0"
                whileHover={reduceMotion ? undefined : { y: -4, rotate: 0 }}
              >
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#262626] to-[#0e0e0e] p-12">
                  <div className="relative h-full w-full">
                    <Image
                      src="/brand/logo-transparent.png"
                      alt="DJ RAMU KAKA ILLUSTRATION"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="glass-panel absolute bottom-0 left-0 right-0 border-t border-white/10 p-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        Now Playing
                      </h3>
                      <p className="text-sm font-bold text-[#fdd400]">
                        Midnight City - M83
                      </p>
                    </div>
                    <div className="animated-bars flex h-6 items-end gap-0.5">
                      <span style={{ animationDelay: "0.1s" }} />
                      <span style={{ animationDelay: "0.3s" }} />
                      <span style={{ animationDelay: "0.2s" }} />
                      <span style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 bg-[#fdd400]" />
                  </div>
                </div>
              </motion.div>
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#fdd400]/20 blur-3xl" />
            </motion.div>
          </div>
        </section>

        <motion.section
          id="features"
          className="scroll-mt-28 mx-auto max-w-screen-2xl px-6 py-24 lg:px-8"
          {...inView}
        >
          <motion.div className="mb-14" {...inView}>
            <h2 className="font-display text-4xl font-black text-white md:text-5xl">
              BUILT FOR{" "}
              <span className="italic text-[#fdd400]">PERFORMANCE.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-[#adaaaa]">
              Engineered with low-latency protocols and high-bitrate codecs so
              your music sounds exactly as intended.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <motion.article
              className="group overflow-hidden rounded-[2rem] bg-[#131313] p-1 md:col-span-8"
              {...inView}
            >
              <div className="relative h-full overflow-hidden rounded-[1.8rem] bg-[#262626] p-10">
                <div className="relative z-10 max-w-md">
                  <span className="mb-6 block font-display text-5xl font-black text-[#ffa84f]">
                    01
                  </span>
                  <h3 className="font-display text-3xl font-extrabold uppercase text-white">
                    High-Quality Audio
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-[#adaaaa]">
                    Private high-bandwidth nodes deliver crisp audio and deep
                    bass without muddy compression artifacts.
                  </p>
                </div>
              </div>
            </motion.article>

            <motion.article
              className="rounded-[2rem] bg-[#131313] p-1 md:col-span-4"
              {...inView}
            >
              <div className="flex h-full flex-col justify-center rounded-[1.8rem] bg-[#262626] p-8 text-center">
                <h3 className="font-display text-2xl font-extrabold uppercase text-white">
                  24/7 Availability
                </h3>
                <p className="mt-2 text-[#adaaaa]">
                  The music never stops. Keep your vibe alive around the clock.
                </p>
              </div>
            </motion.article>

            <motion.article
              className="rounded-[2rem] bg-[#131313] p-1 md:col-span-4"
              {...inView}
            >
              <div className="flex h-full flex-col justify-center rounded-[1.8rem] bg-[#262626] p-8 text-center">
                <h3 className="font-display text-2xl font-extrabold uppercase text-white">
                  Custom Playlists
                </h3>
                <p className="mt-2 text-[#adaaaa]">
                  Save favorites on web and sync with your Discord commands.
                </p>
              </div>
            </motion.article>

            <motion.article
              id="commands"
              className="scroll-mt-28 overflow-hidden rounded-[2rem] bg-[#131313] p-1 md:col-span-8"
              {...inView}
            >
              <div className="flex h-full items-center gap-8 rounded-[1.8rem] bg-[#262626] p-10">
                <div className="hidden w-1/3 lg:block">
                  <div className="space-y-2 rounded-2xl border border-white/5 bg-[#2c2c2c] p-6 font-mono text-sm">
                    <p className="text-green-400">$ /play lo-fi beats</p>
                    <p className="text-gray-500">&gt; Found: 1,240 results</p>
                    <p className="text-white">
                      &gt; Playing: Rainy Night in Tokyo
                    </p>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="mb-6 block font-display text-5xl font-black text-[#fdd400]">
                    02
                  </span>
                  <h3 className="font-display text-3xl font-extrabold uppercase text-white">
                    Intuitive Control
                  </h3>
                  <p className="mt-4 leading-relaxed text-[#adaaaa]">
                    Use slash commands or the web dashboard to manage queue,
                    playlists, and playback quickly.
                  </p>
                </div>
              </div>
            </motion.article>
          </div>
        </motion.section>

        <motion.section
          id="support"
          className="scroll-mt-28 px-6 py-20 lg:px-8"
          {...inView}
        >
          <div className="mx-auto max-w-screen-2xl">
            <div className="relative overflow-hidden rounded-[3rem] bg-[#fe9400] p-12 text-center md:p-24">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffa84f] to-[#fdd400] opacity-35" />
              <div className="relative z-10 mx-auto max-w-3xl">
                <h2 className="font-display text-4xl font-black leading-tight text-[#231000] md:text-6xl">
                  READY TO CRANK UP THE VOLUME?
                </h2>
                <p className="mb-10 mt-8 text-xl font-medium text-[#482600]/90">
                  Join thousands of servers that trust DJ Ramu Kaka for their
                  daily soundtrack.
                </p>
                <div className="flex flex-col justify-center gap-6 sm:flex-row">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/register"}
                    className="rounded-2xl bg-[#231000] px-10 py-4 text-lg font-black text-[#fdd400] transition-transform hover:scale-[1.03]"
                  >
                    {isLoggedIn ? "GO TO DASHBOARD" : "JOIN THE COMMUNITY"}
                  </Link>
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/playlists"}
                    className="rounded-2xl border border-[#231000]/25 bg-white/20 px-10 py-4 text-lg font-black text-[#231000] transition-colors hover:bg-white/30"
                  >
                    {isLoggedIn ? "OPEN ADMIN PANEL" : "OPEN PLAYLISTS"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-[#262626] bg-[#0e0e0e] px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden">
                <Image
                  src="/brand/logo-transparent.png"
                  alt="DJ RAMU KAKA"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-display text-lg font-bold text-[#fdd400]">
                DJ RAMU KAKA
              </span>
            </div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              2026 DJ RAMU KAKA. HIGH-OCTANE AUDIO.
            </p>
          </div>

          <div className="flex gap-8 text-sm uppercase tracking-wide text-gray-500">
            <Link
              className="cursor-pointer transition-colors duration-200 hover:text-[#fdd400]"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="cursor-pointer transition-colors duration-200 hover:text-[#fdd400]"
              href="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="cursor-pointer transition-colors duration-200 hover:text-[#fdd400]"
              href="/status"
            >
              Status
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-screen-2xl border-t border-[#262626] pt-5 text-center text-sm text-[#adaaaa]">
          Made by Hardik ·{" "}
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

      <style jsx global>{`
        .glass-panel {
          background: rgba(19, 19, 19, 0.6);
          backdrop-filter: blur(12px);
        }
        .text-gradient {
          background: linear-gradient(135deg, #ffa84f 0%, #fdd400 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .animated-bars span {
          display: inline-block;
          width: 4px;
          background: #fdd400;
          animation: bounce 0.8s ease-in-out infinite;
        }
        @keyframes bounce {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/page-loader";

function iconUrl(guild) {
  if (!guild?.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
}

function initials(name) {
  if (!name || typeof name !== "string") return "G";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("");
}

export function GuildsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [guilds, setGuilds] = useState([]);
  const [retryIn, setRetryIn] = useState(0);
  const [rateLimitRetries, setRateLimitRetries] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadGuilds() {
      setError("");
      setErrorCode("");
      setRetryIn(0);
      setLoading(true);
      try {
        const res = await fetch("/data/user/guilds", {
          credentials: "include",
        });
        if (res.status === 401) {
          router.push("/login?next=/dashboard");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(
              "Guild route not found. Restart API and web dev servers to load latest routes.",
            );
          }
          if (!cancelled) {
            const code = data?.error?.code || "";
            setErrorCode(code);
            if (code === "DISCORD_RATE_LIMITED" && rateLimitRetries < 1) {
              setRetryIn(2);
            }
          }
          throw new Error(data?.error?.message || "Could not load servers");
        }
        if (!cancelled)
          setGuilds(Array.isArray(data.guilds) ? data.guilds : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Could not load servers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGuilds();
    return () => {
      cancelled = true;
    };
  }, [router, reloadKey, rateLimitRetries]);

  useEffect(() => {
    if (errorCode !== "DISCORD_RATE_LIMITED" || retryIn <= 0) return;
    const timer = setTimeout(() => {
      setRetryIn((n) => {
        if (n <= 1) {
          setRateLimitRetries((x) => x + 1);
          setReloadKey((k) => k + 1);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [errorCode, retryIn]);

  if (loading) return <PageLoader label="Loading servers" />;

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Your Servers
        </h2>
        <p className="mt-1 text-sm text-[#adaaaa]">
          Showing servers where you have Manage Server permission and the bot is
          already added.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {errorCode === "DISCORD_LINK_REQUIRED" ? (
        <div className="rounded-lg border border-[#58421e] bg-[#2a1f0d] p-4">
          <p className="text-sm text-[#ffd184]">
            You are logged in with email/local account. Connect Discord to load
            server list.
          </p>
          <a
            href="/auth/discord?next=%2Fdashboard"
            className="mt-3 inline-flex rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752C4]"
          >
            Sign in with Discord
          </a>
        </div>
      ) : null}

      {errorCode === "DISCORD_TOKEN_MISSING" ? (
        <div className="rounded-lg border border-[#58421e] bg-[#2a1f0d] p-4">
          <p className="text-sm text-[#ffd184]">
            Discord is configured for this account, but your Discord session is not active.
          </p>
          <a
            href="/auth/discord?next=%2Fdashboard"
            className="mt-3 inline-flex rounded-md bg-[#5865F2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4752C4]"
          >
            Reconnect Discord
          </a>
        </div>
      ) : null}

      {errorCode === "DISCORD_RATE_LIMITED" ? (
        <div className="rounded-lg border border-[#4a2f10] bg-[#2a1a0a] p-4">
          <p className="text-sm text-[#ffd184]">
            Discord rate-limited the server lookup. Retrying automatically
            {retryIn > 0 ? ` in ${retryIn}s` : "..."}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 inline-flex rounded-md bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Retry now
          </button>
        </div>
      ) : null}

      {!guilds.length && !error ? (
        <div className="rounded-xl border border-dashed border-[#323232] bg-[#131313] p-8 text-center">
          <p className="text-sm text-[#adaaaa]">
            No eligible servers found for this account.
          </p>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {guilds.map((guild) => (
          <article
            key={guild.id}
            className="rounded-xl border border-[#262626] bg-[#131313] p-3.5 sm:p-4"
          >
            <div className="flex items-center gap-3">
              {iconUrl(guild) ? (
                <img
                  src={iconUrl(guild)}
                  alt={`${guild.name} icon`}
                  className="h-12 w-12 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1f1f1f] font-bold text-[#fdd400]">
                  {initials(guild.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {guild.name}
                </p>
                <p className="text-xs text-[#767575]">
                  {guild.owner ? "Owner" : "Manager"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-md bg-gradient-to-r from-[#ffa84f] to-[#fe9400] px-3 py-2.5 text-sm font-semibold text-[#231000] hover:opacity-90"
            >
              Manage
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

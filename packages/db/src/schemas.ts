import { z } from "zod";

/** Single track metadata (no audio bytes — Lavalink resolves playback). */
export const playlistTrackZ = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  duration: z.number().int().nonnegative(),
});

export const playlistZ = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(200),
  tracks: z.array(playlistTrackZ).default([]),
});

export const analyticsPlayZ = z.object({
  track: z.string().min(1),
  userId: z.string().min(1),
  timestamp: z.coerce.date(),
});

export type PlaylistTrack = z.infer<typeof playlistTrackZ>;
export type PlaylistInput = z.infer<typeof playlistZ>;
export type AnalyticsPlayInput = z.infer<typeof analyticsPlayZ>;

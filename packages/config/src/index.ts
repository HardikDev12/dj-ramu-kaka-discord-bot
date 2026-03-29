import { z } from "zod";

function optSecret(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

const envSchema = z.object({
  DISCORD_TOKEN: z.preprocess(optSecret, z.string().min(1).optional()),
  CLIENT_ID: z.preprocess(optSecret, z.string().min(1).optional()),
  CLIENT_SECRET: z.preprocess(optSecret, z.string().min(1).optional()),
  MONGO_URI: z.preprocess(optSecret, z.string().min(1).optional()),
  LAVALINK_HOST: z.string().default("localhost"),
  LAVALINK_PORT: z.coerce.number().default(2333),
  LAVALINK_PASSWORD: z.string().default("youshallnotpass"),
  ADMIN_IDS: z.preprocess(optSecret, z.string().optional()),
});

export type Env = z.infer<typeof envSchema>;

/** Parses process.env; optional keys stay undefined until phases need them. */
export function loadEnv(env: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse({
    DISCORD_TOKEN: env.DISCORD_TOKEN,
    CLIENT_ID: env.CLIENT_ID,
    CLIENT_SECRET: env.CLIENT_SECRET,
    MONGO_URI: env.MONGO_URI,
    LAVALINK_HOST: env.LAVALINK_HOST,
    LAVALINK_PORT: env.LAVALINK_PORT,
    LAVALINK_PASSWORD: env.LAVALINK_PASSWORD,
    ADMIN_IDS: env.ADMIN_IDS,
  });
}

export function parseAdminIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

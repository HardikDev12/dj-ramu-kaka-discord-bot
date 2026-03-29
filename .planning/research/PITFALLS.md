# Pitfalls — Discord Music Bots

| Pitfall | Warning signs | Prevention | Phase |
|---------|---------------|------------|-------|
| Gateway intent gaps | Voice works in dev bot, fails in prod | Enable `GuildVoiceStates` (and others) in Discord Developer Portal | Bot phase |
| Lavalink/auth mismatch | `401` / connection closed | Sync `application.yml` password with bot `LAVALINK_PASSWORD` | Infra |
| Blocking Node event loop | Bot freezes during search | Use Lavalink for I/O; avoid sync FS on hot path | Bot |
| OAuth redirect URL drift | `redirect_uri` errors | Document exact URLs for local vs prod in `.env.example` | API |
| Merging apps “for convenience” | One `package.json` for everything | Enforce workspace boundaries; code review | Ongoing |
| YouTube/source policy changes | Sudden playback failures | Abstract “source manager”; monitor Lavalink release notes | Ops |

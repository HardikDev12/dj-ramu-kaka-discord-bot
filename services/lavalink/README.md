# Lavalink

1. Install **Java 17+**.
2. Ensure `application.yml` `server.password` matches your root `.env` `LAVALINK_PASSWORD` if you add a password block per your JAR’s template.
3. Place `Lavalink.jar` at the **repository root** (already present in this project).
4. From this directory:

```bash
cd services/lavalink
java -jar ../../Lavalink.jar
```

Your Lavalink distribution may ship a fuller `application.yml` (password, sources). Merge those settings with this file as needed.

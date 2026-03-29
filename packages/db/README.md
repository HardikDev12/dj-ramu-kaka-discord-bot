# @djramu/db

MongoDB contracts for the music bot system (metadata only — no audio storage).

## Documents

### Playlist (`playlists` collection)

| Field     | Type   | Notes                                      |
|----------|--------|--------------------------------------------|
| `userId` | string | Discord snowflake                          |
| `name`   | string | Unique per `userId`                        |
| `tracks` | array  | `{ title, url, duration }` — `duration` ms |

### Analytics play (`analytics_plays` collection)

| Field       | Type | Notes                |
|------------|------|----------------------|
| `track`    | string | Display title or id |
| `userId`   | string | Discord snowflake    |
| `timestamp`| Date | When the play was recorded |

## Usage

```ts
import { connectMongo, PlaylistModel, playlistZ } from "@djramu/db";

await connectMongo(process.env.MONGO_URI!);
const doc = playlistZ.parse({ userId: "…", name: "Chill", tracks: [] });
await PlaylistModel.create(doc);
```

import mongoose from "mongoose";
import type { PlaylistTrack } from "./schemas.js";

const playlistTrackSchema = new mongoose.Schema<PlaylistTrack>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: Number, required: true },
  },
  { _id: false },
);

const playlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    tracks: { type: [playlistTrackSchema], default: [] },
  },
  { timestamps: true },
);

playlistSchema.index({ userId: 1, name: 1 }, { unique: true });

export const PlaylistModel =
  mongoose.models.Playlist ?? mongoose.model("Playlist", playlistSchema);

const analyticsPlaySchema = new mongoose.Schema(
  {
    track: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: false },
);

export const AnalyticsPlayModel =
  mongoose.models.AnalyticsPlay ??
  mongoose.model("AnalyticsPlay", analyticsPlaySchema, "analytics_plays");

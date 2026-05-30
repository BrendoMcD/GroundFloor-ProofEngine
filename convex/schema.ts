import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // FANS & ARTISTS
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("fan"), v.literal("artist")),
  }),

  // ARTIST PROFILES
  artists: defineTable({
    userId: v.id("users"),
    bio: v.string(),
    genres: v.array(v.string()),
    socialLinks: v.optional(v.any()), // TikTok, IG, etc.
  }),

  // THE MUSIC
  tracks: defineTable({
    artistId: v.id("artists"),
    title: v.string(),
    coverArtUrl: v.string(),
    audioUrl: v.string(),
    story: v.optional(v.string()), // How it was made, lyrics meaning
  }),

  // THE MONEY / AD BUYS
  campaigns: defineTable({
    trackId: v.id("tracks"),
    goalAmount: v.number(),      // e.g., $250
    currentAmount: v.number(),   // e.g., $195
    status: v.union(v.literal("active"), v.literal("funded")),
  }),

  // THE CLOUT / LEDGER
  contributions: defineTable({
    fanId: v.id("users"),
    campaignId: v.id("campaigns"),
    amount: v.number(),          // e.g., $5
    timestamp: v.number(),
  }),
});

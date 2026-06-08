import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // PHASE 1 WAITLIST / VALIDATION
  waitlistEntries: defineTable({
    email: v.string(),
    role: v.union(
      v.literal("fan"),
      v.literal("artist"),
      v.literal("producer"),
      v.literal("manager"),
      v.literal("industry"),
      v.literal("other"),
    ),
    pledgeIntent: v.union(
      v.literal("5"),
      v.literal("10"),
      v.literal("25"),
      v.literal("50"),
      v.literal("custom"),
      v.literal("not_sure"),
    ),
    customPledgeAmount: v.optional(v.string()),
    artistOrProject: v.optional(v.string()),
    whatTheyWant: v.string(),
    whatToAvoid: v.string(),
    source: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    brevoContactId: v.optional(v.number()),
    brevoListId: v.optional(v.number()),
    brevoSyncedAt: v.optional(v.number()),
    brevoSyncStatus: v.optional(
      v.union(v.literal("pending"), v.literal("synced"), v.literal("skipped"), v.literal("error")),
    ),
    brevoSyncError: v.optional(v.string()),
  }).index("by_email", ["email"]).index("by_createdAt", ["createdAt"]),

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

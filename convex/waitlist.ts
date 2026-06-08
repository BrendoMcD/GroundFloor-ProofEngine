import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

export const submitWaitlistEntry = mutation({
  args: {
    email: v.string(),
    role: v.optional(
      v.union(
        v.literal("fan"),
        v.literal("artist"),
        v.literal("producer"),
        v.literal("manager"),
        v.literal("industry"),
        v.literal("other"),
      ),
    ),
    pledgeIntent: v.optional(
      v.union(
        v.literal("5"),
        v.literal("10"),
        v.literal("25"),
        v.literal("50"),
        v.literal("custom"),
        v.literal("not_sure"),
      ),
    ),
    customPledgeAmount: v.optional(v.string()),
    artistOrProject: v.optional(v.string()),
    whatTheyWant: v.optional(v.string()),
    whatToAvoid: v.optional(v.string()),
    source: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = clean(args.email.toLowerCase(), 160);
    const whatTheyWant = clean(args.whatTheyWant ?? "Email-only waitlist signup.", 1200);
    const whatToAvoid = clean(args.whatToAvoid ?? "No feedback captured yet.", 1200);
    const artistOrProject = args.artistOrProject ? clean(args.artistOrProject, 180) : undefined;
    const customPledgeAmount = args.customPledgeAmount ? clean(args.customPledgeAmount, 40) : undefined;

    if (!emailPattern.test(email)) {
      throw new Error("Please enter a valid email.");
    }

    if (args.whatTheyWant !== undefined && whatTheyWant.length < 2) {
      throw new Error("Tell us a little more about what you want to see.");
    }

    if (args.whatToAvoid !== undefined && whatToAvoid.length < 2) {
      throw new Error("Tell us a little more about what we should avoid.");
    }

    const existing = await ctx.db.query("waitlistEntries").withIndex("by_email", (q) => q.eq("email", email)).first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        updatedAt: now,
      });

      return {
        entryId: existing._id,
        email: existing.email,
        isNew: false,
        shouldSyncToBrevo: existing.brevoSyncStatus !== "synced",
      };
    }

    const entryId = await ctx.db.insert("waitlistEntries", {
      email,
      role: args.role ?? "other",
      pledgeIntent: args.pledgeIntent ?? "not_sure",
      customPledgeAmount,
      artistOrProject,
      whatTheyWant,
      whatToAvoid,
      source: clean(args.source ?? "waitlist", 120),
      userAgent: args.userAgent ? clean(args.userAgent, 240) : undefined,
      createdAt: now,
      brevoSyncStatus: "pending",
    });

    return {
      entryId,
      email,
      isNew: true,
      shouldSyncToBrevo: true,
    };
  },
});

export const markBrevoSync = mutation({
  args: {
    entryId: v.id("waitlistEntries"),
    status: v.union(v.literal("synced"), v.literal("skipped"), v.literal("error")),
    brevoContactId: v.optional(v.number()),
    brevoListId: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.entryId, {
      brevoContactId: args.brevoContactId,
      brevoListId: args.brevoListId,
      brevoSyncedAt: args.status === "synced" ? Date.now() : undefined,
      brevoSyncStatus: args.status,
      brevoSyncError: args.error ? clean(args.error, 500) : undefined,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const listEntriesForReport = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 250), 1), 500);
    const entries = await ctx.db.query("waitlistEntries").withIndex("by_createdAt").order("desc").take(limit);

    return entries.map((entry) => ({
      id: entry._id,
      createdAt: entry.createdAt,
      role: entry.role,
      pledgeIntent: entry.pledgeIntent,
      customPledgeAmount: entry.customPledgeAmount,
      artistOrProject: entry.artistOrProject,
      whatTheyWant: entry.whatTheyWant,
      whatToAvoid: entry.whatToAvoid,
      source: entry.source,
    }));
  },
});

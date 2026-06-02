import { mutationGeneric as mutation } from "convex/server";
import { v } from "convex/values";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

export const submitWaitlistEntry = mutation({
  args: {
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
    source: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = clean(args.email.toLowerCase(), 160);
    const whatTheyWant = clean(args.whatTheyWant, 1200);
    const whatToAvoid = clean(args.whatToAvoid, 1200);
    const artistOrProject = args.artistOrProject ? clean(args.artistOrProject, 180) : undefined;
    const customPledgeAmount = args.customPledgeAmount ? clean(args.customPledgeAmount, 40) : undefined;

    if (!emailPattern.test(email)) {
      throw new Error("Please enter a valid email.");
    }

    if (whatTheyWant.length < 2) {
      throw new Error("Tell us a little more about what you want to see.");
    }

    if (whatToAvoid.length < 2) {
      throw new Error("Tell us a little more about what we should avoid.");
    }

    return await ctx.db.insert("waitlistEntries", {
      email,
      role: args.role,
      pledgeIntent: args.pledgeIntent,
      customPledgeAmount,
      artistOrProject,
      whatTheyWant,
      whatToAvoid,
      source: clean(args.source ?? "groundfloor-phase-1-landing", 120),
      userAgent: args.userAgent ? clean(args.userAgent, 240) : undefined,
      createdAt: Date.now(),
    });
  },
});

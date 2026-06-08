import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference, type FunctionReference } from "convex/server";
import { NextResponse } from "next/server";

type WaitlistArgs = {
  email: string;
  source?: string;
  userAgent?: string;
};

type WaitlistResult = {
  entryId: string;
  email: string;
  isNew: boolean;
  shouldSyncToBrevo: boolean;
};

type MarkBrevoArgs = {
  entryId: string;
  status: "synced" | "skipped" | "error";
  brevoContactId?: number;
  brevoListId?: number;
  error?: string;
};

const phaseOneConvexUrl = "https://savory-flamingo-305.convex.cloud";

const submitWaitlistEntry = makeFunctionReference<"mutation", WaitlistArgs, WaitlistResult>(
  "waitlist:submitWaitlistEntry",
) as FunctionReference<"mutation", "public", WaitlistArgs, WaitlistResult>;

const markBrevoSync = makeFunctionReference<"mutation", MarkBrevoArgs, { ok: boolean }>(
  "waitlist:markBrevoSync",
) as FunctionReference<"mutation", "public", MarkBrevoArgs, { ok: boolean }>;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("valid email")) {
    return "Please enter a valid email.";
  }

  return "Something went wrong. Please try again.";
}

function getBrevoListId() {
  const listId = Number(process.env.BREVO_WAITLIST_LIST_ID);
  return Number.isFinite(listId) && listId > 0 ? listId : null;
}

async function syncContactToBrevo(email: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = getBrevoListId();

  if (!apiKey || !listId) {
    return {
      status: "skipped" as const,
      brevoListId: listId ?? undefined,
      error: "Brevo env vars are not configured.",
    };
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as { id?: number; message?: string };

  if (!response.ok) {
    return {
      status: "error" as const,
      brevoListId: listId,
      error: result.message ?? `Brevo sync failed with status ${response.status}.`,
    };
  }

  return {
    status: "synced" as const,
    brevoContactId: result.id,
    brevoListId: listId,
  };
}

export async function POST(request: Request) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? phaseOneConvexUrl;
  const convex = new ConvexHttpClient(convexUrl);
  const body = (await request.json().catch(() => ({}))) as Partial<WaitlistArgs>;

  try {
    const entry = await convex.mutation(submitWaitlistEntry, {
      email: String(body.email ?? ""),
      source: String(body.source ?? "groundfloor-root-landing"),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    if (entry.shouldSyncToBrevo) {
      const brevoSync = await syncContactToBrevo(entry.email);

      await convex.mutation(markBrevoSync, {
        entryId: entry.entryId,
        ...brevoSync,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 400 });
  }
}

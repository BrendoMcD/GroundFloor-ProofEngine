# GroundFloor Phase 1

GroundFloor is testing whether early fans will support emerging artists by funding transparent music promotion campaigns. The public homepage uses the original prototype landing page, the newer validation page lives at `/waitlist`, and the original interactive proof engine is archived at `/proof`.

Live app:

```text
https://groundfloor-app.vercel.app/
```

GitHub:

```text
https://github.com/mcdeeai/GroundFloor-App
```

The Phase 1 waitlist is designed to answer the riskiest early product questions:

- Who wants GroundFloor first: fans, artists, producers, managers, or industry people?
- What pledge level would people consider before checkout exists?
- Which artists, scenes, or projects do people care about?
- What proof, features, and safeguards would make the product trustworthy?
- What should GroundFloor avoid so it does not feel fake, spammy, or investment-like?

## Current Phase 1

- `/` is the original public landing page from the deployed prototype.
- Homepage CTAs point to `/waitlist`.
- `/waitlist` is the newer validation page.
- The waitlist form opens in a modal when visitors click Join Waitlist, Join the First Test, Share Feedback, or Add Your Signal.
- `/proof` preserves the original browser-local proof engine.
- Public homepage links to unfinished app pages were removed.
- Waitlist submissions write to Convex via `convex/waitlist.ts`.
- Captured fields: email, role, pledge intent, optional custom pledge amount, artist/project interest, desired features/proof, things to avoid, source, user agent, and createdAt.

## Route Map

- `/` - original public landing page for fans, artists, and early collaborators.
- `/waitlist` - Phase 1 validation page with a Convex-backed modal signup form.
- `/proof` - archived local proof-engine prototype with browser `localStorage` demo data.
- `/create`, `/artist/[slug]`, and `/operator` - direct internal proof-engine routes used by the prototype, not linked from the public homepage.

## Current Persistence

The waitlist is wired for Convex persistence through `waitlistEntries`.

The archived proof engine at `/proof` still stores demo data in browser `localStorage`.

Convex is linked for local development. `npx convex dev --once` successfully pushed the schema and functions on June 2, 2026, and a CLI test insert returned a document id in `waitlistEntries`.

Local development uses `.env.local` with:

```bash
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
```

Do not commit `.env.local`.

Before public deployment, add `NEXT_PUBLIC_CONVEX_URL` to Vercel and deploy the Convex functions from the target environment.

If `NEXT_PUBLIC_CONVEX_URL` is missing, `/waitlist` still renders and explains that Convex must be connected before real submissions can be collected.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
http://localhost:3000/waitlist
http://localhost:3000/proof
```

## Verification

```bash
npm run lint
npm run build
```

Both checks passed on June 2, 2026.

## Next Build Steps

1. Add `NEXT_PUBLIC_CONVEX_URL` in Vercel.
2. Deploy a public preview on Vercel.
3. Submit a real browser test entry and confirm it appears in `waitlistEntries`.
4. Use waitlist responses to decide which proof-engine flow to build next.

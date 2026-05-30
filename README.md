# GroundFloor Proof Engine

GroundFloor is a mobile-first MVP for testing whether early fans will support emerging artists, earn visible status, and help create proof of demand.

This app is not just a pitch page. It is a proof engine for the riskiest investor questions:

- Will artists or fans create pages?
- Will fans pledge support?
- Why do fans support?
- Does an Early Believer badge feel valuable?
- Do supporters share after backing an artist?
- Can campaign progress and proof make the model trustworthy?

## Current MVP

- Mobile-first campaign page
- Create / nominate artist flow
- Pledge-style support capture
- Supporter motivation question
- Early Believer badge output
- Trackable share/referral action
- Public campaign proof metrics
- Dashboard for pages, pledges, raised intent, shares, and supporter motivation

## Current Persistence

The MVP currently stores demo data in browser `localStorage`.

That is enough to validate the flow and product logic, but not enough for real users. The next production step is Convex persistence plus Stripe checkout or tracked pledge records.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Verification

```bash
npm run lint
npm run build
```

Both checks passed on May 30, 2026.

## Next Build Steps

1. Move artist pages, pledges, badges, shares, and dashboard metrics into Convex.
2. Add real Stripe checkout or a persistent pledge workflow.
3. Add shareable artist page URLs.
4. Deploy a public preview on Vercel.
5. Replace estimated proof metrics with campaign/ad platform evidence.

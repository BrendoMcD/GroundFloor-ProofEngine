# GroundFloor Agent Direction Brief

Intended lane: Codex, Claude Code, Amp, or Brendo's local OpenClaw/Yoda agent.

Use this as the operating context before making product, design, or implementation decisions on GroundFloor.

```text
You are helping guide and build GroundFloor.

GroundFloor is a music/product MVP for testing whether early fans will support unsigned or emerging artists, earn visible status, and help create measurable proof of demand.

The core idea:
- Fans give small support/contributions to help artists grow.
- The clean reward is status, identity, and public proof, not equity, royalties, ownership, profit share, securities, or financial upside.
- Fans should feel like early believers, not investors.
- Artists should feel supported, not exploited.
- The platform must prove trust: dollars/support raised, listens, shares, clicks, support reasons, supporter activity, and campaign proof.

Important language:
- Prefer "support", "contribute", "pledge", "early believer", "campaign proof", "fan nomination".
- Avoid "invest", "back for upside", "equity", "royalties", "ownership", "profit", "returns".

Active source of truth:
- Repo: https://github.com/BrendoMcD/GroundFloor-ProofEngine
- Live app: https://ground-floor-proof-engine.vercel.app/
- Local repo path on McDee's machine: /Users/mcdee/.openclaw/workspace/groundfloor-app
- Ready command: cd /Users/mcdee/.openclaw/workspace/groundfloor-app

The older mcdeeai/GroundFloor-App repo and groundfloor-app.vercel.app URL were earlier proof-engine lanes. Treat them as historical/backup unless McDee or Brendo explicitly says otherwise.

Current app structure:
- / = prototype-style landing page
- /feed = social/feed prototype
- /discovery = discovery prototype
- /signin = sign-in/sign-up prototype flow
- /profile = profile/settings/account prototype
- /create = live create / nominate artist flow
- /artist/the-rare-occasions = live artist campaign/proof page
- /operator = artist/operator backend prototype

What has already been built:
- The original static prototype feel has been merged into the live Vercel app.
- The site is now one domain with landing, feed, discovery, sign-in, profile, create, artist, and operator routes.
- Mobile layout has been heavily cleaned up:
  - landing overlap fixed
  - discovery overlap fixed
  - feed spacing fixed
  - profile/settings fixed
  - create/artist/operator profile pill matched to other pages
  - GroundFloor logo sits top-left
  - Sign Up / My Profile sits top-right depending on page
  - feed nav sits at the bottom like a mobile app
- The artist proof page includes:
  - support flow
  - custom support amount
  - support reason capture
  - Early Believer concept
  - listen tracking
  - share/referral tracking
  - public proof metrics
  - growth graph
  - Overview / Community tabs
  - Early Believer/supporter activity
- The create flow includes:
  - artist-created page path with campaign headline and goal
  - fan nomination path with simplified nomination fields
  - fan nominations do not let the fan set campaign headline or campaign goal
- The operator dashboard includes:
  - pledge/support records
  - support reasons
  - listens/shares/clicks
  - live growth graph
  - private/admin framing
- The account prototype includes:
  - landing Sign Up opens /signin?mode=signup
  - demo account creation
  - profile loads saved demo account info
  - profile edits save locally
  - sign out resets to demo profile state

Major product decisions already made:
- Do not keep the proof engine as a separate investor demo forever.
- The right product shape is one GroundFloor website/app.
- Keep the newer proof-engine artist page as the base; do not fully replace it with the old prototype artist page.
- Use the old prototype for visual identity and missing product pieces, not as a replacement for the newer artist page.
- Supporters should see some proof data publicly. Do not hide all data in the operator dashboard.
- Split public proof from private/admin details:
  - public: artist story, listen, support flow, campaign/proof metrics, selected growth graph, recent supporters, community, share/badge
  - private: raw emails, pledge records, support reasons, referral details, nomination claim status, campaign controls
- The operator page should eventually be an artist backend linked to the signed-in artist account.
- Mobile is critical and should be treated as primary, not secondary.

Current technical truth:
- The app is Next.js with static prototype pages served from public/prototype and React routes under src/app.
- Convex is installed and a starter convex/schema.ts exists, but the app is not yet truly using Convex persistence.
- Much of the current proof-engine/account behavior still uses browser localStorage.
- That is acceptable for prototype validation, but it is not production-ready.

Current risk / gap:
The app looks and behaves much more real, but it is still browser-local/demo persistence.

The next serious build direction:
1. Add real backend persistence, likely Convex.
2. Save created artist pages so URLs work for every visitor, not only the creator's browser.
3. Save fan nominations.
4. Save support/pledge events, support reasons, listen taps, share/referral events.
5. Tie accounts to created artist pages, nominations, pledges, badges, and operator access.
6. Make the operator dashboard account-scoped.
7. Decide when to add real auth, likely before or alongside backend ownership.
8. Later decide pledge vs Stripe/payment.

Recommended immediate next phase:
Phase 1 should be backend persistence for artist pages and support events before adding more visual polish.

Suggested implementation order:
1. Audit current localStorage data shape in src/app/page.tsx and related app routes.
2. Design a minimal Convex schema for:
   - users/accounts
   - artists
   - nominations
   - tracks/songs
   - campaigns
   - supports/pledges
   - support reasons
   - listen events
   - share/referral events
   - badges or supporter positions
3. Implement Convex mutations/queries behind the existing flows.
4. Keep the current UI as stable as possible while replacing storage under it.
5. Preserve the seeded demo artist The Rare Occasions as a sample route.
6. Confirm /artist/[slug] can load from backend-like data instead of browser-only data.
7. Confirm /operator only shows the relevant artist/campaign data once ownership exists, even if still prototype-gated.

Product principles:
- Build a test machine, not only a pretty pitch site.
- Every major flow should answer an investor-risk question:
  - Will fans support?
  - Why do fans support?
  - Does the badge/status matter?
  - Will supporters share?
  - Can artists/fans create pages?
  - Can GroundFloor make campaign proof trustworthy?
- Avoid overbuilding discovery before the single artist-page loop works.
- The core loop is: artist page -> listen -> support -> reason capture -> badge/status -> share/referral -> public proof -> dashboard evidence.

Design principles:
- Mobile-first.
- Music-first, dark GroundFloor feel, gold accents.
- Do not make the public side feel like an internal analytics dashboard.
- Public proof should feel trustworthy and legible.
- Operator dashboard can be more utilitarian and private.
- Keep nav consistent.
- Do not reintroduce horizontal mobile scrolling or overlapping hero/nav content.

Verification expectations:
- Run npm run lint.
- Run npm run build.
- For UI changes, test at 390px mobile width.
- Check at least:
  - /
  - /signin?mode=signup
  - /profile
  - /create
  - /artist/the-rare-occasions
  - /operator
- Verify no horizontal overflow on mobile.
- If changing account/support/create flows, walk the flow end to end.

Safety and process constraints:
- Do not deploy unless explicitly asked. Vercel may auto-deploy on push if you push to main.
- Do not mutate production data.
- Do not delete or migrate data without approval.
- Do not commit unless explicitly asked by the operator running you.
- Preserve any existing dirty worktree changes you did not make.
- Stop and report at major decision points, especially auth/payment/backend schema decisions.

Recommended next-agent task:
Review the current repo, then propose the smallest Convex-backed persistence slice that makes GroundFloor materially more real without redesigning the UI. Focus on artist pages and support events first. Produce a short implementation plan with data model, affected files, and verification steps. Do not implement until Brendo/McDee approves the slice.
```

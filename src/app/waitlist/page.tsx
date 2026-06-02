"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference, type FunctionReference } from "convex/server";

type Role = "fan" | "artist" | "producer" | "manager" | "industry" | "other";
type SupportIntent = "5" | "10" | "25" | "50" | "custom" | "not_sure";

type WaitlistArgs = {
  email: string;
  role: Role;
  pledgeIntent: SupportIntent;
  customPledgeAmount?: string;
  artistOrProject?: string;
  whatTheyWant: string;
  whatToAvoid: string;
  source?: string;
  userAgent?: string;
};

const phaseOneConvexUrl = "https://savory-flamingo-305.convex.cloud";

const submitWaitlistEntry = makeFunctionReference<"mutation", WaitlistArgs, unknown>(
  "waitlist:submitWaitlistEntry",
) as FunctionReference<"mutation", "public", WaitlistArgs, unknown>;

const roleOptions: { value: Role; label: string }[] = [
  { value: "fan", label: "Fan / tastemaker" },
  { value: "artist", label: "Artist" },
  { value: "producer", label: "Producer" },
  { value: "manager", label: "Manager" },
  { value: "industry", label: "Industry" },
  { value: "other", label: "Other" },
];

const supportOptions: { value: SupportIntent; label: string }[] = [
  { value: "5", label: "Curious" },
  { value: "10", label: "Interested" },
  { value: "25", label: "Excited" },
  { value: "50", label: "All in" },
  { value: "custom", label: "Specific idea" },
  { value: "not_sure", label: "Not sure" },
];

const proofPoints = [
  {
    label: "For fans",
    title: "Help shape what breaks next",
    body: "Tell us how you would discover artists, follow early momentum, and show that you believed before the wider crowd caught on.",
  },
  {
    label: "For artists",
    title: "Make support feel useful",
    body: "We are testing how artists can hear from real listeners, gather early belief, and understand what people want from the platform.",
  },
  {
    label: "For the platform",
    title: "Build the trust layer first",
    body: "Phase 1 is about feedback, trust, taste, and what the first version should avoid before we add heavier product flows.",
  },
];

const campaignSteps = [
  "An artist or fan brings forward a song with real early energy.",
  "Listeners add their signal: what they love, what they would support, and what would make it trustworthy.",
  "GroundFloor turns that early feedback into the first product decisions.",
];

function getWaitlistErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  if (error.message.includes("valid email")) {
    return "Please enter a valid email.";
  }

  if (error.message.includes("what you want to see")) {
    return "Tell us a little more about what you want to see.";
  }

  if (error.message.includes("what we should avoid")) {
    return "Tell us a little more about what we should avoid.";
  }

  return "Something went wrong. Please try again.";
}

function WaitlistForm({ onSuccess }: { onSuccess: () => void }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? phaseOneConvexUrl;
  const convex = useMemo(() => (convexUrl ? new ConvexHttpClient(convexUrl) : null), [convexUrl]);
  const [role, setRole] = useState<Role>("fan");
  const [supportIntent, setSupportIntent] = useState<SupportIntent>("10");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!convex) {
      setStatus("error");
      setErrorMessage("Convex is not connected yet. Set NEXT_PUBLIC_CONVEX_URL before collecting signups.");
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const customPledgeAmount = String(data.get("customPledgeAmount") ?? "").trim();
    const artistOrProject = String(data.get("artistOrProject") ?? "").trim();

    setStatus("submitting");

    try {
      await convex.mutation(submitWaitlistEntry, {
        email: String(data.get("email") ?? ""),
        role,
        pledgeIntent: supportIntent,
        customPledgeAmount: supportIntent === "custom" ? customPledgeAmount : undefined,
        artistOrProject: artistOrProject || undefined,
        whatTheyWant: String(data.get("whatTheyWant") ?? ""),
        whatToAvoid: String(data.get("whatToAvoid") ?? ""),
        source: "groundfloor-phase-1-waitlist-modal",
        userAgent: typeof navigator === "undefined" ? undefined : navigator.userAgent,
      });

      setStatus("success");
      form.reset();
      setRole("fan");
      setSupportIntent("10");
      onSuccess();
    } catch (error) {
      setStatus("error");
      setErrorMessage(getWaitlistErrorMessage(error));
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submitWaitlist}>
      <label className="field-label">
        Email
        <input className="field-input" name="email" placeholder="you@example.com" required type="email" />
      </label>

      <label className="field-label">
        Your role
        <select
          className="field-input bg-[#101010]"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-extrabold text-[#f4f0e8]/72">Interest level</legend>
        <div className="grid grid-cols-3 gap-2">
          {supportOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`min-h-12 rounded-lg border px-2 text-sm font-black transition ${
                supportIntent === option.value
                  ? "border-[#c9a84c] bg-[#c9a84c] text-[#090909]"
                  : "border-white/10 bg-[#1f1f1f] text-[#f4f0e8]/74 hover:border-[#c9a84c]/45"
              }`}
              onClick={() => setSupportIntent(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {supportIntent === "custom" && (
        <label className="field-label">
          Specific support idea
          <input
            className="field-input"
            name="customPledgeAmount"
            placeholder="Early access, artist voting, supporter wall, city scenes..."
          />
        </label>
      )}

      <label className="field-label">
        Artist or project interest
        <input
          className="field-input"
          name="artistOrProject"
          placeholder="An artist, scene, city, or project you care about"
        />
      </label>

      <label className="field-label">
        What do you want to see?
        <textarea
          className="field-input min-h-28 resize-y"
          name="whatTheyWant"
          placeholder="Artist updates, community voting, local scenes, behind-the-song stories..."
          required
        />
      </label>

      <label className="field-label">
        What should we avoid?
        <textarea
          className="field-input min-h-28 resize-y"
          name="whatToAvoid"
          placeholder="Anything that would make this feel fake, forced, noisy, unfair, or confusing"
          required
        />
      </label>

      <button
        className="min-h-14 rounded-lg bg-[#c9a84c] px-5 py-4 text-base font-black text-[#090909] transition hover:bg-[#dfbf62] disabled:cursor-not-allowed disabled:opacity-55"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting..." : "Join waitlist"}
      </button>

      {status === "success" && (
        <p className="rounded-lg border border-[#c9a84c]/40 bg-[#c9a84c]/10 p-3 text-sm font-bold leading-6 text-[#f4f0e8]/82">
          You are on the list. We captured your signal for the first GroundFloor validation round.
        </p>
      )}

      {status === "error" && (
        <p className="rounded-lg border border-red-400/35 bg-red-500/10 p-3 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default function WaitlistPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#090909] text-[#f4f0e8]">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.96),rgba(9,9,9,0.72)_48%,rgba(9,9,9,0.38)),url('/prototype/bg.jpg')] bg-cover bg-center" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:py-7">
          <header className="flex items-center justify-between gap-4">
            <Link className="font-display text-3xl uppercase text-[#c9a84c] sm:text-4xl" href="/">
              GroundFloor
            </Link>
            <button
              className="rounded-full bg-[#c9a84c] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#090909] transition hover:bg-[#dfbf62]"
              onClick={() => setIsModalOpen(true)}
            >
              Join waitlist
            </button>
          </header>

          <div className="grid flex-1 items-end gap-10 pb-10 pt-20 lg:grid-cols-[minmax(0,1.18fr)_340px] lg:items-center lg:pb-16 lg:pt-12">
            <div>
              <p className="section-kicker">Listener-powered music discovery</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                Every song deserves a room that gets it.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f4f0e8]/78 sm:text-xl">
                GroundFloor is being built for artists who are tired of shouting into the algorithm. We are starting
                with the people, scenes, and early listeners who can help a song find its real community.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex min-h-14 items-center justify-center rounded-lg bg-[#c9a84c] px-6 py-4 text-base font-black text-[#090909] transition hover:bg-[#dfbf62]"
                  onClick={() => setIsModalOpen(true)}
                >
                  Join the first test
                </button>
                <button
                  className="inline-flex min-h-14 items-center justify-center rounded-lg border border-white/18 bg-black/30 px-6 py-4 text-base font-black text-white backdrop-blur transition hover:border-[#6fb6ff]/70"
                  onClick={() => setIsModalOpen(true)}
                >
                  Share feedback
                </button>
              </div>
            </div>

            <aside className="rounded-lg border border-white/12 bg-[#111]/86 p-4 shadow-2xl shadow-black/45 backdrop-blur sm:p-5">
              <p className="section-kicker">Phase 1 focus</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-center rounded-lg bg-white/[0.05] px-2 py-3">
                  <b className="font-display block text-[1.45rem] leading-none text-[#c9a84c] sm:text-[1.55rem]">
                    Artists
                  </b>
                  <span className="mt-3 block text-xs font-bold leading-4 text-[#f4f0e8]/58">
                    find their audience
                  </span>
                </div>
                <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-center rounded-lg bg-white/[0.05] px-2 py-3">
                  <b className="font-display block text-[1.45rem] leading-none text-[#6fb6ff] sm:text-[1.55rem]">
                    Fans
                  </b>
                  <span className="mt-3 block text-xs font-bold leading-4 text-[#f4f0e8]/58">
                    shape what rises
                  </span>
                </div>
                <div className="flex min-h-[112px] min-w-0 flex-col items-center justify-center rounded-lg bg-white/[0.05] px-2 py-3">
                  <b className="font-display block text-[1.45rem] leading-none text-[#ff7ac8] sm:text-[1.55rem]">
                    Trust
                  </b>
                  <span className="mt-3 block text-xs font-bold leading-4 text-[#f4f0e8]/58">
                    see every step
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm font-bold leading-6 text-[#f4f0e8]/62">
                This first pass is about helping artists reach the right listeners, learning what fans actually connect
                with, and building the transparency that makes GroundFloor trustworthy for everyone involved.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101010]">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
          {proofPoints.map((point) => (
            <article key={point.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6fb6ff]">{point.label}</p>
              <h2 className="mt-3 text-xl font-black text-white">{point.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#f4f0e8]/62">{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:py-16">
        <div>
          <p className="section-kicker">How it works</p>
          <h2 className="font-display mt-3 text-5xl uppercase leading-[0.94] text-white sm:text-6xl">
            First we learn what feels right.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#f4f0e8]/66">
            The first version is intentionally small: no checkout, no heavy auth, no dashboards for users to get lost in.
            We are listening for what people want, what would make this feel real, and what would make them bounce.
          </p>
          <button
            className="mt-6 inline-flex min-h-14 items-center justify-center rounded-lg bg-[#c9a84c] px-6 py-4 font-black text-[#090909] transition hover:bg-[#dfbf62]"
            onClick={() => setIsModalOpen(true)}
          >
            Add your signal
          </button>
        </div>

        <div className="grid gap-3">
          {campaignSteps.map((step, index) => (
            <div key={step} className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-lg border border-white/10 bg-[#151515] p-4">
              <span className="grid size-12 place-items-center rounded-lg bg-[#c9a84c] font-display text-3xl text-[#090909]">
                {index + 1}
              </span>
              <p className="self-center text-base font-bold leading-7 text-[#f4f0e8]/76">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/78 px-4 py-6 backdrop-blur"
          role="dialog"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/12 bg-[#151515] p-4 shadow-2xl shadow-black/60 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Join the first test</p>
                <h2 className="font-display mt-2 text-4xl uppercase text-white sm:text-5xl">Tell us what to build.</h2>
                <p className="mt-3 text-sm leading-6 text-[#f4f0e8]/62">
                  We are collecting early feedback before turning on checkout, dashboards, or full campaign tools.
                </p>
              </div>
              <button
                aria-label="Close waitlist form"
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-xl font-black text-white transition hover:border-[#c9a84c]/60"
                onClick={() => setIsModalOpen(false)}
              >
                x
              </button>
            </div>
            <WaitlistForm onSuccess={() => undefined} />
          </div>
        </div>
      )}
    </main>
  );
}

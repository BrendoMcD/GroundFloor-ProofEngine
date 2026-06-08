"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const signalCards = [
  {
    label: "For artists",
    title: "Give the music a real chance to reach people.",
    body: "GROUNDFLOOR is for emerging artists with songs that deserve more than a quick scroll, a cold algorithm, or a post that disappears by morning.",
  },
  {
    label: "For fans",
    title: "Help the artists you believe in break through.",
    body: "This is for listeners who want their support to do more than sit in a playlist. Listen, back, share, and help surface the artists you think deserve visibility.",
  },
  {
    label: "For the culture",
    title: "Turn support into visible momentum.",
    body: "GROUNDFLOOR turns fan attention, pledges, shares, and reasons for belief into proof that an artist has people behind them.",
  },
];

const proofLines = [
  "Discover emerging artists at the start of their journey. Listen early, follow what moves you, and find the songs you believe more people should hear.",
  "Back the songs you believe in. Your support helps show which early tracks are connecting with real listeners before the rest of the world catches on.",
  "Help create the momentum that can push real music beyond its starting circle.",
];

function getWaitlistErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("valid email")) {
    return "Please enter a valid email.";
  }

  return "Something went wrong. Please try again.";
}

function getSource() {
  if (typeof window === "undefined") {
    return "waitlist";
  }

  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("utm_campaign");
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const creative = params.get("creative") ?? params.get("utm_content");

  return [source, medium, campaign, creative].filter(Boolean).join(":") || "waitlist";
}

function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          source: getSource(),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(getWaitlistErrorMessage(error));
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">You are on the list</p>
        <h2 className="mt-3 text-2xl font-black text-white">Thanks for helping artists get heard.</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-[#f4f0e8]/72">
          We will share the next steps as GROUNDFLOOR builds a better way for fans to help emerging artists get seen,
          supported, and pushed forward.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={submitWaitlist}>
      <label className="sr-only" htmlFor="waitlist-email">
        Email
      </label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          id="waitlist-email"
          className="field-input min-h-14 text-base"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <button
          className="min-h-14 rounded-lg bg-[#c9a84c] px-6 py-4 text-base font-black text-[#090909] transition hover:bg-[#dfbf62] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Joining..." : "Join the waitlist"}
        </button>
      </div>
      {status === "error" && (
        <p className="rounded-lg border border-red-400/35 bg-red-500/10 p-3 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-[#090909] text-[#f4f0e8]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.97),rgba(9,9,9,0.76)_52%,rgba(9,9,9,0.42)),url('/prototype/bg.jpg')] bg-cover bg-center" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col px-4 py-5 sm:px-6 lg:py-7">
          <header className="flex items-center justify-between gap-4">
            <Link className="font-display text-3xl uppercase text-[#c9a84c] sm:text-4xl" href="/">
              GROUNDFLOOR
            </Link>
            <a
              className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white backdrop-blur transition hover:border-[#c9a84c]/70"
              href="#join"
            >
              Waitlist
            </a>
          </header>

          <div className="grid flex-1 items-end gap-10 pb-12 pt-20 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:items-center lg:pb-16 lg:pt-12">
            <div>
              <p className="section-kicker">Support emerging music</p>
              <h1 className="font-display mt-4 max-w-3xl text-5xl uppercase leading-[0.95] text-white sm:text-7xl lg:text-8xl">
                Find the music that deserves a shot. Help it get heard.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f4f0e8]/78 sm:text-xl">
                GROUNDFLOOR is a music discovery and support platform built around one idea: when fans believe in an
                emerging artist, that belief should help the music break out.
              </p>
            </div>

            <aside id="join" className="rounded-lg border border-white/12 bg-[#111]/88 p-5 shadow-2xl shadow-black/45 backdrop-blur">
              <p className="section-kicker">Join GROUNDFLOOR</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white">Help build a better path for artists to be seen.</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#f4f0e8]/62">
                If you care about discovering artists, supporting songs you believe in, or giving emerging music a real
                chance to travel, join the GROUNDFLOOR waitlist.
              </p>
              <div className="mt-5">
                <WaitlistForm />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101010]">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
          {signalCards.map((card) => (
            <article key={card.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6fb6ff]">{card.label}</p>
              <h2 className="mt-3 text-xl font-black text-white">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#f4f0e8]/62">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:py-16">
        <div>
          <p className="section-kicker">The core idea</p>
          <h2 className="font-display mt-3 text-5xl uppercase leading-[0.94] text-white sm:text-6xl">
            Music should not disappear just because it starts small.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#f4f0e8]/66">
            GROUNDFLOOR exists for the moment before a song breaks out, when an artist needs listeners who care enough
            to do something. The goal is to connect artists and fans around support, discovery, discussion, sharing, and
            proof that real people want the music to move.
          </p>
        </div>

        <div className="grid gap-3">
          {proofLines.map((line, index) => (
            <div key={line} className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-lg border border-white/10 bg-[#151515] p-4">
              <span className="grid size-12 place-items-center rounded-lg bg-[#c9a84c] font-display text-3xl text-[#090909]">
                {index + 1}
              </span>
              <p className="self-center text-base font-bold leading-7 text-[#f4f0e8]/76">{line}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const signalCards = [
  {
    label: "For artists",
    title: "A better first push.",
    body: "Turn early belief into real reach without handing over your rights.",
  },
  {
    label: "For fans",
    title: "Back what moves you.",
    body: "Help the songs you found early travel beyond the first circle.",
  },
  {
    label: "For discovery",
    title: "Proof before hype.",
    body: "Show that real people are listening, sharing, and paying attention.",
  },
];

const proofLines = [
  "Discover artists while the story is still small.",
  "Join the waitlist for the first fan-powered campaigns.",
  "Help shape a launch path built around listeners, not labels.",
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
      <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">You are on the list</p>
        <h2 className="mt-3 text-2xl font-black text-white">Thanks for helping artists get heard.</h2>
        <p className="mt-3 text-sm font-bold leading-6 text-[#f4f0e8]/68">
          We will send early access details as GROUNDFLOOR gets ready for its first campaigns.
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
          className="field-input min-h-14 rounded-md text-base"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <button
          className="min-h-14 rounded-md bg-[#c9a84c] px-6 py-4 text-base font-black text-[#090909] transition hover:bg-[#dfbf62] disabled:cursor-not-allowed disabled:opacity-55"
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.98),rgba(9,9,9,0.74)_56%,rgba(9,9,9,0.36)),url('/prototype/bg.jpg')] bg-cover bg-center" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#090909] to-transparent" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:py-7">
          <header className="flex items-center justify-between gap-4">
            <Link className="font-display text-3xl uppercase text-[#c9a84c] sm:text-4xl" href="/">
              GROUNDFLOOR
            </Link>
            <Link
              className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white backdrop-blur transition hover:border-[#c9a84c]/70"
              href="/"
            >
              Home
            </Link>
          </header>

          <div className="grid flex-1 items-end gap-12 pb-14 pt-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:pb-20 lg:pt-14">
            <div className="max-w-3xl">
              <p className="section-kicker">Support emerging music</p>
              <h1 className="font-display mt-5 text-5xl uppercase leading-[0.95] text-white sm:text-7xl lg:text-8xl">
                Find it early. Help it rise.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#f4f0e8]/76 sm:text-xl">
                GROUNDFLOOR helps fans turn early belief into momentum for emerging artists.
              </p>
            </div>

            <aside id="join" className="rounded-md border border-white/12 bg-[#10100c]/82 p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-6">
              <p className="section-kicker">Join GROUNDFLOOR</p>
              <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">Get early access.</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-[#f4f0e8]/62">
                Join the waitlist for first access to artist campaigns, discovery tools, and early supporter drops.
              </p>
              <div className="mt-6">
                <WaitlistForm />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#090909]">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:px-6 md:grid-cols-3 lg:py-14">
          {signalCards.map((card) => (
            <article key={card.label} className="border-t border-white/12 py-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9a84c]">{card.label}</p>
              <h2 className="mt-4 text-xl font-black text-white">{card.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#f4f0e8]/58">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[0.95fr_1fr] lg:pb-24 lg:pt-10">
        <div>
          <p className="section-kicker">The core idea</p>
          <h2 className="font-display mt-4 max-w-xl text-5xl uppercase leading-[0.94] text-white sm:text-6xl">
            Music should not disappear because it starts small.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#f4f0e8]/62">
            We are building for the moment before a song breaks out, when the right listeners can help prove there is
            something real there.
          </p>
        </div>

        <div className="grid gap-0 border-y border-white/10">
          {proofLines.map((line, index) => (
            <div key={line} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-white/10 py-5 last:border-b-0">
              <span className="font-display text-4xl leading-none text-[#c9a84c]">
                0{index + 1}
              </span>
              <p className="self-center text-base font-bold leading-7 text-[#f4f0e8]/72">{line}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

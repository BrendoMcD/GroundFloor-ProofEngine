"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Artist = {
  id: string;
  name: string;
  genre: string;
  headline: string;
  story: string;
  songTitle: string;
  songUrl: string;
  goal: number;
  creatorName: string;
  creatorEmail: string;
  mode: "artist" | "fan";
  createdAt: number;
};

type Support = {
  id: string;
  artistId: string;
  supporterName: string;
  supporterEmail: string;
  amount: number;
  reason: string;
  referralCode: string;
  createdAt: number;
};

type ShareEvent = {
  id: string;
  artistId: string;
  referralCode: string;
  createdAt: number;
};

type EngineState = {
  artists: Artist[];
  supports: Support[];
  shares: ShareEvent[];
};

const STORAGE_KEY = "groundfloor-proof-engine-v1";

const seedArtist: Artist = {
  id: "artist-rare-occasions",
  name: "The Rare Occasions",
  genre: "Indie Rock",
  headline: "Help push a bedroom-made single into the first real audience.",
  story:
    "A first GroundFloor campaign for a track with real fan energy. The goal is to test whether early fans will fund visibility when the proof is public.",
  songTitle: "Notion",
  songUrl: "https://open.spotify.com/",
  goal: 500,
  creatorName: "GroundFloor Team",
  creatorEmail: "hello@groundfloor.test",
  mode: "artist",
  createdAt: Date.now() - 86400000,
};

const seedState: EngineState = {
  artists: [seedArtist],
  supports: [
    {
      id: "support-1",
      artistId: seedArtist.id,
      supporterName: "Maya",
      supporterEmail: "maya@example.com",
      amount: 25,
      reason: "I like the music",
      referralCode: "maya-early",
      createdAt: Date.now() - 7200000,
    },
    {
      id: "support-2",
      artistId: seedArtist.id,
      supporterName: "Chris",
      supporterEmail: "chris@example.com",
      amount: 10,
      reason: "I want early supporter status",
      referralCode: "chris-early",
      createdAt: Date.now() - 3600000,
    },
  ],
  shares: [
    {
      id: "share-1",
      artistId: seedArtist.id,
      referralCode: "maya-early",
      createdAt: Date.now() - 5400000,
    },
  ],
};

const supportReasons = [
  "I know them personally",
  "I like the music",
  "I want to help them grow",
  "I want early supporter status",
  "Someone invited me",
  "Other",
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function getReferralCode(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18);

  return `${base || "fan"}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function Home() {
  const [state, setState] = useState<EngineState>(seedState);
  const [activeArtistId, setActiveArtistId] = useState(seedArtist.id);
  const [view, setView] = useState<"campaign" | "create" | "dashboard">("campaign");
  const [supportAmount, setSupportAmount] = useState(10);
  const [supporterName, setSupporterName] = useState("");
  const [supporterEmail, setSupporterEmail] = useState("");
  const [supportReason, setSupportReason] = useState(supportReasons[1]);
  const [latestBadgeId, setLatestBadgeId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as EngineState;
      if (parsed.artists?.length) {
        queueMicrotask(() => {
          setState(parsed);
          setActiveArtistId(parsed.artists[0].id);
        });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeArtist = useMemo(
    () => state.artists.find((artist) => artist.id === activeArtistId) ?? state.artists[0],
    [activeArtistId, state.artists],
  );

  const artistSupports = useMemo(
    () => state.supports.filter((support) => support.artistId === activeArtist.id),
    [activeArtist.id, state.supports],
  );

  const artistShares = useMemo(
    () => state.shares.filter((share) => share.artistId === activeArtist.id),
    [activeArtist.id, state.shares],
  );

  const raised = artistSupports.reduce((sum, support) => sum + support.amount, 0);
  const progress = Math.min(100, Math.round((raised / activeArtist.goal) * 100));
  const latestSupport = latestBadgeId
    ? state.supports.find((support) => support.id === latestBadgeId)
    : null;
  const referralUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}?artist=${activeArtist.id}&ref=${latestSupport?.referralCode ?? "early"}`;

  function addArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const artist: Artist = {
      id: makeId("artist"),
      name: String(data.get("name") || "Untitled Artist"),
      genre: String(data.get("genre") || "Emerging"),
      headline: String(data.get("headline") || "Help this artist find their first real audience."),
      story: String(data.get("story") || "This campaign needs a sharper story."),
      songTitle: String(data.get("songTitle") || "First single"),
      songUrl: String(data.get("songUrl") || ""),
      goal: Number(data.get("goal") || 250),
      creatorName: String(data.get("creatorName") || "Anonymous fan"),
      creatorEmail: String(data.get("creatorEmail") || ""),
      mode: data.get("mode") === "fan" ? "fan" : "artist",
      createdAt: Date.now(),
    };

    setState((current) => ({ ...current, artists: [artist, ...current.artists] }));
    setActiveArtistId(artist.id);
    setLatestBadgeId(null);
    setView("campaign");
    event.currentTarget.reset();
  }

  function addSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const support: Support = {
      id: makeId("support"),
      artistId: activeArtist.id,
      supporterName: supporterName.trim() || "Early Believer",
      supporterEmail: supporterEmail.trim(),
      amount: supportAmount,
      reason: supportReason,
      referralCode: getReferralCode(supporterName || "fan"),
      createdAt: Date.now(),
    };

    setState((current) => ({ ...current, supports: [support, ...current.supports] }));
    setLatestBadgeId(support.id);
    setSupporterName("");
    setSupporterEmail("");
    setSupportAmount(10);
    setSupportReason(supportReasons[1]);
  }

  function trackShare(referralCode = "organic") {
    const share = {
      id: makeId("share"),
      artistId: activeArtist.id,
      referralCode,
      createdAt: Date.now(),
    };
    setState((current) => ({ ...current, shares: [share, ...current.shares] }));
  }

  const reasonCounts = supportReasons.map((reason) => ({
    reason,
    count: artistSupports.filter((support) => support.reason === reason).length,
  }));

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#161616]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="px-4 pb-28 pt-4 sm:px-6 lg:px-10 lg:py-8">
          <header className="sticky top-0 z-20 -mx-4 border-b border-black/10 bg-[#f7f4ef]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0">
            <div className="flex items-center justify-between gap-3">
              <button className="text-left text-xl font-black tracking-[0]">GroundFloor</button>
              <div className="flex rounded-full border border-black/10 bg-white p-1 text-sm shadow-sm">
                {(["campaign", "create", "dashboard"] as const).map((item) => (
                  <button
                    key={item}
                    className={`rounded-full px-3 py-2 capitalize transition ${
                      view === item ? "bg-[#161616] text-white" : "text-black/65"
                    }`}
                    onClick={() => setView(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {view === "campaign" && (
            <section className="pt-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {state.artists.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => {
                      setActiveArtistId(artist.id);
                      setLatestBadgeId(null);
                    }}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      artist.id === activeArtist.id
                        ? "border-[#161616] bg-[#161616] text-white"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    {artist.name}
                  </button>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-sm">
                  <div className="bg-[#161616] p-5 text-white sm:p-8">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#f0c85a]">
                      {activeArtist.genre}
                    </p>
                    <h1 className="text-4xl font-black leading-[1.02] sm:text-6xl">
                      {activeArtist.name}
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg leading-7 text-white/78">
                      {activeArtist.headline}
                    </p>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-8">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">
                        Featured song
                      </p>
                      <div className="mt-3 rounded-[8px] border border-black/10 bg-[#faf7f1] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-2xl font-black">{activeArtist.songTitle}</h2>
                            <p className="mt-1 text-sm text-black/60">Support can be tied to this track.</p>
                          </div>
                          {activeArtist.songUrl && (
                            <a className="rounded-full bg-white px-3 py-2 text-sm font-bold" href={activeArtist.songUrl}>
                              Listen
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">
                        Campaign story
                      </p>
                      <p className="mt-3 text-lg leading-8 text-black/72">{activeArtist.story}</p>
                    </div>

                    <div className="rounded-[8px] border border-black/10 p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">
                            Public proof
                          </p>
                          <p className="mt-2 text-3xl font-black">
                            {money(raised)} <span className="text-base font-bold text-black/45">of {money(activeArtist.goal)}</span>
                          </p>
                        </div>
                        <p className="text-right text-sm font-bold text-black/55">
                          {artistSupports.length} supporters<br />
                          {artistShares.length} shares tracked
                        </p>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10">
                        <div className="h-full rounded-full bg-[#f0c85a]" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-[8px] bg-[#faf7f1] p-3">
                          <b>{money(Math.round(raised * 0.82))}</b>
                          <span className="block text-black/50">ad budget</span>
                        </div>
                        <div className="rounded-[8px] bg-[#faf7f1] p-3">
                          <b>{Math.max(0, artistShares.length * 37 + artistSupports.length * 18)}</b>
                          <span className="block text-black/50">est. reach</span>
                        </div>
                        <div className="rounded-[8px] bg-[#faf7f1] p-3">
                          <b>{Math.max(0, artistSupports.length * 6)}</b>
                          <span className="block text-black/50">click intent</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <aside className="rounded-[8px] border border-black/10 bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black">Back this artist</h2>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Phase 1 captures pledge intent. Stripe can replace this form when you are ready for real payments.
                  </p>

                  <form className="mt-5 grid gap-3" onSubmit={addSupport}>
                    <div className="grid grid-cols-3 gap-2">
                      {[5, 10, 25].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setSupportAmount(amount)}
                          className={`rounded-[8px] border p-3 font-black ${
                            supportAmount === amount ? "border-[#161616] bg-[#161616] text-white" : "border-black/10"
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    <label className="text-sm font-bold">
                      Custom amount
                      <input
                        className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3"
                        min="1"
                        type="number"
                        value={supportAmount}
                        onChange={(event) => setSupportAmount(Number(event.target.value))}
                      />
                    </label>
                    <label className="text-sm font-bold">
                      Name
                      <input
                        className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3"
                        value={supporterName}
                        onChange={(event) => setSupporterName(event.target.value)}
                        placeholder="Brendo"
                      />
                    </label>
                    <label className="text-sm font-bold">
                      Email
                      <input
                        className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3"
                        type="email"
                        value={supporterEmail}
                        onChange={(event) => setSupporterEmail(event.target.value)}
                        placeholder="you@example.com"
                      />
                    </label>
                    <label className="text-sm font-bold">
                      Why are you supporting?
                      <select
                        className="mt-1 w-full rounded-[8px] border border-black/15 bg-white px-3 py-3"
                        value={supportReason}
                        onChange={(event) => setSupportReason(event.target.value)}
                      >
                        {supportReasons.map((reason) => (
                          <option key={reason}>{reason}</option>
                        ))}
                      </select>
                    </label>
                    <button className="mt-2 rounded-[8px] bg-[#f0c85a] px-5 py-4 text-base font-black text-black">
                      Pledge support
                    </button>
                  </form>

                  {latestSupport && (
                    <div className="mt-5 rounded-[8px] border border-[#f0c85a] bg-[#fff9df] p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">
                        Badge earned
                      </p>
                      <p className="mt-2 text-xl font-black">Early Believer #{artistSupports.length}</p>
                      <p className="mt-1 text-sm text-black/60">
                        {latestSupport.supporterName} backed {activeArtist.name} with {money(latestSupport.amount)}.
                      </p>
                      <button
                        className="mt-3 w-full rounded-[8px] bg-[#161616] px-4 py-3 text-sm font-black text-white"
                        onClick={() => trackShare(latestSupport.referralCode)}
                      >
                        Track share link
                      </button>
                      <p className="mt-2 break-all text-xs text-black/45">{referralUrl}</p>
                    </div>
                  )}
                </aside>
              </div>
            </section>
          )}

          {view === "create" && (
            <section className="pt-8">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">Create or nominate</p>
                <h1 className="mt-2 text-4xl font-black leading-tight">Start a page people can rally around.</h1>
              </div>
              <form className="grid gap-4 rounded-[8px] border border-black/10 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-8" onSubmit={addArtist}>
                <label className="text-sm font-bold">
                  Artist name
                  <input name="name" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" required />
                </label>
                <label className="text-sm font-bold">
                  Genre / scene
                  <input name="genre" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" placeholder="Indie pop, college rap..." />
                </label>
                <label className="text-sm font-bold sm:col-span-2">
                  Campaign headline
                  <input name="headline" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" placeholder="Help this single find its first real audience." />
                </label>
                <label className="text-sm font-bold sm:col-span-2">
                  Why now?
                  <textarea name="story" className="mt-1 min-h-28 w-full rounded-[8px] border border-black/15 px-3 py-3" />
                </label>
                <label className="text-sm font-bold">
                  Featured song
                  <input name="songTitle" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" />
                </label>
                <label className="text-sm font-bold">
                  Song link
                  <input name="songUrl" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" placeholder="Spotify, SoundCloud, YouTube" />
                </label>
                <label className="text-sm font-bold">
                  Campaign goal
                  <input name="goal" type="number" min="25" defaultValue="250" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" />
                </label>
                <label className="text-sm font-bold">
                  Created by
                  <select name="mode" className="mt-1 w-full rounded-[8px] border border-black/15 bg-white px-3 py-3">
                    <option value="artist">Artist</option>
                    <option value="fan">Fan nomination</option>
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Your name
                  <input name="creatorName" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" />
                </label>
                <label className="text-sm font-bold">
                  Contact email
                  <input name="creatorEmail" type="email" className="mt-1 w-full rounded-[8px] border border-black/15 px-3 py-3" />
                </label>
                <button className="rounded-[8px] bg-[#161616] px-5 py-4 font-black text-white sm:col-span-2">
                  Publish test page
                </button>
              </form>
            </section>
          )}

          {view === "dashboard" && (
            <section className="pt-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-black/45">Proof dashboard</p>
              <h1 className="mt-2 text-4xl font-black leading-tight">Investor questions, answered with behavior.</h1>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Artist pages", state.artists.length],
                  ["Pledges", state.supports.length],
                  ["Raised intent", money(state.supports.reduce((sum, support) => sum + support.amount, 0))],
                  ["Tracked shares", state.shares.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[8px] border border-black/10 bg-white p-4 shadow-sm">
                    <p className="text-sm font-bold text-black/45">{label}</p>
                    <p className="mt-2 text-3xl font-black">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[8px] border border-black/10 bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black">Supporter motivation</h2>
                  <div className="mt-4 grid gap-3">
                    {reasonCounts.map(({ reason, count }) => (
                      <div key={reason}>
                        <div className="flex justify-between text-sm font-bold">
                          <span>{reason}</span>
                          <span>{count}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/10">
                          <div
                            className="h-full rounded-full bg-[#f0c85a]"
                            style={{ width: `${artistSupports.length ? (count / artistSupports.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[8px] border border-black/10 bg-white p-5 shadow-sm">
                  <h2 className="text-2xl font-black">Recent evidence</h2>
                  <div className="mt-4 grid gap-3">
                    {state.supports.slice(0, 5).map((support) => {
                      const artist = state.artists.find((item) => item.id === support.artistId);
                      return (
                        <div key={support.id} className="rounded-[8px] bg-[#faf7f1] p-3 text-sm">
                          <b>{support.supporterName}</b> pledged <b>{money(support.amount)}</b> to {artist?.name}
                          <span className="block text-black/50">Reason: {support.reason}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="border-t border-black/10 bg-[#161616] p-5 text-white lg:min-h-screen lg:border-l lg:border-t-0 lg:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f0c85a]">Phase 1 engine</p>
          <h2 className="mt-2 text-3xl font-black leading-tight">Build for answers, not applause.</h2>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-white/72">
            <p><b className="text-white">Trust:</b> every pledge updates public progress and supporter count.</p>
            <p><b className="text-white">Motivation:</b> every supporter chooses a reason.</p>
            <p><b className="text-white">Status:</b> every pledge creates an Early Believer badge.</p>
            <p><b className="text-white">Growth:</b> share clicks are tracked by referral code.</p>
            <p><b className="text-white">Demand:</b> artist and fan-created pages are counted.</p>
          </div>
          <button
            className="mt-6 w-full rounded-[8px] border border-white/20 px-4 py-3 text-sm font-black text-white"
            onClick={() => {
              window.localStorage.removeItem(STORAGE_KEY);
              setState(seedState);
              setActiveArtistId(seedArtist.id);
              setLatestBadgeId(null);
              setView("campaign");
            }}
          >
            Reset demo data
          </button>
        </aside>
      </section>
    </main>
  );
}

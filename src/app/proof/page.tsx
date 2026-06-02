"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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

type ListenEvent = {
  id: string;
  artistId: string;
  createdAt: number;
};

type EngineState = {
  artists: Artist[];
  supports: Support[];
  shares: ShareEvent[];
  listens: ListenEvent[];
};

type GrowthMetric = "supports" | "clicks" | "listens";

type GrowthPoint = {
  label: string;
  supports: number;
  clicks: number;
  listens: number;
};

type AppView = "campaign" | "create" | "dashboard";
type SiteNavItem = { label: string; path: string } | { label: string; view: AppView };

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
  listens: [
    {
      id: "listen-1",
      artistId: seedArtist.id,
      createdAt: Date.now() - 5000000,
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

function getArtistSlug(artist: Pick<Artist, "id" | "name">) {
  const fromName = artist.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return fromName || artist.id;
}

function findArtistBySlug(artists: Artist[], slug?: string | null) {
  if (!slug) return null;
  return artists.find((artist) => artist.id === slug || getArtistSlug(artist) === slug) ?? null;
}

function buildGrowthPoints(state: EngineState, artistId?: string) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const start = now - day * 6;
  const supports = artistId ? state.supports.filter((support) => support.artistId === artistId) : state.supports;
  const shares = artistId ? state.shares.filter((share) => share.artistId === artistId) : state.shares;
  const listens = artistId ? state.listens.filter((listen) => listen.artistId === artistId) : state.listens;

  return Array.from({ length: 7 }, (_, index) => {
    const dayStart = start + day * index;
    const dayEnd = dayStart + day;

    return {
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(dayStart),
      supports: supports.filter((support) => support.createdAt <= dayEnd).length,
      clicks: shares.filter((share) => share.createdAt <= dayEnd).length,
      listens: listens.filter((listen) => listen.createdAt <= dayEnd).length,
    };
  });
}

function buildLinePath(points: GrowthPoint[], metric: GrowthMetric, maxValue: number, width: number, height: number) {
  const xStep = width / Math.max(1, points.length - 1);

  return points
    .map((point, index) => {
      const x = index * xStep;
      const y = height - (point[metric] / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function GrowthChart({ points, maxValue, compact = false }: { points: GrowthPoint[]; maxValue: number; compact?: boolean }) {
  const chartHeight = compact ? 150 : 220;
  const viewHeight = compact ? 190 : 260;
  const labelY = compact ? 184 : 255;

  return (
    <svg
      className={compact ? "h-48 w-full" : "h-64 w-full"}
      viewBox={`0 0 640 ${viewHeight}`}
      role="img"
      aria-label="Growth signal line graph"
    >
      {[0, 1, 2, 3].map((row) => (
        <line
          key={row}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          x1="0"
          x2="640"
          y1={20 + row * (chartHeight / 4)}
          y2={20 + row * (chartHeight / 4)}
        />
      ))}
      <path
        d={buildLinePath(points, "supports", maxValue, 640, chartHeight)}
        fill="none"
        stroke="#c9a84c"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={compact ? "4" : "5"}
        transform="translate(0 20)"
      />
      <path
        d={buildLinePath(points, "clicks", maxValue, 640, chartHeight)}
        fill="none"
        stroke="#6fb6ff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={compact ? "3" : "4"}
        transform="translate(0 20)"
      />
      <path
        d={buildLinePath(points, "listens", maxValue, 640, chartHeight)}
        fill="none"
        stroke="#ff7ac8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={compact ? "3" : "4"}
        transform="translate(0 20)"
      />
      {points.map((point, index) => (
        <text
          key={point.label}
          fill="rgba(237,232,223,0.46)"
          fontSize={compact ? "16" : "18"}
          fontWeight="700"
          textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
          x={(640 / Math.max(1, points.length - 1)) * index}
          y={labelY}
        >
          {point.label}
        </text>
      ))}
    </svg>
  );
}

export function GroundFloorApp({
  initialArtistSlug,
  initialView = "campaign",
}: {
  initialArtistSlug?: string;
  initialView?: AppView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<EngineState>(seedState);
  const [activeArtistId, setActiveArtistId] = useState(
    findArtistBySlug(seedState.artists, initialArtistSlug)?.id ?? seedArtist.id,
  );
  const [view, setView] = useState<AppView>(initialView);
  const [supportAmount, setSupportAmount] = useState(10);
  const [supporterName, setSupporterName] = useState("");
  const [supporterEmail, setSupporterEmail] = useState("");
  const [supportReason, setSupportReason] = useState(supportReasons[1]);
  const [latestBadgeId, setLatestBadgeId] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"artist" | "fan">("artist");
  const [artistPageTab, setArtistPageTab] = useState<"overview" | "community">("overview");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as EngineState;
      if (parsed.artists?.length) {
        queueMicrotask(() => {
          const nextState = {
            artists: parsed.artists,
            supports: parsed.supports ?? [],
            shares: parsed.shares ?? [],
            listens: parsed.listens ?? [],
          };
          const routeArtist = findArtistBySlug(nextState.artists, initialArtistSlug);
          setState(nextState);
          setActiveArtistId(routeArtist?.id ?? parsed.artists[0].id);
        });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [initialArtistSlug]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeArtist = useMemo(
    () => state.artists.find((artist) => artist.id === activeArtistId) ?? state.artists[0],
    [activeArtistId, state.artists],
  );
  const activeArtistSlug = getArtistSlug(activeArtist);
  const activeArtistPath = `/artist/${activeArtistSlug}`;

  const artistSupports = useMemo(
    () => state.supports.filter((support) => support.artistId === activeArtist.id),
    [activeArtist.id, state.supports],
  );

  const artistShares = useMemo(
    () => state.shares.filter((share) => share.artistId === activeArtist.id),
    [activeArtist.id, state.shares],
  );

  const artistListens = useMemo(
    () => state.listens.filter((listen) => listen.artistId === activeArtist.id),
    [activeArtist.id, state.listens],
  );

  const raised = artistSupports.reduce((sum, support) => sum + support.amount, 0);
  const progress = Math.min(100, Math.round((raised / activeArtist.goal) * 100));
  const siteNav: SiteNavItem[] = [
    { label: "Discover", path: "/discovery" },
    { label: "Feed", path: "/feed" },
    { label: "Create", view: "create" as const },
    { label: "Artist", view: "campaign" as const },
    { label: "Operator", view: "dashboard" as const },
  ];
  const publicGrowthPoints = useMemo(() => buildGrowthPoints(state, activeArtist.id), [activeArtist.id, state]);
  const maxPublicGrowthValue = Math.max(
    1,
    ...publicGrowthPoints.flatMap((point) => [point.supports, point.clicks, point.listens]),
  );
  const growthPoints = useMemo(() => buildGrowthPoints(state), [state]);
  const maxGrowthValue = Math.max(
    1,
    ...growthPoints.flatMap((point) => [point.supports, point.clicks, point.listens]),
  );
  const latestSupport = latestBadgeId
    ? state.supports.find((support) => support.id === latestBadgeId)
    : null;
  const referralUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${activeArtistPath}?ref=${latestSupport?.referralCode ?? "early"}`;

  function showArtist(artist: Artist, pushRoute = true) {
    setActiveArtistId(artist.id);
    setLatestBadgeId(null);
    setArtistPageTab("overview");
    setView("campaign");

    if (pushRoute) {
      const nextPath = `/artist/${getArtistSlug(artist)}`;
      if (pathname !== nextPath) router.push(nextPath);
    }
  }

  function goToView(nextView: AppView) {
    setView(nextView);

    const nextPath = nextView === "campaign" ? activeArtistPath : nextView === "create" ? "/create" : "/operator";
    if (pathname !== nextPath) router.push(nextPath);
  }

  function addArtist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const mode = data.get("mode") === "fan" ? "fan" : "artist";
    const artistName = String(data.get("name") || "Untitled Artist");
    const artist: Artist = {
      id: makeId("artist"),
      name: artistName,
      genre: String(data.get("genre") || "Emerging"),
      headline:
        mode === "fan"
          ? `Fans are nominating ${artistName} for a GroundFloor campaign.`
          : String(data.get("headline") || "Help this artist find their first real audience."),
      story:
        String(data.get("story")) ||
        (mode === "fan"
          ? "A fan thinks this artist has early energy worth testing with the GroundFloor community."
          : "This campaign needs a sharper story."),
      songTitle: String(data.get("songTitle") || "First single"),
      songUrl: String(data.get("songUrl") || ""),
      goal: mode === "fan" ? 250 : Number(data.get("goal") || 250),
      creatorName: String(data.get("creatorName") || "Anonymous fan"),
      creatorEmail: String(data.get("creatorEmail") || ""),
      mode,
      createdAt: Date.now(),
    };

    setState((current) => ({ ...current, artists: [artist, ...current.artists] }));
    setActiveArtistId(artist.id);
    setLatestBadgeId(null);
    setView("campaign");
    setCreateMode("artist");
    router.push(`/artist/${getArtistSlug(artist)}`);
    event.currentTarget.reset();
  }

  function addSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pledgeAmount = Math.max(1, Number.isFinite(supportAmount) ? supportAmount : 1);
    const support: Support = {
      id: makeId("support"),
      artistId: activeArtist.id,
      supporterName: supporterName.trim() || "Early Believer",
      supporterEmail: supporterEmail.trim(),
      amount: pledgeAmount,
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

  function trackListen() {
    const listen = {
      id: makeId("listen"),
      artistId: activeArtist.id,
      createdAt: Date.now(),
    };
    setState((current) => ({ ...current, listens: [listen, ...current.listens] }));
  }

  const reasonCounts = supportReasons.map((reason) => ({
    reason,
    count: artistSupports.filter((support) => support.reason === reason).length,
  }));
  const recentCommunity = [
    ...artistSupports.map((support) => ({
      id: support.id,
      label: support.supporterName,
      detail: support.reason,
      meta: `${money(support.amount)} pledge`,
      createdAt: support.createdAt,
      type: "Support",
    })),
    ...artistShares.map((share) => ({
      id: share.id,
      label: share.referralCode,
      detail: "Shared the campaign link",
      meta: "Referral signal",
      createdAt: share.createdAt,
      type: "Share",
    })),
    ...artistListens.map((listen) => ({
      id: listen.id,
      label: activeArtist.songTitle,
      detail: "Tapped Listen from the artist page",
      meta: "Listen signal",
      createdAt: listen.createdAt,
      type: "Listen",
    })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ede8df]">
      <header className="fixed left-0 top-0 z-30 w-full border-b border-white/10 bg-[#0a0a0a]/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex w-full items-center justify-between gap-3">
            <button
              className="font-display text-3xl uppercase tracking-[0.04em] text-[#c9a84c]"
              onClick={() => {
                router.push("/");
              }}
            >
              GroundFloor
            </button>
            <button
              className="rounded-full bg-[#c9a84c] !px-[0.65rem] !py-[0.5rem] !text-[0.6rem] font-black uppercase !leading-none !tracking-normal text-[#0a0a0a] transition hover:opacity-90"
              onClick={() => router.push("/profile")}
            >
              My Profile
            </button>
          </div>
          <nav className="flex w-full flex-nowrap justify-between gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 text-[0.68rem] font-bold sm:ml-auto sm:w-auto sm:justify-end sm:text-sm">
            {siteNav.map((item) => {
              const isActive =
                "view" in item
                  ? view === item.view
                  : pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));

              return (
              <button
                key={item.label}
                className={`shrink-0 rounded-full px-2 py-2 transition sm:px-4 ${
                  isActive ? "bg-[#c9a84c] text-[#0a0a0a]" : "text-[#ede8df]/70"
                }`}
                onClick={() => {
                  if ("view" in item) {
                    goToView(item.view);
                    return;
                  }

                  router.push(item.path);
                }}
              >
                {item.label}
              </button>
              );
            })}
          </nav>
        </div>
      </header>

      {view === "campaign" && (
        <>
          <section className="relative overflow-hidden pt-36 sm:pt-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(201,168,76,0.28),transparent_28%),linear-gradient(120deg,rgba(31,31,31,0.95),rgba(10,10,10,0.88)),url('https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-24">
              <div>
                <p className="section-kicker mb-4">Public artist page</p>
                <div className="mb-5 flex flex-wrap gap-2">
                  {state.artists.map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => showArtist(artist)}
                      className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                        artist.id === activeArtist.id
                          ? "border-[#c9a84c] bg-[#c9a84c] text-[#0a0a0a]"
                          : "border-white/15 bg-black/30 text-[#ede8df]/75"
                      }`}
                    >
                      {artist.name}
                    </button>
                  ))}
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <p className="inline-flex rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#c9a84c]">
                    {activeArtist.genre}
                  </p>
                  {activeArtist.mode === "fan" && (
                    <p className="inline-flex rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#ede8df]/70">
                      Fan nominated
                    </p>
                  )}
                </div>
                <h1 className="font-display max-w-3xl text-6xl uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-8xl">
                  {activeArtist.name}
                </h1>
                <p className="mt-5 max-w-2xl text-xl leading-8 text-[#ede8df]/82">
                  {activeArtist.headline}
                </p>
              </div>

              <aside className="rounded-2xl border border-white/10 bg-[#141414]/90 p-5 shadow-2xl shadow-black/35 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c9a84c]">
                  {activeArtist.mode === "fan" ? "Nomination proof" : "Campaign proof"}
                </p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="font-display text-5xl text-[#c9a84c]">{money(raised)}</p>
                  <p className="pb-2 text-right text-sm font-bold text-[#ede8df]/55">
                    {activeArtist.mode === "fan" ? "artist claim pending" : `of ${money(activeArtist.goal)}`}
                  </p>
                </div>
                {activeArtist.mode === "artist" ? (
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#c9a84c]" style={{ width: `${progress}%` }} />
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-[#ede8df]/60">
                    Fans can register early support, but the artist sets campaign terms after claiming the page.
                  </p>
                )}
                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <b className="block text-xl text-white">{artistSupports.length}</b>
                    <span className="text-[#ede8df]/55">supporters</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <b className="block text-xl text-white">{artistShares.length}</b>
                    <span className="text-[#ede8df]/55">shares tracked</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <b className="block text-xl text-white">{artistListens.length}</b>
                    <span className="text-[#ede8df]/55">listens</span>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
            <div className="flex w-full rounded-2xl border border-white/10 bg-[#141414] p-1 text-sm font-black sm:w-fit sm:rounded-full">
              {[
                ["overview", "Overview"],
                ["community", "Community"],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  className={`flex-1 rounded-xl px-4 py-3 transition sm:flex-none sm:rounded-full sm:px-5 ${
                    artistPageTab === tab ? "bg-[#c9a84c] text-[#0a0a0a]" : "text-[#ede8df]/60"
                  }`}
                  onClick={() => setArtistPageTab(tab as "overview" | "community")}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6">
              {artistPageTab === "overview" ? (
                <>
              <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                <p className="section-kicker">Featured Song</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-4xl uppercase text-white">{activeArtist.songTitle}</h2>
                    <p className="mt-2 max-w-xl text-[#ede8df]/65">
                      Support for this campaign can attach to the track, not just the artist profile.
                    </p>
                  </div>
                  {activeArtist.songUrl && (
                    <a
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c9a84c] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#0a0a0a] shadow-[0_0_24px_rgba(201,168,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e0bf61] sm:w-auto"
                      href={activeArtist.songUrl}
                      onClick={trackListen}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="grid size-5 place-items-center rounded-full bg-[#0a0a0a]" aria-hidden="true">
                        <span className="ml-px h-0 w-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-[#c9a84c]" />
                      </span>
                      Listen
                    </a>
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                <p className="section-kicker">Why Now</p>
                <p className="mt-4 text-lg leading-8 text-[#ede8df]/78">{activeArtist.story}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                <p className="section-kicker">Public Proof</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4 sm:gap-3">
                  <div className="rounded-xl bg-[#1f1f1f] p-3">
                    <b className="block text-lg text-white">{money(Math.round(raised * 0.82))}</b>
                    <span className="text-[#ede8df]/50">ad budget</span>
                  </div>
                  <div className="rounded-xl bg-[#1f1f1f] p-3">
                    <b className="block text-lg text-white">
                      {Math.max(0, artistShares.length * 37 + artistSupports.length * 18)}
                    </b>
                    <span className="text-[#ede8df]/50">est. reach</span>
                  </div>
                  <div className="rounded-xl bg-[#1f1f1f] p-3">
                    <b className="block text-lg text-white">{Math.max(0, artistSupports.length * 6)}</b>
                    <span className="text-[#ede8df]/50">click intent</span>
                  </div>
                  <div className="rounded-xl bg-[#1f1f1f] p-3">
                    <b className="block text-lg text-white">{artistListens.length}</b>
                    <span className="text-[#ede8df]/50">listen taps</span>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="section-kicker">Supporter-visible data</p>
                    <h2 className="font-display mt-2 text-4xl uppercase text-white">Growth signals</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[0.65rem] font-black uppercase tracking-[0.12em]">
                    <span className="rounded-full bg-[#c9a84c]/15 px-3 py-1 text-[#c9a84c]">Pledges</span>
                    <span className="rounded-full bg-[#6fb6ff]/15 px-3 py-1 text-[#6fb6ff]">Shares</span>
                    <span className="rounded-full bg-[#ff7ac8]/15 px-3 py-1 text-[#ff7ac8]">Listens</span>
                  </div>
                </div>
                <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
                  <GrowthChart points={publicGrowthPoints} maxValue={maxPublicGrowthValue} compact />
                </div>
                <p className="mt-3 text-sm leading-6 text-[#ede8df]/55">
                  Supporters can see the same public proof loop they are helping create, without exposing private
                  emails or operator notes.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                <p className="section-kicker">Early Believers</p>
                <div className="mt-4 grid gap-3">
                  {artistSupports.length ? (
                    artistSupports.slice(0, 4).map((support, index) => (
                      <div
                        key={support.id}
                        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#1f1f1f] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-black text-white">
                            #{artistSupports.length - index} {support.supporterName}
                          </p>
                          <p className="text-sm text-[#ede8df]/50">{support.reason}</p>
                        </div>
                        <p className="font-display text-3xl text-[#c9a84c]">{money(support.amount)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4 text-sm text-[#ede8df]/55">
                      No supporters yet. The first pledge becomes Early Believer #1.
                    </p>
                  )}
                </div>
              </article>
                </>
              ) : (
                <>
                  <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="section-kicker">Community</p>
                        <h2 className="font-display mt-2 text-4xl uppercase text-white">People pushing the signal</h2>
                      </div>
                      <button
                        className="rounded-full border border-[#c9a84c]/45 px-4 py-2 text-sm font-black text-[#c9a84c] transition hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
                        onClick={() => trackShare(latestSupport?.referralCode ?? "community")}
                      >
                        Track share
                      </button>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4">
                        <b className="font-display block text-4xl text-[#c9a84c]">{artistSupports.length}</b>
                        <span className="text-sm text-[#ede8df]/55">early believers</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4">
                        <b className="font-display block text-4xl text-[#c9a84c]">{artistShares.length}</b>
                        <span className="text-sm text-[#ede8df]/55">shares tracked</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4">
                        <b className="font-display block text-4xl text-[#c9a84c]">{artistListens.length}</b>
                        <span className="text-sm text-[#ede8df]/55">listen taps</span>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                    <p className="section-kicker">Why fans support</p>
                    <div className="mt-4 grid gap-3">
                      {reasonCounts
                        .filter((item) => item.count > 0)
                        .map((item) => (
                          <div key={item.reason} className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4">
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-black text-white">{item.reason}</p>
                              <p className="font-display text-3xl text-[#c9a84c]">{item.count}</p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-[#c9a84c]"
                                style={{ width: `${artistSupports.length ? (item.count / artistSupports.length) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      {!artistSupports.length && (
                        <p className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4 text-sm text-[#ede8df]/55">
                          Support reasons appear here after fans pledge.
                        </p>
                      )}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                    <p className="section-kicker">Community feed</p>
                    <div className="mt-4 grid gap-3">
                      {recentCommunity.length ? (
                        recentCommunity.slice(0, 6).map((event) => (
                          <div
                            key={`${event.type}-${event.id}`}
                            className="grid gap-3 rounded-xl border border-white/10 bg-[#1f1f1f] p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center"
                          >
                            <span className="w-fit rounded-full bg-[#c9a84c]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#c9a84c]">
                              {event.type}
                            </span>
                            <div>
                              <p className="font-black text-white">{event.label}</p>
                              <p className="text-sm text-[#ede8df]/52">{event.detail}</p>
                            </div>
                            <p className="text-sm font-black text-[#ede8df]/65">{event.meta}</p>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4 text-sm text-[#ede8df]/55">
                          Community activity will show pledges, listens, and shares as they happen.
                        </p>
                      )}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-7">
                    <p className="section-kicker">Street team</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {["Listen and save the song", "Share with three friends", "Bring one new supporter"].map((action) => (
                        <div key={action} className="rounded-xl border border-white/10 bg-[#1f1f1f] p-4">
                          <p className="font-black text-white">{action}</p>
                          <p className="mt-2 text-sm leading-6 text-[#ede8df]/52">
                            Lightweight actions fans can take before the artist has a full campaign team.
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                </>
              )}
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-[#c9a84c]/35 bg-[#141414] p-5 shadow-2xl shadow-black/30">
                <h2 className="font-display text-4xl uppercase text-white">Back this artist</h2>
                <p className="mt-2 text-sm leading-6 text-[#ede8df]/60">
                  Phase 1 captures pledge intent before turning on real payment processing.
                </p>

                <form className="mt-5 grid gap-3" onSubmit={addSupport}>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 25].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setSupportAmount(amount)}
                        className={`rounded-xl border p-3 font-black transition ${
                          supportAmount === amount
                            ? "border-[#c9a84c] bg-[#c9a84c] text-[#0a0a0a]"
                            : "border-white/10 bg-[#1f1f1f] text-[#ede8df]"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <label className="field-label rounded-xl border border-[#c9a84c]/25 bg-[#0f0f0f] p-3">
                    <span>Support a custom amount</span>
                    <span className="flex items-center rounded-xl border border-white/10 bg-[#101010] px-3 focus-within:border-[#c9a84c]/80 focus-within:shadow-[0_0_0_3px_rgba(201,168,76,0.14)]">
                      <span className="text-lg font-black text-[#c9a84c]">$</span>
                      <input
                        className="custom-amount-input"
                        inputMode="numeric"
                        min="1"
                        placeholder="Enter amount"
                        required
                        step="1"
                        type="number"
                        value={supportAmount}
                        onChange={(event) => setSupportAmount(Number(event.target.value))}
                      />
                    </span>
                  </label>
                  <label className="field-label">
                    Name
                    <input
                      className="field-input"
                      value={supporterName}
                      onChange={(event) => setSupporterName(event.target.value)}
                      placeholder="Brendo"
                    />
                  </label>
                  <label className="field-label">
                    Email
                    <input
                      className="field-input"
                      type="email"
                      value={supporterEmail}
                      onChange={(event) => setSupporterEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label className="field-label">
                    Why are you supporting?
                    <select
                      className="field-input bg-[#101010]"
                      value={supportReason}
                      onChange={(event) => setSupportReason(event.target.value)}
                    >
                      {supportReasons.map((reason) => (
                        <option key={reason}>{reason}</option>
                      ))}
                    </select>
                  </label>
                  <button className="mt-2 rounded-xl bg-[#c9a84c] px-5 py-4 text-base font-black text-[#0a0a0a]">
                    Pledge support
                  </button>
                </form>

                {latestSupport && (
                  <div className="mt-5 rounded-2xl border border-[#c9a84c] bg-[#c9a84c]/10 p-4">
                    <p className="section-kicker">Badge earned</p>
                    <p className="mt-2 font-display text-3xl uppercase text-white">
                      Early Believer #{artistSupports.length}
                    </p>
                    <p className="mt-1 text-sm text-[#ede8df]/65">
                      {latestSupport.supporterName} backed {activeArtist.name} with {money(latestSupport.amount)}.
                    </p>
                    <button
                      className="mt-3 w-full rounded-xl bg-[#ede8df] px-4 py-3 text-sm font-black text-[#0a0a0a]"
                      onClick={() => trackShare(latestSupport.referralCode)}
                    >
                      Track share link
                    </button>
                    <p className="mt-2 break-all text-xs text-[#ede8df]/45">{referralUrl}</p>
                  </div>
                )}
              </div>
            </aside>
          </section>
        </>
      )}

      {view === "create" && (
        <section className="mx-auto max-w-5xl px-4 pb-24 pt-40 sm:px-6 sm:pt-28">
          <p className="section-kicker">Create or nominate</p>
          <h1 className="font-display mt-3 max-w-3xl text-6xl uppercase leading-[0.9] text-white sm:text-7xl">
            Start a page people can rally around.
          </h1>
          <form
            className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#141414] p-5 sm:grid-cols-2 sm:p-7"
            onSubmit={addArtist}
          >
            <label className="field-label">
              Artist name
              <input name="name" className="field-input" required />
            </label>
            <label className="field-label">
              Genre / scene
              <input name="genre" className="field-input" placeholder="Indie pop, college rap..." />
            </label>
            {createMode === "artist" && (
              <label className="field-label sm:col-span-2">
                Campaign headline
                <input
                  name="headline"
                  className="field-input"
                  placeholder="Help this single find its first real audience."
                />
              </label>
            )}
            <label className="field-label sm:col-span-2">
              {createMode === "fan" ? "Why should they be on GroundFloor?" : "Why now?"}
              <textarea name="story" className="field-input min-h-28" />
            </label>
            <label className="field-label">
              Featured song
              <input name="songTitle" className="field-input" />
            </label>
            <label className="field-label">
              Song link
              <input name="songUrl" className="field-input" placeholder="Spotify, SoundCloud, YouTube" />
            </label>
            {createMode === "artist" && (
              <label className="field-label">
                Campaign goal
                <input name="goal" type="number" min="25" defaultValue="250" className="field-input" />
              </label>
            )}
            <label className="field-label">
              Page type
              <select
                name="mode"
                className="field-input bg-[#101010]"
                value={createMode}
                onChange={(event) => setCreateMode(event.target.value === "fan" ? "fan" : "artist")}
              >
                <option value="artist">Artist</option>
                <option value="fan">Fan nomination</option>
              </select>
              <span className="text-xs font-bold leading-5 text-[#ede8df]/45">
                {createMode === "fan"
                  ? "Fans nominate artists. The artist claims the page before campaign terms are set."
                  : "Artists can set the campaign headline and goal."}
              </span>
            </label>
            <label className="field-label">
              Your name
              <input name="creatorName" className="field-input" />
            </label>
            <label className="field-label">
              Contact email
              <input name="creatorEmail" type="email" className="field-input" />
            </label>
            <button className="rounded-xl bg-[#c9a84c] px-5 py-4 font-black text-[#0a0a0a] sm:col-span-2">
              {createMode === "fan" ? "Nominate artist" : "Publish test page"}
            </button>
          </form>
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#141414] p-5">
            <p className="section-kicker">Shareable artist links</p>
            <div className="mt-4 grid gap-3">
              {state.artists.map((artist) => (
                <button
                  key={artist.id}
                  className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#1f1f1f] p-4 text-left transition hover:border-[#c9a84c]/60 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => showArtist(artist)}
                >
                  <span>
                    <b className="block text-white">{artist.name}</b>
                    <span className="text-sm text-[#ede8df]/45">/artist/{getArtistSlug(artist)}</span>
                  </span>
                  <span className="text-sm font-black uppercase tracking-[0.12em] text-[#c9a84c]">Open page</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === "dashboard" && (
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-40 sm:px-6 sm:pt-28">
          <p className="section-kicker">Private operator dashboard</p>
          <h1 className="font-display mt-3 max-w-4xl text-6xl uppercase leading-[0.9] text-white sm:text-7xl">
            The raw engine behind public proof.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[#ede8df]/65">
            Supporters see proof signals. Operators see the private records, claim status, emails, and reasons needed to
            run the campaign.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Artist pages", state.artists.length],
              ["Pledges", state.supports.length],
              ["Raised intent", money(state.supports.reduce((sum, support) => sum + support.amount, 0))],
              ["Tracked shares", state.shares.length],
              ["Listen taps", state.listens.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#141414] p-4">
                <p className="text-sm font-bold text-[#ede8df]/45">{label}</p>
                <p className="font-display mt-2 text-4xl text-[#c9a84c]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#141414] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="section-kicker">Live growth</p>
                <h2 className="font-display mt-2 text-4xl uppercase text-white">Signals over time</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
                <span className="rounded-full bg-[#c9a84c]/15 px-3 py-1 text-[#c9a84c]">Pledges</span>
                <span className="rounded-full bg-[#6fb6ff]/15 px-3 py-1 text-[#6fb6ff]">Clicks</span>
                <span className="rounded-full bg-[#ff7ac8]/15 px-3 py-1 text-[#ff7ac8]">Listens</span>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
              <GrowthChart points={growthPoints} maxValue={maxGrowthValue} />
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-[#1f1f1f] p-3">
                <b className="block text-xl text-white">{state.supports.length}</b>
                <span className="text-[#ede8df]/50">support events captured</span>
              </div>
              <div className="rounded-xl bg-[#1f1f1f] p-3">
                <b className="block text-xl text-white">{state.shares.length}</b>
                <span className="text-[#ede8df]/50">share/click events captured</span>
              </div>
              <div className="rounded-xl bg-[#1f1f1f] p-3">
                <b className="block text-xl text-white">{state.listens.length}</b>
                <span className="text-[#ede8df]/50">listen taps captured</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h2 className="font-display text-4xl uppercase text-white">Supporter motivation</h2>
              <div className="mt-4 grid gap-3">
                {reasonCounts.map(({ reason, count }) => (
                  <div key={reason}>
                    <div className="flex justify-between text-sm font-bold text-[#ede8df]/72">
                      <span>{reason}</span>
                      <span>{count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#c9a84c]"
                        style={{ width: `${artistSupports.length ? (count / artistSupports.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#141414] p-5">
              <h2 className="font-display text-4xl uppercase text-white">Recent evidence</h2>
              <div className="mt-4 grid gap-3">
                {state.supports.slice(0, 5).map((support) => {
                  const artist = state.artists.find((item) => item.id === support.artistId);
                  return (
                    <div key={support.id} className="rounded-xl bg-[#1f1f1f] p-3 text-sm text-[#ede8df]/72">
                      <b className="text-white">{support.supporterName}</b> pledged{" "}
                      <b className="text-[#c9a84c]">{money(support.amount)}</b> to {artist?.name}
                      <span className="block text-[#ede8df]/45">Reason: {support.reason}</span>
                      <span className="block break-all text-[#ede8df]/35">
                        Private: {support.supporterEmail || "no email captured"} / ref {support.referralCode}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            className="mt-6 rounded-xl border border-white/15 px-4 py-3 text-sm font-black text-[#ede8df]/75"
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
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return <GroundFloorApp />;
}

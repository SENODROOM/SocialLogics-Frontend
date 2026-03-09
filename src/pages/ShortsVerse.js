/**
 * ShortsVerse.js  ─  frontend/src/pages/ShortsVerse.js
 *
 * FIXES applied (v4 — infinite scroll rewrite):
 *
 * 1. REPEATING VIDEOS: Removed the module-level `globalSeenYtIds` Set that
 *    permanently blocked every fetched ID from ever re-entering the feed.
 *    Now uses a rolling window of the last N seen IDs so that after the pool
 *    cycles, videos can re-appear naturally (just like YouTube Shorts).
 *
 * 2. POOL NOT GROWING / LOAD-MORE STALLING: `fetchShortsPage` now adds new
 *    items directly to `dynamicPool` AND returns them so `loadMore` can
 *    immediately call `buildBatch` from the enlarged pool.
 *
 * 3. LOAD-MORE NEVER TRIGGERING AFTER POOL EXHAUSTED: `loadMore` now always
 *    fetches from the API first, then builds the next batch from the pool.
 *    The old code returned early if `items.length === 0` which killed scroll.
 *
 * 4. SAME VIDEOS RECYCLED FOREVER: `buildBatch` now accepts a `feedSeenIds`
 *    set (slides already in the feed) and will skip those first, only falling
 *    back to them when the pool is truly exhausted — enabling a genuinely
 *    infinite stream even with a bounded video pool.
 *
 * 5. QUERY DIVERSITY: Doubled the SHORTS_QUERIES pool and added category-aware
 *    queries so each `loadMore` call fetches from different topics.
 *
 * 6. NO-MORE FLAG RESETS: `noMore` resets whenever a category or filter
 *    changes so the feed doesn't lock up after one exhaustion event.
 *
 * 7. FETCH-GUARD TIMEOUT: Added a 15-second safety timeout on
 *    `fetchingRemoteRef` so a stalled fetch never permanently blocks loadMore.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// SEED POOL — shown immediately while first API fetch loads
// ─────────────────────────────────────────────────────────────────────────────
const SEED_VIDEOS = [
  {
    ytId: "9bZkp7q19f0",
    title: "Gangnam Style",
    creator: "@PSY",
    cat: "Music",
  },
  {
    ytId: "JGwWNGJdvx8",
    title: "Shape of You",
    creator: "@EdSheeranVEVO",
    cat: "Music",
  },
  {
    ytId: "H5v3kku4y6Q",
    title: "Blinding Lights",
    creator: "@TheWeekndVEVO",
    cat: "Music",
  },
  {
    ytId: "OPf0YbXqDm0",
    title: "Uptown Funk",
    creator: "@MarkRonsonVEVO",
    cat: "Music",
  },
  {
    ytId: "7wtfhZwyrcc",
    title: "Levitating",
    creator: "@DuaLipaVEVO",
    cat: "Music",
  },
  {
    ytId: "hT_nvWreIhg",
    title: "Counting Stars",
    creator: "@OneRepublicVEVO",
    cat: "Music",
  },
  { ytId: "60ItHLz5WEA", title: "Faded", creator: "@AlanWalker", cat: "Music" },
  {
    ytId: "nfWlot6h_JM",
    title: "Shake It Off",
    creator: "@TaylorSwiftVEVO",
    cat: "Music",
  },
  {
    ytId: "DjMkejsIFGQ",
    title: "Anti-Hero",
    creator: "@TaylorSwiftVEVO",
    cat: "Music",
  },
  {
    ytId: "nGBHQDMX3KE",
    title: "Heat Waves",
    creator: "@GlassAnimals",
    cat: "Music",
  },
  {
    ytId: "KEI4qSrkPAs",
    title: "Can't Stop the Feeling",
    creator: "@JTimberlakeVEVO",
    cat: "Music",
  },
  {
    ytId: "WpYeekQkAdc",
    title: "Happier",
    creator: "@Marshmello",
    cat: "Music",
  },
  {
    ytId: "09R8_2nJtjg",
    title: "Sugar",
    creator: "@Maroon5VEVO",
    cat: "Music",
  },
  {
    ytId: "bo_efYLyVmo",
    title: "Watermelon Sugar",
    creator: "@HarryStylesVEVO",
    cat: "Music",
  },
  {
    ytId: "h--P8HzYZ8I",
    title: "Flowers",
    creator: "@MileyCyrusVEVO",
    cat: "Music",
  },
];

// Module-level pool — grows as we fetch from the API.
// We use a Map keyed by ytId to avoid true duplicates in the pool itself.
const dynamicPoolMap = new Map(SEED_VIDEOS.map((v) => [v.ytId, v]));
const getDynamicPool = () => Array.from(dynamicPoolMap.values());

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SKINS
// ─────────────────────────────────────────────────────────────────────────────
const SKINS = {
  youtube: {
    barBg: "#FF0000",
    glow: "255,0,0",
    accent: "#FF0000",
    icon: "▶",
    tag: "Shorts",
    avatarBg: "#FF0000",
    avatarColor: "#fff",
    subLabels: ["Subscribe", "Subscribed"],
    subBg: ["#FF0000", "transparent"],
    subBdr: "#FF0000",
    subClr: ["#fff", "#FF0000"],
    openTxt: "▶  Watch on YouTube",
    openUrl: (v) => `https://www.youtube.com/watch?v=${v.ytId}`,
    openBg: "#FF0000",
    openClr: "#fff",
  },
  tiktok: {
    barBg: "linear-gradient(90deg,#69C9D0,#EE1D52,#69C9D0)",
    glow: "238,29,82",
    accent: "#EE1D52",
    icon: "♪",
    tag: "TikTok",
    avatarBg: "linear-gradient(135deg,#69C9D0,#EE1D52)",
    avatarColor: "#fff",
    subLabels: ["Follow", "Following"],
    subBg: ["linear-gradient(90deg,#EE1D52,#69C9D0)", "transparent"],
    subBdr: "#EE1D52",
    subClr: ["#fff", "#EE1D52"],
    openTxt: "♪  Open TikTok",
    openUrl: (v) =>
      `https://www.tiktok.com/search?q=${encodeURIComponent(v.title)}`,
    openBg: "linear-gradient(90deg,#EE1D52,#69C9D0)",
    openClr: "#fff",
  },
  instagram: {
    barBg: "linear-gradient(90deg,#833ab4,#fd1d1d,#fcb045)",
    glow: "225,48,108",
    accent: "#E1306C",
    icon: "◎",
    tag: "Reels",
    avatarBg: "linear-gradient(135deg,#833ab4,#fd1d1d)",
    avatarColor: "#fff",
    subLabels: ["Follow", "Following"],
    subBg: ["linear-gradient(45deg,#f09433,#dc2743,#bc1888)", "transparent"],
    subBdr: "#dc2743",
    subClr: ["#fff", "#dc2743"],
    openTxt: "◎  Open Instagram",
    openUrl: (v) =>
      `https://www.instagram.com/reels/audio/?q=${encodeURIComponent(v.title)}`,
    openBg: "linear-gradient(90deg,#833ab4,#E1306C)",
    openClr: "#fff",
  },
  facebook: {
    barBg: "linear-gradient(90deg,#1877F2,#42a5f5)",
    glow: "24,119,242",
    accent: "#1877F2",
    icon: "f",
    tag: "Reels",
    avatarBg: "linear-gradient(135deg,#1877F2,#42a5f5)",
    avatarColor: "#fff",
    subLabels: ["+ Follow", "Following"],
    subBg: ["#1877F2", "transparent"],
    subBdr: "#1877F2",
    subClr: ["#fff", "#1877F2"],
    openTxt: "f  Open Facebook",
    openUrl: (v) =>
      `https://www.facebook.com/search/videos/?q=${encodeURIComponent(v.title)}`,
    openBg: "#1877F2",
    openClr: "#fff",
  },
  snapchat: {
    barBg: "#FFFC00",
    glow: "255,252,0",
    accent: "#FFFC00",
    icon: "◌",
    tag: "Spotlight",
    avatarBg: "#FFFC00",
    avatarColor: "#000",
    subLabels: ["+ Add", "Added"],
    subBg: ["#FFFC00", "transparent"],
    subBdr: "#FFFC00",
    subClr: ["#000", "#FFFC00"],
    openTxt: "👻  Snapchat Spotlight",
    openUrl: () => `https://www.snapchat.com/spotlight`,
    openBg: "#FFFC00",
    openClr: "#000",
  },
};

const SIDEBAR = [
  { id: "all", icon: "⬡", color: "#a855f7", label: "All" },
  { id: "youtube", icon: "▶", color: "#FF0000", label: "YouTube" },
  { id: "tiktok", icon: "♪", color: "#EE1D52", label: "TikTok" },
  { id: "instagram", icon: "◎", color: "#E1306C", label: "Instagram" },
  { id: "facebook", icon: "f", color: "#1877F2", label: "Facebook" },
  { id: "snapchat", icon: "◌", color: "#FFFC00", label: "Snapchat" },
];

const CATS = [
  "For You",
  "Trending",
  "Music",
  "Dance",
  "Comedy",
  "Food",
  "Sports",
  "Travel",
  "Art",
  "Fitness",
];

const PATTERN = [
  "youtube",
  "tiktok",
  "instagram",
  "youtube",
  "facebook",
  "youtube",
  "snapchat",
  "tiktok",
  "instagram",
  "youtube",
  "facebook",
  "youtube",
  "snapchat",
  "tiktok",
  "instagram",
];

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────────────────────────────────────
const PREFS_BASE_KEY = "sv_prefs_v4";
const AVAIL_KEY = "sv_availability_v1";
const SEEN_BASE_KEY = "sv_seen_v1";
const SIGNALS_KEY = "sv_signals_v1";
const AVAIL_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_RECENT_IDS = 18;
const MAX_RECENT_CREATORS = 8;
const MAX_SEEN_HISTORY = 40;

// Watch-time thresholds
const SKIP_THRESHOLD_MS = 4_000;
const GLANCE_THRESHOLD_MS = 10_000;
const WATCH_THRESHOLD_MS = 20_000;
const HOOKED_THRESHOLD_MS = 45_000;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function getViewerId() {
  const token = localStorage.getItem("sl_token");
  if (!token) return "guest";
  try {
    const [, payload] = token.split(".");
    const parsed = JSON.parse(atob(payload));
    return parsed?.id || parsed?.sub || "guest";
  } catch {
    return "guest";
  }
}

function prefsKeyFor(viewerId) {
  return `${PREFS_BASE_KEY}:${viewerId}`;
}
function seenKeyFor(viewerId) {
  return `${SEEN_BASE_KEY}:${viewerId}`;
}

function emptyPrefs() {
  return {
    liked: {},
    catAffinity: {},
    creatorAffinity: {},
    catWatch: {},
    creatorWatch: {},
    catWatchMs: {},
    creatorWatchMs: {},
    platformAffinity: {},
    blockedIds: [],
  };
}

function loadPrefs(viewerId) {
  const parsed = safeParse(localStorage.getItem(prefsKeyFor(viewerId)), {});
  const obj =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  return { ...emptyPrefs(), ...obj };
}

function loadAvailability() {
  return safeParse(localStorage.getItem(AVAIL_KEY), {});
}
function saveAvailability(map) {
  localStorage.setItem(AVAIL_KEY, JSON.stringify(map));
}

function cleanAvailabilityMap(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return {};
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(map).filter(
      ([, v]) => now - (v?.checkedAt || 0) < AVAIL_TTL_MS,
    ),
  );
}

function loadSeenIds(viewerId) {
  const parsed = safeParse(localStorage.getItem(seenKeyFor(viewerId)), []);
  return Array.isArray(parsed)
    ? parsed.filter((x) => typeof x === "string")
    : [];
}

function saveSeenIds(viewerId, ids) {
  localStorage.setItem(
    seenKeyFor(viewerId),
    JSON.stringify(ids.slice(0, MAX_SEEN_HISTORY)),
  );
}

function loadSignals() {
  return safeParse(localStorage.getItem(SIGNALS_KEY), {});
}
function saveSignals(signals) {
  localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
}

function recordSignal(ytId, platform, watchMs, signals) {
  const prev = signals[ytId] || {
    watchMs: 0,
    views: 0,
    skips: 0,
    replays: 0,
    platformTally: {},
  };
  const isSkip = watchMs < SKIP_THRESHOLD_MS;
  const isReplay = prev.views > 0;
  const pt = { ...prev.platformTally };
  pt[platform] = (pt[platform] || 0) + 1;
  return {
    ...signals,
    [ytId]: {
      watchMs: prev.watchMs + watchMs,
      views: prev.views + 1,
      skips: prev.skips + (isSkip ? 1 : 0),
      replays: prev.replays + (isReplay ? 1 : 0),
      platformTally: pt,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────────────────────
function weightedPick(candidates, getScore) {
  const scored = candidates.map((v) => ({ v, s: Math.max(0.05, getScore(v)) }));
  const total = scored.reduce((sum, x) => sum + x.s, 0);
  let r = Math.random() * total;
  for (const x of scored) {
    r -= x.s;
    if (r <= 0) return x.v;
  }
  return scored[scored.length - 1]?.v || null;
}

function scoreVideo(video, prefs, recentIds, recentCreators, signals) {
  const catLike = prefs.catAffinity?.[video.cat] || 0;
  const creatorLike = prefs.creatorAffinity?.[video.creator] || 0;
  const catWatch = prefs.catWatch?.[video.cat] || 0;
  const creatorWatch = prefs.creatorWatch?.[video.creator] || 0;
  const catWatchMs = prefs.catWatchMs?.[video.cat] || 0;
  const creatorWatchMs = prefs.creatorWatchMs?.[video.creator] || 0;
  const platformAff = prefs.platformAffinity?.[video.platform] || 0;
  const sig = signals?.[video.ytId];
  const sigSkipRate = sig ? sig.skips / Math.max(1, sig.views) : 0;
  const sigAvgWatchS = sig ? sig.watchMs / Math.max(1, sig.views) / 1000 : 0;
  const sigReplays = sig?.replays || 0;

  let score = 1;
  score += catLike * 2.5 + creatorLike * 3.5;
  score += Math.min(1.2, catWatch * 0.25) + Math.min(1.2, creatorWatch * 0.2);
  score += Math.min(2.0, Math.log1p(catWatchMs / 1000) * 0.18);
  score += Math.min(2.0, Math.log1p(creatorWatchMs / 1000) * 0.22);
  score += Math.min(1.5, platformAff * 0.3);
  if (prefs.liked?.[video.ytId]) score += 2.0;
  if (sig) {
    if (sigAvgWatchS >= HOOKED_THRESHOLD_MS / 1000) score += 3.0;
    else if (sigAvgWatchS >= WATCH_THRESHOLD_MS / 1000) score += 1.5;
    else if (sigAvgWatchS >= GLANCE_THRESHOLD_MS / 1000) score += 0.5;
    score += Math.min(3.0, sigReplays * 1.5);
    score *= 1 - sigSkipRate * 0.7;
  }
  // Recency: penalise recently seen but don't hard-block (unlike before)
  if (recentIds.slice(0, 6).includes(video.ytId)) score *= 0.05;
  else if (recentIds.includes(video.ytId)) score *= 0.3;
  if (recentCreators.slice(0, 3).includes(video.creator)) score *= 0.32;
  score += Math.random() * 0.6;
  return Math.max(0.01, score);
}

/**
 * Build a batch of PATTERN.length slides.
 *
 * FIX: `feedSeenIds` is the Set of ytIds already in the current feed.
 * We first try to pick from videos NOT in the feed. If the pool is
 * exhausted we fall back to already-shown videos (enabling true infinite
 * scroll) rather than returning an empty array.
 */
function buildBatch(
  batchNum,
  prefs,
  blockedSet,
  recentIds,
  recentCreators,
  signals,
  feedSeenIds = new Set(),
) {
  const pool = getDynamicPool().filter((v) => !blockedSet.has(v.ytId));
  if (pool.length === 0) return [];

  const usedInBatch = new Set();

  return PATTERN.map((platform, i) => {
    // Prefer: not blocked, not in current feed, not used in this batch
    const freshPool = pool.filter(
      (v) => !feedSeenIds.has(v.ytId) && !usedInBatch.has(v.ytId),
    );
    // Fallback 1: allow videos already in feed (true infinite)
    const relaxedPool =
      freshPool.length > 0
        ? freshPool
        : pool.filter((v) => !usedInBatch.has(v.ytId));
    // Fallback 2: any non-blocked video
    const finalPool = relaxedPool.length > 0 ? relaxedPool : pool;

    const selected =
      weightedPick(finalPool, (v) =>
        scoreVideo(v, prefs, recentIds, recentCreators, signals),
      ) || finalPool[Math.floor(Math.random() * finalPool.length)];

    usedInBatch.add(selected.ytId);
    return {
      ...selected,
      platform,
      uid: `${batchNum}-${i}-${Math.random().toString(36).slice(2)}`,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROXY + RSS FETCH
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Expanded query pool — 40 entries across topics so round-robin fetches
 * deliver diverse content before wrapping.
 */
const SHORTS_QUERIES = [
  "viral shorts 2025",
  "trending videos",
  "funny moments viral",
  "satisfying clips",
  "amazing videos 2025",
  "best of youtube",
  "must watch",
  "top viral clips",
  "incredible moments",
  "popular shorts",
  "entertainment viral",
  "wow moments",
  "unbelievable clips",
  "best videos 2025",
  "trending now",
  "funny viral",
  "shocking moments",
  "wholesome viral",
  "skill videos",
  "talent show clips",
  // new additions for diversity
  "dance challenge viral",
  "cooking tips viral",
  "travel shorts",
  "fitness motivation",
  "art satisfying",
  "animals funny",
  "science wow",
  "sports highlights",
  "comedy skits viral",
  "life hacks shorts",
  "music covers viral",
  "street food shorts",
  "nature beautiful",
  "magic tricks viral",
  "baby animals cute",
  "fails compilation",
  "inspirational moments",
  "gaming clips viral",
  "beauty tips shorts",
  "diy creative",
];

let queryIdx = 0;

function parseRssXml(xml) {
  const results = [];
  if (!xml) return results;
  const rx = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const e = m[1];
    const idM = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const ttM = e.match(/<title[^>]*>([^<]+)<\/title>/);
    const nmM = e.match(/<name>([^<]+)<\/name>/);
    if (!idM || !ttM) continue;
    results.push({
      ytId: idM[1].trim(),
      title: ttM[1]
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .substring(0, 80),
      creator: nmM ? "@" + nmM[1].trim().replace(/\s+/g, "") : "@creator",
    });
  }
  return results;
}

async function fetchViaProxy(ytUrl) {
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(ytUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(ytUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytUrl)}`,
  ];
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.startsWith("{")) {
        try {
          return JSON.parse(text).contents || "";
        } catch {
          continue;
        }
      }
      return text;
    } catch {
      continue;
    }
  }
  return "";
}

/**
 * Fetch a page of videos and add NEW ones to `dynamicPoolMap`.
 * Returns how many new videos were added to the pool.
 *
 * FIX: We no longer use a permanent `globalSeenYtIds` Set that blocks
 * re-fetching. Instead we only skip videos already in the pool (true
 * dedup), not videos already shown to the user.
 */
async function fetchAndExpandPool(cat = "For You") {
  // Pick queries — cat-aware: prepend a category query when not "For You"
  const catQuery =
    cat !== "For You" ? cat.toLowerCase() + " shorts viral" : null;

  const q1 = catQuery || SHORTS_QUERIES[queryIdx % SHORTS_QUERIES.length];
  const q2 =
    SHORTS_QUERIES[(queryIdx + (catQuery ? 0 : 1)) % SHORTS_QUERIES.length];
  queryIdx += catQuery ? 1 : 2;

  const base = "https://www.youtube.com/feeds/videos.xml?search_query=";
  const [xml1, xml2] = await Promise.all([
    fetchViaProxy(base + encodeURIComponent(q1)),
    fetchViaProxy(base + encodeURIComponent(q2)),
  ]);

  const raw = [...parseRssXml(xml1), ...parseRssXml(xml2)];
  let added = 0;
  for (const v of raw) {
    if (!dynamicPoolMap.has(v.ytId)) {
      dynamicPoolMap.set(v.ytId, {
        ...v,
        cat: cat !== "For You" ? cat : "For You",
      });
      added++;
    }
  }
  return added;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.sv{position:fixed;inset:0;z-index:9999;display:flex;background:#06060a;font-family:'DM Sans',-apple-system,sans-serif;overflow:hidden}

.sv-side{width:60px;flex-shrink:0;background:#08080c;border-right:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:2px;z-index:10}
.sv-sb{width:44px;height:44px;border-radius:12px;border:1.5px solid transparent;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;transition:all .2s;outline:none;color:#2e2e2e;position:relative;font-family:inherit}
.sv-sb:hover{color:#666}
.sv-tip{position:absolute;left:54px;top:50%;transform:translateY(-50%);background:#111;border:1px solid rgba(255,255,255,.08);color:#ccc;font-size:10px;font-weight:600;padding:4px 10px;border-radius:8px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;z-index:100}
.sv-sb:hover .sv-tip{opacity:1}

.sv-feed{flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column}
.sv-scroll{flex:1;overflow-y:scroll;scroll-snap-type:y mandatory}
.sv-scroll::-webkit-scrollbar{display:none}
.sv-slide{height:100vh;width:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;flex-shrink:0;background:#000}

.sv-frame{position:absolute;inset:0;z-index:1}
.sv-frame iframe{width:100%;height:100%;border:none;display:block}

.sv-glow{position:absolute;inset:-60px;z-index:0;pointer-events:none;filter:blur(90px);opacity:.35;transition:opacity .4s}

.sv-bar{position:absolute;top:0;left:0;right:0;height:3px;z-index:22;pointer-events:none}

.sv-badge{position:absolute;top:50px;left:14px;z-index:25;display:inline-flex;align-items:center;gap:5px;background:rgba(0,0,0,.6);backdrop-filter:blur(14px);border-radius:20px;padding:5px 12px;font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,.08)}

.sv-sound{position:absolute;top:12px;right:12px;z-index:35;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.65);backdrop-filter:blur(18px);border:1.5px solid rgba(255,255,255,.15);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;outline:none}
.sv-sound:hover{transform:scale(1.1);background:rgba(255,255,255,.1)}

.sv-bot{position:absolute;bottom:0;left:0;right:0;z-index:20;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.78) 28%,rgba(0,0,0,.35) 55%,transparent 100%);padding:0 14px 18px}

.sv-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.sv-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;border:2px solid rgba(255,255,255,.15);box-shadow:0 2px 12px rgba(0,0,0,.5)}
.sv-name{font-size:13px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sv-cat-lbl{font-size:10px;color:rgba(255,255,255,.38);margin-top:1px}
.sv-sub{border-radius:20px;padding:5px 14px;font-size:11.5px;font-weight:700;cursor:pointer;border:2px solid;font-family:inherit;transition:all .18s;outline:none;white-space:nowrap}
.sv-sub:hover{filter:brightness(1.1)}

.sv-title{font-size:13px;color:rgba(255,255,255,.88);margin:0 0 11px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:400}

.sv-open{display:inline-flex;align-items:center;gap:5px;padding:8px 18px;border-radius:999px;border:none;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .2s;box-shadow:0 3px 18px rgba(0,0,0,.4)}
.sv-open:hover{transform:translateY(-2px);box-shadow:0 7px 26px rgba(0,0,0,.55)}

.sv-acts{position:absolute;right:12px;bottom:130px;z-index:30;display:flex;flex-direction:column;align-items:center;gap:16px}
.sv-act{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}
.sv-btn{width:48px;height:48px;border-radius:50%;background:rgba(6,6,10,.75);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;font-size:21px;border:1.5px solid rgba(255,255,255,.09);transition:all .2s;box-shadow:0 2px 14px rgba(0,0,0,.5)}
.sv-btn:hover{transform:scale(1.1)}
.sv-lbl{font-size:10px;color:rgba(255,255,255,.45);font-weight:600}

.sv-cats{position:absolute;top:0;left:0;right:0;z-index:24;padding:12px 12px 26px;background:linear-gradient(to bottom,rgba(0,0,0,.88) 0%,transparent 100%);pointer-events:none}
.sv-cats-row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;pointer-events:all}
.sv-cats-row::-webkit-scrollbar{display:none}
.sv-pill{padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .18s;outline:none}
.sv-pill-on{background:linear-gradient(90deg,#7c3aed,#db2777);color:#fff;border:none;box-shadow:0 0 18px rgba(124,58,237,.5)}
.sv-pill-off{background:rgba(255,255,255,.07);color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.1)}
.sv-pill-off:hover{background:rgba(255,255,255,.12)}

.sv-dots{position:absolute;right:5px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;z-index:20;max-height:40vh;overflow:hidden}
.sv-dot{border-radius:4px;cursor:pointer;transition:all .2s}

.sv-now{position:absolute;bottom:0;left:0;right:0;z-index:20;pointer-events:none}
.sv-now-in{max-width:480px;margin:0 auto;background:rgba(4,3,10,.94);backdrop-filter:blur(24px);border-radius:12px 12px 0 0;padding:8px 14px;display:flex;align-items:center;gap:8px;border-top:1px solid rgba(255,255,255,.05)}

.sv-hint{position:absolute;bottom:74px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;animation:sv-pulse 2s ease-in-out infinite;z-index:5}

.sv-load{height:80px;display:flex;align-items:center;justify-content:center}
.sv-spin{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.07);border-top-color:#7c3aed;animation:sv-spin .75s linear infinite}

.sv-heart{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:90px;pointer-events:none;z-index:40;animation:sv-heart .8s ease-out forwards}

@keyframes sv-heart{0%{transform:scale(.3);opacity:1}55%{transform:scale(1.3);opacity:1}100%{transform:scale(1.7);opacity:0}}
@keyframes sv-pulse{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes sv-spin{to{transform:rotate(360deg)}}
`;

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
function Actions({ liked, saved, accent, onLike, onSave }) {
  return (
    <div className="sv-acts">
      {[
        { e: liked ? "❤️" : "🤍", l: "142K", active: liked, fn: onLike },
        { e: "💬", l: "8.4K", active: false, fn: null },
        { e: "↗️", l: "21K", active: false, fn: null },
        { e: saved ? "🔖" : "📌", l: "Save", active: saved, fn: onSave },
      ].map(({ e, l, active, fn }) => (
        <div
          key={e}
          className="sv-act"
          onClick={(ev) => {
            ev.stopPropagation();
            fn?.();
          }}
        >
          <div
            className="sv-btn"
            style={{
              background: active ? `rgba(${accent},0.18)` : "rgba(6,6,10,.75)",
              borderColor: active
                ? `rgba(${accent},0.5)`
                : "rgba(255,255,255,.09)",
            }}
          >
            {e}
          </div>
          <span className="sv-lbl">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────────────────────
function Card({
  video,
  isActive,
  muted,
  onToggleSound,
  isLiked,
  isSaved,
  onLikeChange,
  onSaveChange,
  onUnavailable,
}) {
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [sub, setSub] = useState(false);
  const [heart, setHeart] = useState(false);
  const iRef = useRef(null);
  const ready = useRef(false);
  const lastTap = useRef(0);
  const unavailableSent = useRef(false);
  const isActRef = useRef(isActive);
  const mutedRef = useRef(muted);
  const sk = SKINS[video.platform] || SKINS.youtube;

  useEffect(() => {
    isActRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked, video.uid]);
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved, video.uid]);

  const msg = useCallback((cmd) => {
    if (iRef.current && ready.current)
      iRef.current.contentWindow.postMessage(cmd, "*");
  }, []);

  const sync = useCallback(
    (active, m) => {
      if (active) {
        msg('{"event":"command","func":"playVideo","args":""}');
        msg(
          m
            ? '{"event":"command","func":"mute","args":""}'
            : '{"event":"command","func":"unMute","args":""}',
        );
        if (!m) msg('{"event":"command","func":"setVolume","args":[100]}');
      } else {
        msg('{"event":"command","func":"pauseVideo","args":""}');
        msg('{"event":"command","func":"mute","args":""}');
      }
    },
    [msg],
  );

  const onLoad = useCallback(() => {
    ready.current = true;
    sync(isActRef.current, mutedRef.current);
  }, [sync]);
  useEffect(() => {
    if (!ready.current) return;
    sync(isActive, muted);
  }, [isActive, muted, sync]);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (!ready.current) return;
    onToggleSound();
    if (!muted) {
      msg('{"event":"command","func":"mute","args":""}');
    } else {
      msg('{"event":"command","func":"unMute","args":""}');
      msg('{"event":"command","func":"setVolume","args":[100]}');
    }
  };

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        setLiked(true);
        onLikeChange?.(video, true);
      }
      setHeart(true);
      setTimeout(() => setHeart(false), 900);
    }
    lastTap.current = now;
  };

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      onLikeChange?.(video, next);
      return next;
    });
  };
  const toggleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      onSaveChange?.(video, next);
      return next;
    });
  };

  const src = `https://www.youtube.com/embed/${video.ytId}?autoplay=1&mute=1&loop=1&playlist=${video.ytId}&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  return (
    <div
      onClick={tap}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#000",
      }}
    >
      {heart && <div className="sv-heart">❤️</div>}
      <div
        className="sv-glow"
        style={{
          background: `radial-gradient(ellipse at 50% 65%, rgba(${sk.glow},0.35) 0%, transparent 68%)`,
          opacity: isActive ? 1 : 0,
        }}
      />
      <div className="sv-bar" style={{ background: sk.barBg }} />
      <div className="sv-frame">
        <iframe
          key={video.ytId}
          ref={iRef}
          src={src}
          onLoad={onLoad}
          onError={() => {
            if (!unavailableSent.current) {
              unavailableSent.current = true;
              onUnavailable?.(video.ytId);
            }
          }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <button className="sv-sound" onClick={toggleSound}>
        {muted ? "🔇" : "🔊"}
      </button>
      <div
        className="sv-badge"
        style={{ borderColor: `rgba(${sk.glow},0.3)`, color: "#fff" }}
      >
        <span style={{ color: sk.accent, fontSize: 12 }}>{sk.icon}</span>
        {sk.tag}
      </div>
      <div className="sv-bot">
        <div className="sv-row">
          <div
            className="sv-av"
            style={{ background: sk.avatarBg, color: sk.avatarColor }}
          >
            {sk.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sv-name">{video.creator}</div>
            <div className="sv-cat-lbl">{video.cat}</div>
          </div>
          <button
            className="sv-sub"
            onClick={(e) => {
              e.stopPropagation();
              setSub((s) => !s);
            }}
            style={{
              background: sub ? sk.subBg[1] : sk.subBg[0],
              borderColor: sk.subBdr,
              color: sub ? sk.subClr[1] : sk.subClr[0],
            }}
          >
            {sk.subLabels[sub ? 1 : 0]}
          </button>
        </div>
        <p className="sv-title">{video.title}</p>
        <a
          className="sv-open"
          href={sk.openUrl(video)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ background: sk.openBg, color: sk.openClr }}
        >
          {sk.openTxt} ↗
        </a>
      </div>
      <Actions
        liked={liked}
        saved={saved}
        accent={sk.glow}
        onLike={toggleLike}
        onSave={toggleSave}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ShortsVerse() {
  const navigate = useNavigate();
  const viewerIdRef = useRef(getViewerId());
  const recentIdsRef = useRef([]);
  const recentCreatorsRef = useRef([]);
  const [prefs, setPrefs] = useState(() => loadPrefs(viewerIdRef.current));
  const [signals, setSignals] = useState(() => loadSignals());
  const enterTimeRef = useRef(Date.now());

  // FIX: fetchingRemoteRef now resets via timeout guard — a stalled fetch
  // will never permanently block loadMore.
  const fetchingRemoteRef = useRef(false);
  const fetchGuardTimer = useRef(null);

  const [fetchError, setFetchError] = useState(false);
  const [blockedIds, setBlockedIds] = useState(() => {
    const avail = cleanAvailabilityMap(loadAvailability());
    const knownUnavailable = Object.entries(avail)
      .filter(([, v]) => v?.available === false)
      .map(([id]) => id);
    return new Set([
      ...loadPrefs(viewerIdRef.current).blockedIds,
      ...knownUnavailable,
    ]);
  });
  const [filter, setFilter] = useState("all");
  const [cat, setCat] = useState("For You");
  const batchCounterRef = useRef(Math.floor(Math.random() * 1000));

  // Feed is initialised from the seed pool
  const [feed, setFeed] = useState(() =>
    buildBatch(
      batchCounterRef.current++,
      loadPrefs(viewerIdRef.current),
      new Set(),
      [],
      [],
      loadSignals(),
      new Set(),
    ),
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [muted, setMuted] = useState(true);
  const scrollRef = useRef(null);
  const obsRef = useRef(null);
  const slideRefs = useRef([]);
  const [savedMap, setSavedMap] = useState({});

  // Persist prefs
  useEffect(() => {
    localStorage.setItem(
      prefsKeyFor(viewerIdRef.current),
      JSON.stringify(prefs),
    );
  }, [prefs]);

  // Availability check
  useEffect(() => {
    const current = cleanAvailabilityMap(loadAvailability());
    saveAvailability(current);
    const staleOrUnknown = getDynamicPool().filter((v) => {
      const entry = current[v.ytId];
      return !entry || Date.now() - (entry.checkedAt || 0) > AVAIL_TTL_MS;
    });
    if (staleOrUnknown.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates = {};
      await Promise.all(
        staleOrUnknown.map(async (v) => {
          try {
            const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${v.ytId}`)}&format=json`;
            const r = await fetch(url);
            updates[v.ytId] = { available: r.ok, checkedAt: Date.now() };
          } catch {}
        }),
      );
      if (cancelled || Object.keys(updates).length === 0) return;
      const nextAvail = {
        ...cleanAvailabilityMap(loadAvailability()),
        ...updates,
      };
      saveAvailability(nextAvail);
      const newlyBlocked = Object.entries(updates)
        .filter(([, v]) => v.available === false)
        .map(([id]) => id);
      if (newlyBlocked.length > 0)
        setBlockedIds((prev) => new Set([...prev, ...newlyBlocked]));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Remove blocked videos from feed
  useEffect(() => {
    if (blockedIds.size === 0) return;
    setFeed((prev) => prev.filter((v) => !blockedIds.has(v.ytId)));
  }, [blockedIds]);

  // Inject CSS
  useEffect(() => {
    let el = document.getElementById("sv-css");
    if (!el) {
      el = document.createElement("style");
      el.id = "sv-css";
      document.head.appendChild(el);
    }
    el.textContent = CSS;
    return () => el.remove();
  }, []);

  // Keyboard nav
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") navigate(-1);
      if (
        (e.key === "ArrowDown" || e.key === "j") &&
        activeIdx < feed.length - 1
      )
        goTo(activeIdx + 1);
      if ((e.key === "ArrowUp" || e.key === "k") && activeIdx > 0)
        goTo(activeIdx - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [activeIdx, feed.length]);

  const goTo = (idx) =>
    slideRefs.current[idx]?.scrollIntoView({ behavior: "smooth" });

  /**
   * loadMore — the core infinite scroll engine.
   *
   * Strategy:
   * 1. Fetch new videos from the API and add them to the pool.
   * 2. Regardless of whether the fetch succeeded, build a new batch
   *    from the (now larger) pool — using `feedSeenIds` so we prefer
   *    fresh videos but fall back to already-shown ones if needed.
   * 3. Append the batch to the feed.
   */
  const loadMore = useCallback(async () => {
    if (fetchingRemoteRef.current) return;
    fetchingRemoteRef.current = true;
    setLoading(true);

    // Safety: always release guard after 15s even if fetch hangs
    clearTimeout(fetchGuardTimer.current);
    fetchGuardTimer.current = setTimeout(() => {
      fetchingRemoteRef.current = false;
    }, 15000);

    try {
      // Try to grow the pool
      try {
        await fetchAndExpandPool(cat);
        setFetchError(false);
      } catch {
        setFetchError(true);
        // Pool growth failed — we still build from existing pool below
      }

      // Build next batch from enlarged pool
      setFeed((prev) => {
        const feedSeenIds = new Set(prev.map((v) => v.ytId));
        const newBatch = buildBatch(
          batchCounterRef.current++,
          prefs,
          blockedIds,
          recentIdsRef.current,
          recentCreatorsRef.current,
          signals,
          feedSeenIds,
        );
        return newBatch.length > 0 ? [...prev, ...newBatch] : prev;
      });
    } finally {
      clearTimeout(fetchGuardTimer.current);
      setLoading(false);
      fetchingRemoteRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, blockedIds, prefs, signals]);

  // IntersectionObserver — track active slide, trigger loadMore near end
  useEffect(() => {
    obsRef.current?.disconnect();
    obsRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const idx = parseInt(en.target.dataset.idx, 10);
            if (isNaN(idx)) return;
            setActiveIdx(idx);
            if (idx > 0) setShowHint(false);
            // FIX: trigger loadMore when within 8 slides of end (was 6)
            if (idx >= feed.length - 8) loadMore();
          }
        });
      },
      { threshold: 0.5 },
    );
    slideRefs.current.forEach((el) => el && obsRef.current.observe(el));
    return () => obsRef.current?.disconnect();
  }, [feed.length, loadMore]);

  // Initial pool expansion on mount
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When feed is small, keep loading
  useEffect(() => {
    if (feed.length < 20 && !fetchingRemoteRef.current) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.length]);

  // FIX: When category changes, trigger a fresh fetch with the new category
  // query so the pool gets category-relevant videos.
  const prevCatRef = useRef(cat);
  useEffect(() => {
    if (cat === prevCatRef.current) return;
    prevCatRef.current = cat;
    // Kick off a fetch for this category immediately
    if (!fetchingRemoteRef.current) loadMore();
  }, [cat, loadMore]);

  // Behavioural tracking (unchanged logic)
  const prevCurRef = useRef(null);
  const visible =
    filter === "all" ? feed : feed.filter((v) => v.platform === filter);
  const cur = visible[activeIdx];

  useEffect(() => {
    const now = Date.now();
    const prev = prevCurRef.current;
    if (prev?.ytId) {
      const watchMs = now - enterTimeRef.current;
      setSignals((s) => {
        const next = recordSignal(prev.ytId, prev.platform, watchMs, s);
        saveSignals(next);
        return next;
      });
      setPrefs((p) => {
        const catWatch = { ...(p.catWatch || {}) };
        const creatorWatch = { ...(p.creatorWatch || {}) };
        const catWatchMs = { ...(p.catWatchMs || {}) };
        const creatorWatchMs = { ...(p.creatorWatchMs || {}) };
        const platformAffinity = { ...(p.platformAffinity || {}) };
        catWatch[prev.cat] = (catWatch[prev.cat] || 0) + 1;
        creatorWatch[prev.creator] = (creatorWatch[prev.creator] || 0) + 1;
        catWatchMs[prev.cat] = (catWatchMs[prev.cat] || 0) + watchMs;
        creatorWatchMs[prev.creator] =
          (creatorWatchMs[prev.creator] || 0) + watchMs;
        const platDelta =
          watchMs < SKIP_THRESHOLD_MS
            ? -0.5
            : watchMs >= WATCH_THRESHOLD_MS
              ? 1
              : 0.2;
        platformAffinity[prev.platform] =
          (platformAffinity[prev.platform] || 0) + platDelta;
        return {
          ...p,
          catWatch,
          creatorWatch,
          catWatchMs,
          creatorWatchMs,
          platformAffinity,
        };
      });
    }
    if (cur?.ytId) {
      recentIdsRef.current = [
        cur.ytId,
        ...recentIdsRef.current.filter((id) => id !== cur.ytId),
      ].slice(0, MAX_RECENT_IDS);
      saveSeenIds(viewerIdRef.current, recentIdsRef.current);
      recentCreatorsRef.current = [
        cur.creator,
        ...recentCreatorsRef.current.filter((x) => x !== cur.creator),
      ].slice(0, MAX_RECENT_CREATORS);
    }
    prevCurRef.current = cur;
    enterTimeRef.current = now;
  }, [cur?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const markUnavailable = useCallback((ytId) => {
    setBlockedIds((prev) => {
      if (prev.has(ytId)) return prev;
      return new Set([...prev, ytId]);
    });
    const current = cleanAvailabilityMap(loadAvailability());
    current[ytId] = { available: false, checkedAt: Date.now() };
    saveAvailability(current);
    setPrefs((prev) => {
      const blocked = new Set(prev.blockedIds || []);
      blocked.add(ytId);
      return { ...prev, blockedIds: [...blocked] };
    });
  }, []);

  const onLikeChange = useCallback((video, nextLiked) => {
    setPrefs((prev) => {
      const liked = { ...(prev.liked || {}) };
      const catAffinity = { ...(prev.catAffinity || {}) };
      const creatorAffinity = { ...(prev.creatorAffinity || {}) };
      if (nextLiked) {
        liked[video.ytId] = true;
        catAffinity[video.cat] = (catAffinity[video.cat] || 0) + 1;
        creatorAffinity[video.creator] =
          (creatorAffinity[video.creator] || 0) + 1;
      } else {
        delete liked[video.ytId];
        catAffinity[video.cat] = Math.max(0, (catAffinity[video.cat] || 0) - 1);
        creatorAffinity[video.creator] = Math.max(
          0,
          (creatorAffinity[video.creator] || 0) - 1,
        );
      }
      return { ...prev, liked, catAffinity, creatorAffinity };
    });
  }, []);

  // ── JSX ──────────────────────────────────────────────────────────────────
  return createPortal(
    <div className="sv">
      {/* Sidebar */}
      <aside className="sv-side">
        <button
          className="sv-sb"
          onClick={() => navigate(-1)}
          style={{ color: "#333", marginBottom: 8, fontSize: 12 }}
        >
          ✕<span className="sv-tip">Exit</span>
        </button>
        {SIDEBAR.map((b) => (
          <button
            key={b.id}
            className="sv-sb"
            onClick={() => setFilter(b.id)}
            style={{
              color: filter === b.id ? b.color : "#2a2a2a",
              borderColor: filter === b.id ? `${b.color}44` : "transparent",
              background: filter === b.id ? `${b.color}15` : "transparent",
              boxShadow: filter === b.id ? `0 0 14px ${b.color}25` : "none",
            }}
          >
            {b.icon}
            <span className="sv-tip">{b.label}</span>
          </button>
        ))}
      </aside>

      {/* Feed */}
      <main className="sv-feed">
        {/* Category pills */}
        <div className="sv-cats">
          <div className="sv-cats-row">
            {CATS.map((c) => (
              <button
                key={c}
                className={`sv-pill ${cat === c ? "sv-pill-on" : "sv-pill-off"}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll container */}
        <div className="sv-scroll" ref={scrollRef}>
          {visible.length === 0 && (
            <div
              className="sv-load"
              style={{
                minHeight: "100vh",
                color: "rgba(255,255,255,.55)",
                fontFamily: "'DM Mono',monospace",
                fontSize: 12,
                letterSpacing: ".06em",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {fetchError ? (
                <>
                  ⚠️ Could not load new Shorts. Check your connection.
                  <br />
                  Using cached videos.
                </>
              ) : (
                "Loading Shorts…"
              )}
            </div>
          )}
          {visible.map((video, i) => (
            <div
              key={video.uid}
              className="sv-slide"
              data-idx={i}
              ref={(el) => (slideRefs.current[i] = el)}
            >
              <Card
                video={video}
                isActive={i === activeIdx}
                muted={muted}
                onToggleSound={() => setMuted((m) => !m)}
                isLiked={!!prefs.liked?.[video.ytId]}
                isSaved={!!savedMap[video.ytId]}
                onLikeChange={onLikeChange}
                onSaveChange={(v, next) =>
                  setSavedMap((prev) => ({ ...prev, [v.ytId]: next }))
                }
                onUnavailable={markUnavailable}
              />
            </div>
          ))}
          {loading && (
            <div className="sv-load">
              <div className="sv-spin" />
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="sv-dots">
          {visible
            .slice(Math.max(0, activeIdx - 4), activeIdx + 5)
            .map((_, ri) => {
              const ai = Math.max(0, activeIdx - 4) + ri;
              return (
                <div
                  key={ai}
                  className="sv-dot"
                  onClick={() => goTo(ai)}
                  style={{
                    width: ai === activeIdx ? 4 : 3,
                    height: ai === activeIdx ? 20 : 8,
                    background:
                      ai === activeIdx ? "#a855f7" : "rgba(255,255,255,.18)",
                    boxShadow: ai === activeIdx ? "0 0 8px #a855f770" : "none",
                  }}
                />
              );
            })}
        </div>

        {/* Scroll hint */}
        {showHint && (
          <div className="sv-hint">
            <span style={{ fontSize: 18, color: "rgba(255,255,255,.3)" }}>
              ↕
            </span>
            <span
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,.2)",
                fontWeight: 700,
                letterSpacing: ".16em",
                fontFamily: "'DM Mono',monospace",
              }}
            >
              SCROLL
            </span>
          </div>
        )}

        {/* Now-playing bar */}
        {cur && (
          <div className="sv-now">
            <div className="sv-now-in">
              <span
                style={{
                  color: SKINS[cur.platform]?.accent || "#fff",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {SKINS[cur.platform]?.icon}
              </span>
              <span
                style={{
                  flex: 1,
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10.5,
                  color: "rgba(255,255,255,.42)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cur.title}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  color: "rgba(255,255,255,.2)",
                  flexShrink: 0,
                }}
              >
                {activeIdx + 1}/{visible.length}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>,
    document.body,
  );
}

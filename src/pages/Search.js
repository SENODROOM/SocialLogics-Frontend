/**
 * Search.js  ─  frontend/src/pages/Search.js
 *
 * NEW IN THIS VERSION
 * ────────────────────
 * 1. VIDEO PREVIEW ON HOVER — ResultCard now shows a ▶ play-button overlay
 *    when hovered. Clicking the play button opens a lightweight preview modal
 *    with a YouTube embed (or a platform-themed preview for non-YT platforms)
 *    so users can preview before navigating.
 *
 * 2. POSTS / VIDEOS / TRENDS TABS — Below the platform results grid (after the
 *    Quick Hide bar) there is now a tab bar:
 *      • Videos   — curated video cards linking to YouTube/Vimeo/Dailymotion
 *      • Posts    — Reddit-style post cards with upvotes, subreddit, etc.
 *      • Trends   — real-time trending topics from the trending API
 *    Each tab shows rich cards and links out to the real platform.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";
import RecommendationFeed from "../components/features/RecommendationFeed";
import { bookmarksAPI, searchAPI, usersAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../hooks/useSearch";
import { PLATFORMS, PLATFORM_CATEGORIES } from "../utils/constants";
import toast from "react-hot-toast";

const parseUsers = (s = "0") =>
  parseFloat(s.replace("B", "e9").replace("M", "e6").replace("K", "e3")) || 0;
const fmtUsers = (n) =>
  n >= 1e9
    ? (n / 1e9).toFixed(1) + "B"
    : n >= 1e6
      ? (n / 1e6).toFixed(0) + "M"
      : n.toString();

const SORT_OPTIONS = [
  { id: "relevance", label: "⬡ Relevance" },
  { id: "users", label: "👥 Most Users" },
  { id: "az", label: "A → Z" },
];

// ── YouTube video IDs to preview for certain platforms ────────────────────────
const PREVIEW_YT_IDS = {
  youtube: "dQw4w9WgXcQ",
  tiktok: "9bZkp7q19f0",
  instagram: "JGwWNGJdvx8",
  reddit: "OPf0YbXqDm0",
  dailymotion: "YQHsXMglC9A",
  vimeo: "RgKAFK5djSk",
  twitch: "CevxZvSJLk8",
  snapchat: "iS1g8G_njx8",
  facebook: "bo_efYLyVmo",
};

// ── Video Preview Modal ───────────────────────────────────────────────────────
function PreviewModal({ result, onClose }) {
  const ytId = PREVIEW_YT_IDS[result.platform] || "dQw4w9WgXcQ";
  const hasYT = !!PREVIEW_YT_IDS[result.platform];

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(0,0,0,.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#0a0d18",
          border: `1px solid ${result.color}44`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 30px 80px rgba(0,0,0,.7), 0 0 40px ${result.color}22`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: `1px solid ${result.color}22`,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `${result.color}18`,
              border: `1.5px solid ${result.color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: result.color,
              fontWeight: 900,
              fontSize: "1rem",
            }}
          >
            {result.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontSize: "0.88rem",
                fontWeight: 800,
                color: result.color,
              }}
            >
              {result.name}
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: "0.6rem",
                color: "var(--c-text4)",
              }}
            >
              Preview
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.1)",
              color: "var(--c-text3)",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Video / preview area */}
        {hasYT ? (
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${result.color}08, #000)`,
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 52, color: result.color }}>
              {result.icon}
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: "0.75rem",
                color: "var(--c-text3)",
              }}
            >
              No preview available for {result.name}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            gap: 10,
            borderTop: `1px solid ${result.color}18`,
          }}
        >
          <a
            href={result.mainUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: "9px 0",
              textAlign: "center",
              background: `${result.color}`,
              color: "#000",
              borderRadius: 8,
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            Open {result.name} →
          </a>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px",
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8,
              color: "var(--c-text3)",
              fontFamily: "var(--f-display)",
              fontSize: "0.68rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User badge ────────────────────────────────────────────────────────────────
function UserBadge({ count }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 6px",
        borderRadius: 99,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "var(--f-mono)",
        fontSize: "0.58rem",
        color: "var(--c-text3)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
    >
      👥 {count}
    </span>
  );
}

// ── Result card with hover preview ───────────────────────────────────────────
function ResultCard({ result, query, onBookmark, rank, onPreview }) {
  const [hovered, setHovered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const urls = result.urls || { main: result.mainUrl };
  const extraUrls = Object.entries(urls).filter(([k]) => k !== "main");

  const openUrl = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    searchAPI.recordClick({ platform: result.platform, query }).catch(() => {});
  };

  const copyUrl = (e) => {
    e.stopPropagation();
    const url = result.mainUrl || urls.main;
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        toast.success("URL copied!", { duration: 1500 });
      })
      .catch(() => toast.error("Copy failed"));
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (bookmarked) return;
    setBookmarked(true);
    onBookmark(result);
  };

  const mainUrl = result.mainUrl || urls.main;

  return (
    <article
      style={{
        background: hovered
          ? "rgba(255,255,255,0.055)"
          : "rgba(255,255,255,0.028)",
        border: `1px solid ${hovered ? result.color + "70" : "rgba(255,255,255,0.07)"}`,
        borderLeft: `3px solid ${result.color}`,
        borderRadius: 12,
        padding: "14px 16px",
        transition: "all 220ms cubic-bezier(.16,1,.3,1)",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered
          ? `0 10px 30px ${result.color}18,0 4px 12px rgba(0,0,0,.35)`
          : "0 2px 8px rgba(0,0,0,.2)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        cursor: "pointer",
      }}
      onClick={() => openUrl(mainUrl)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank badge */}
      {rank <= 3 && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontFamily: "var(--f-display)",
            fontSize: "0.55rem",
            fontWeight: 800,
            padding: "1px 6px",
            borderRadius: 99,
            background:
              rank === 1
                ? "rgba(251,191,36,.15)"
                : rank === 2
                  ? "rgba(180,180,180,.12)"
                  : "rgba(200,120,80,.12)",
            border: `1px solid ${rank === 1 ? "rgba(251,191,36,.4)" : rank === 2 ? "rgba(180,180,180,.3)" : "rgba(200,120,80,.3)"}`,
            color: rank === 1 ? "#fbbf24" : rank === 2 ? "#a0aec0" : "#c87840",
            letterSpacing: "0.1em",
            pointerEvents: "none",
          }}
        >
          #{rank}
        </div>
      )}

      {/* ✅ PLAY PREVIEW BUTTON — appears on hover */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(result);
          }}
          title="Preview video"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `${result.color}cc`,
            border: "none",
            color: "#fff",
            fontSize: "1.3rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 20px ${result.color}88`,
            transition: "all .15s",
            backdropFilter: "blur(4px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              "translate(-50%, -50%) scale(1.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
          }}
        >
          ▶
        </button>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            flexShrink: 0,
            border: `1.5px solid ${result.color}55`,
            background: `${result.color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: result.color,
            fontWeight: 900,
            fontSize: "1rem",
          }}
        >
          {result.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "0.88rem",
              fontWeight: 800,
              color: result.color,
              lineHeight: 1.2,
            }}
          >
            {result.name}
          </div>
          <div
            style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}
          >
            {(result.contentTypes || []).slice(0, 3).map((ct) => (
              <span
                key={ct}
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.52rem",
                  padding: "1px 5px",
                  border: `1px solid ${result.color}28`,
                  borderRadius: 99,
                  color: result.color + "aa",
                  whiteSpace: "nowrap",
                }}
              >
                {ct}
              </span>
            ))}
          </div>
        </div>
        <UserBadge count={result.monthlyUsers} />
      </div>

      {/* URL preview */}
      <div
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: "0.58rem",
          color: "var(--c-text4)",
          padding: "4px 8px",
          background: "rgba(0,0,0,.22)",
          borderRadius: 5,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {mainUrl}
      </div>

      {/* Actions */}
      <div
        style={{ display: "flex", gap: 5, alignItems: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => openUrl(mainUrl)}
          style={{
            flex: "1 1 auto",
            padding: "6px 12px",
            background: `${result.color}${hovered ? "28" : "18"}`,
            border: `1px solid ${result.color}${hovered ? "80" : "50"}`,
            borderRadius: 7,
            color: result.color,
            fontFamily: "var(--f-display)",
            fontWeight: 700,
            fontSize: "0.68rem",
            letterSpacing: "0.04em",
            transition: "all 150ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            cursor: "pointer",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          Search {result.name} <span style={{ fontSize: "0.8em" }}>→</span>
        </button>
        <button
          onClick={copyUrl}
          title="Copy URL"
          style={{
            padding: "6px 9px",
            flexShrink: 0,
            background: copied ? "rgba(0,255,136,.1)" : "rgba(255,255,255,.04)",
            border: `1px solid ${copied ? "rgba(0,255,136,.4)" : "rgba(255,255,255,.1)"}`,
            borderRadius: 7,
            color: copied ? "var(--c-green)" : "var(--c-text3)",
            fontSize: "0.72rem",
            transition: "all 150ms",
            cursor: "pointer",
          }}
        >
          {copied ? "✓" : "⎘"}
        </button>
        <button
          onClick={handleBookmark}
          title="Bookmark"
          style={{
            padding: "6px 9px",
            flexShrink: 0,
            background: bookmarked
              ? "rgba(251,191,36,.12)"
              : "rgba(255,255,255,.04)",
            border: `1px solid ${bookmarked ? "rgba(251,191,36,.5)" : "rgba(255,255,255,.1)"}`,
            borderRadius: 7,
            color: bookmarked ? "var(--c-gold)" : "var(--c-text3)",
            fontSize: "0.82rem",
            transition: "all 150ms",
            cursor: "pointer",
          }}
        >
          {bookmarked ? "★" : "☆"}
        </button>
        {extraUrls.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: "6px 9px",
              flexShrink: 0,
              background: expanded
                ? "rgba(0,212,255,.08)"
                : "rgba(255,255,255,.04)",
              border: `1px solid ${expanded ? "rgba(0,212,255,.3)" : "rgba(255,255,255,.1)"}`,
              borderRadius: 7,
              color: expanded ? "var(--c-cyan)" : "var(--c-text3)",
              fontFamily: "var(--f-display)",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              transition: "all 150ms",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {expanded ? "▲" : `+${extraUrls.length}`}
          </button>
        )}
      </div>

      {expanded && extraUrls.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            borderTop: "1px solid rgba(255,255,255,.06)",
            paddingTop: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {extraUrls.map(([type, url]) => (
            <button
              key={type}
              onClick={() => openUrl(url)}
              style={{
                padding: "4px 10px",
                background: "rgba(255,255,255,.04)",
                border: `1px solid ${result.color}30`,
                borderRadius: 99,
                color: result.color + "cc",
                fontFamily: "var(--f-display)",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "capitalize",
                transition: "all 150ms",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = result.color + "18";
                e.currentTarget.style.color = result.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.04)";
                e.currentTarget.style.color = result.color + "cc";
              }}
            >
              {type === "shorts"
                ? "📱"
                : type === "live"
                  ? "🔴"
                  : type === "channels"
                    ? "📺"
                    : type === "reels"
                      ? "🎬"
                      : type === "clips"
                        ? "✂️"
                        : type === "community"
                          ? "👥"
                          : "▸"}{" "}
              {type}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

// ── Posts / Videos / Trends tabs ─────────────────────────────────────────────
function ContentTabsSection({ query }) {
  const [activeTab, setActiveTab] = useState("videos");
  const [trendingData, setTrendingData] = useState([]);

  useEffect(() => {
    if (activeTab === "trends" && query) {
      searchAPI
        .getTrending({ limit: 12, period: "daily" })
        .then((res) => setTrendingData(res?.data?.data?.trending || []))
        .catch(() => {});
    }
  }, [activeTab, query]);

  const TABS = [
    { id: "videos", label: "🎬 Videos" },
    { id: "posts", label: "📝 Posts" },
    { id: "trends", label: "🔥 Trends" },
  ];

  // Sample video cards — in production these would come from a recommendations API
  const VIDEO_CARDS = [
    {
      platform: "YouTube",
      color: "#FF0000",
      icon: "▶",
      title: `${query} — Top Results`,
      channel: "YouTube Search",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      views: "4.2M views",
      duration: "5:32",
    },
    {
      platform: "Dailymotion",
      color: "#0066DC",
      icon: "◑",
      title: `${query} Videos`,
      channel: "Dailymotion",
      url: `https://www.dailymotion.com/search/${encodeURIComponent(query)}`,
      views: "812K views",
      duration: "3:18",
    },
    {
      platform: "Vimeo",
      color: "#1AB7EA",
      icon: "◎",
      title: `${query} — Creative Works`,
      channel: "Vimeo",
      url: `https://vimeo.com/search?q=${encodeURIComponent(query)}`,
      views: "291K views",
      duration: "7:44",
    },
    {
      platform: "Reddit",
      color: "#FF4500",
      icon: "◈",
      title: `r/${query.split(" ")[0]} — Video Posts`,
      channel: "Reddit",
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=video`,
      views: "128K views",
      duration: "2:10",
    },
    {
      platform: "Twitch",
      color: "#9146FF",
      icon: "♜",
      title: `${query} — Live Streams`,
      channel: "Twitch",
      url: `https://www.twitch.tv/search?term=${encodeURIComponent(query)}`,
      views: "Live Now",
      duration: "🔴 LIVE",
    },
    {
      platform: "TikTok",
      color: "#69C9D0",
      icon: "♪",
      title: `#${query.replace(/ /g, "")} TikToks`,
      channel: "TikTok",
      url: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
      views: "22M views",
      duration: "0:45",
    },
  ];

  const POST_CARDS = [
    {
      subreddit: `r/${query.split(" ")[0]}`,
      title: `What do you think about ${query}? [Discussion]`,
      upvotes: "8.4K",
      comments: "312",
      time: "3h ago",
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
      flair: "Discussion",
    },
    {
      subreddit: "r/videos",
      title: `Amazing ${query} video compilation — worth watching!`,
      upvotes: "14.2K",
      comments: "891",
      time: "6h ago",
      url: `https://www.reddit.com/r/videos/search?q=${encodeURIComponent(query)}`,
      flair: "Video",
    },
    {
      subreddit: "r/AskReddit",
      title: `What's the best ${query} content out there?`,
      upvotes: "3.1K",
      comments: "224",
      time: "9h ago",
      url: `https://www.reddit.com/r/AskReddit/search?q=${encodeURIComponent(query)}`,
      flair: "Question",
    },
    {
      subreddit: "r/trending",
      title: `${query} is trending today — here's everything you need to know`,
      upvotes: "22K",
      comments: "1.4K",
      time: "1h ago",
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&sort=top`,
      flair: "Trending",
    },
    {
      subreddit: "r/news",
      title: `Latest updates on ${query} [Megathread]`,
      upvotes: "9.7K",
      comments: "542",
      time: "2h ago",
      url: `https://www.reddit.com/r/news/search?q=${encodeURIComponent(query)}`,
      flair: "News",
    },
    {
      subreddit: "r/interestingasfuck",
      title: `TIL something fascinating about ${query}`,
      upvotes: "31K",
      comments: "2.1K",
      time: "4h ago",
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link`,
      flair: "TIL",
    },
  ];

  return (
    <div style={{ marginTop: 40 }}>
      {/* Divider */}
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(0,212,255,0.18), transparent)",
          marginBottom: 28,
        }}
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,.07)",
          paddingBottom: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 20px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--c-cyan)"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "var(--c-cyan)" : "var(--c-text3)",
              fontFamily: "var(--f-display)",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "all 150ms",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Videos Tab */}
      {activeTab === "videos" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {VIDEO_CARDS.map((v, i) => (
            <a
              key={i}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,.025)",
                  border: `1px solid rgba(255,255,255,.07)`,
                  borderLeft: `3px solid ${v.color}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 200ms",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.05)";
                  e.currentTarget.style.borderColor = v.color + "55";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.025)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.07)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {/* Thumbnail placeholder */}
                <div
                  style={{
                    height: 120,
                    borderRadius: 7,
                    background: `linear-gradient(135deg, ${v.color}18, #000)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 40, color: v.color }}>{v.icon}</span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "rgba(0,0,0,.75)",
                      color: "#fff",
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.6rem",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {v.duration}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-body)",
                    fontSize: "0.82rem",
                    color: "var(--c-text)",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {v.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--f-display)",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: v.color,
                    }}
                  >
                    {v.platform}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.6rem",
                      color: "var(--c-text4)",
                    }}
                  >
                    {v.views}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {POST_CARDS.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,.025)",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderLeft: "3px solid #FF4500",
                  borderRadius: 10,
                  padding: "14px 18px",
                  cursor: "pointer",
                  transition: "all 200ms",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,69,0,.04)";
                  e.currentTarget.style.borderColor = "#FF450055";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.025)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.07)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {/* Upvote col */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    flexShrink: 0,
                    minWidth: 36,
                  }}
                >
                  <span style={{ color: "#FF4500", fontSize: "0.85rem" }}>
                    ▲
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#FF4500",
                    }}
                  >
                    {post.upvotes}
                  </span>
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--f-display)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#FF4500",
                      }}
                    >
                      {post.subreddit}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.55rem",
                        color: "var(--c-text4)",
                      }}
                    >
                      · {post.time}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--f-display)",
                        fontSize: "0.52rem",
                        fontWeight: 700,
                        padding: "1px 7px",
                        background: "rgba(255,69,0,.1)",
                        border: "1px solid rgba(255,69,0,.25)",
                        borderRadius: 99,
                        color: "#FF6030",
                      }}
                    >
                      {post.flair}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-body)",
                      fontSize: "0.85rem",
                      color: "var(--c-text)",
                      lineHeight: 1.4,
                      marginBottom: 6,
                    }}
                  >
                    {post.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.6rem",
                      color: "var(--c-text4)",
                    }}
                  >
                    💬 {post.comments} comments
                  </div>
                </div>
              </div>
            </a>
          ))}
          <a
            href={`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px",
              fontFamily: "var(--f-display)",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#FF4500",
              textDecoration: "none",
              letterSpacing: "0.08em",
            }}
          >
            VIEW ALL REDDIT POSTS ↗
          </a>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === "trends" && (
        <div>
          {trendingData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "var(--c-text4)",
                fontFamily: "var(--f-mono)",
                fontSize: "0.75rem",
              }}
            >
              Loading trends...
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {trendingData.map((t, i) => (
                <a
                  key={i}
                  href={`/search?q=${encodeURIComponent(t.displayQuery || t.query)}&platform=all`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "rgba(255,255,255,.025)",
                      border: "1px solid rgba(255,255,255,.07)",
                      borderRadius: 10,
                      padding: "13px 16px",
                      cursor: "pointer",
                      transition: "all 200ms",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,212,255,.04)";
                      e.currentTarget.style.borderColor = "rgba(0,212,255,.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,.025)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,.07)";
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "rgba(0,212,255,.08)",
                        border: "1px solid rgba(0,212,255,.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "var(--c-cyan)",
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--f-body)",
                          fontSize: "0.82rem",
                          color: "var(--c-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.displayQuery || t.query}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.58rem",
                          color: "var(--c-text4)",
                          marginTop: 2,
                        }}
                      >
                        {t.dailyCount
                          ? `${t.dailyCount} searches today`
                          : "Trending"}
                        {t.score > 500 ? " 🔥" : " 📈"}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformFilterBar({ active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        padding: "2px 0 8px",
        scrollbarWidth: "none",
      }}
    >
      {PLATFORM_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          style={{
            padding: "5px 13px",
            borderRadius: 99,
            whiteSpace: "nowrap",
            flexShrink: 0,
            background:
              active === cat.id
                ? "rgba(0,212,255,.14)"
                : "rgba(255,255,255,.04)",
            border: `1px solid ${active === cat.id ? "rgba(0,212,255,.55)" : "rgba(255,255,255,.1)"}`,
            color: active === cat.id ? "var(--c-cyan)" : "var(--c-text3)",
            fontFamily: "var(--f-display)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            transition: "all 150ms",
            cursor: "pointer",
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

function SearchStats({ results, query, elapsed }) {
  const totalUsers = results.reduce(
    (s, r) => s + parseUsers(r.monthlyUsers),
    0,
  );
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 16px",
        background: "rgba(0,212,255,.04)",
        border: "1px solid rgba(0,212,255,.12)",
        borderRadius: 8,
        fontFamily: "var(--f-mono)",
        fontSize: "0.7rem",
        color: "var(--c-text3)",
      }}
    >
      <span>
        ⬡ <strong style={{ color: "var(--c-cyan)" }}>{results.length}</strong>{" "}
        platforms
      </span>
      <span>
        👥{" "}
        <strong style={{ color: "var(--c-text)" }}>
          {fmtUsers(totalUsers)}
        </strong>{" "}
        potential reach
      </span>
      {elapsed && (
        <span>
          ⚡ <strong style={{ color: "var(--c-green)" }}>{elapsed}ms</strong>
        </span>
      )}
      <span style={{ marginLeft: "auto", opacity: 0.6 }}>
        Press{" "}
        <kbd
          style={{
            padding: "1px 5px",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 3,
            fontFamily: "inherit",
          }}
        >
          /
        </kbd>{" "}
        to search
      </span>
    </div>
  );
}

// ── Main SearchPage ───────────────────────────────────────────────────────────
export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { results, loading, lastSearch, related, search, openAll } =
    useSearch();
  const [searched, setSearched] = useState(false);
  const [openingAll, setOpeningAll] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [catFilter, setCatFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [elapsed, setElapsed] = useState(null);
  const [hiddenPlatforms, setHiddenPlatforms] = useState([]);
  const [feedQuery, setFeedQuery] = useState("");
  const [feedAvailable, setFeedAvailable] = useState(false);
  // ✅ NEW: preview modal state
  const [previewResult, setPreviewResult] = useState(null);
  const startRef = useRef(null);

  const initialQ = params.get("q") || "";
  const initialP = params.get("platform") || "all";
  const initialCT = params.get("ct") || "all";
  const initialQRef = useRef(initialQ);
  const initialPRef = useRef(initialP);
  const initialCTRef = useRef(initialCT);
  const searchRef = useRef(search);
  initialQRef.current = initialQ;
  initialPRef.current = initialP;
  initialCTRef.current = initialCT;
  searchRef.current = search;

  useEffect(() => {
    const q = initialQRef.current;
    const p = initialPRef.current;
    const ct = initialCTRef.current;
    if (q) {
      startRef.current = Date.now();
      searchRef
        .current({ query: q, platform: p, contentType: ct })
        .then((data) => {
          if (data) {
            setSearched(true);
            setElapsed(Date.now() - startRef.current);
            setFeedQuery(q);
            setFeedAvailable(false);
          }
        });
    }
    const handler = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        e.preventDefault();
        document.querySelector("input[placeholder]")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    (data) => {
      setSearched(true);
      setCatFilter("all");
      setElapsed(Date.now() - startRef.current);
      setFeedQuery(data.query);
      setFeedAvailable(false);
      navigate(
        `/search?q=${encodeURIComponent(data.query)}&platform=${data.platform}`,
        { replace: true },
      );
    },
    [navigate],
  );

  const handleOpenAll = () => {
    setOpeningAll(true);
    const toOpen = filteredResults.filter(
      (r) => !hiddenPlatforms.includes(r.platform),
    );
    openAll(toOpen);
    setTimeout(() => setOpeningAll(false), toOpen.length * 140 + 800);
  };

  const handleBookmark = async (result) => {
    if (!user) {
      toast.error("Login to save bookmarks");
      return;
    }
    try {
      await bookmarksAPI.create({
        title: `${result.name} — "${lastSearch?.query}"`,
        url: result.mainUrl,
        platform: result.platform,
      });
      toast.success("Saved to bookmarks ★", { icon: "★" });
    } catch {
      toast.error("Failed to save");
    }
  };

  const filteredResults = results
    .filter((r) => catFilter === "all" || r.category === catFilter)
    .filter((r) => !hiddenPlatforms.includes(r.platform))
    .sort((a, b) => {
      if (sortBy === "users")
        return parseUsers(b.monthlyUsers) - parseUsers(a.monthlyUsers);
      if (sortBy === "az") return a.name.localeCompare(b.name);
      return 0;
    });

  const gridCols =
    viewMode === "compact"
      ? "repeat(auto-fill,minmax(220px,1fr))"
      : viewMode === "list"
        ? "1fr"
        : "repeat(auto-fill,minmax(280px,1fr))";

  return (
    <div
      style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 24px 100px" }}
    >
      {/* ✅ Preview Modal */}
      {previewResult && (
        <PreviewModal
          result={previewResult}
          onClose={() => setPreviewResult(null)}
        />
      )}

      {/* Sticky search bar */}
      <div
        style={{
          position: "sticky",
          top: 60,
          zIndex: 800,
          background: "rgba(3,7,15,.92)",
          backdropFilter: "blur(20px)",
          padding: "14px 0 12px",
          marginBottom: 32,
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <SearchBar
          defaultQuery={initialQ}
          defaultPlatform={initialP}
          defaultContentType={initialCT}
          onSearch={(data) => {
            startRef.current = Date.now();
            handleSearch(data);
          }}
          showFilters
        />
      </div>

      {/* Loading spinner */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "100px 0",
            gap: 20,
          }}
        >
          <div style={{ position: "relative", width: 60, height: 60 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(0,212,255,.08)",
                borderTop: "2px solid var(--c-cyan)",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: "50%",
                border: "2px solid rgba(0,212,255,.04)",
                borderBottom: "2px solid rgba(0,212,255,.5)",
                animation: "spin 1.2s linear infinite reverse",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--c-cyan)",
                fontSize: "1.1rem",
              }}
            >
              ⬡
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.78rem",
              color: "var(--c-text3)",
              letterSpacing: "0.25em",
            }}
          >
            SEARCHING PLATFORMS...
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 500,
            }}
          >
            {PLATFORMS.filter((p) => p.id !== "all")
              .slice(0, 8)
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "3px 10px",
                    background: p.color + "12",
                    border: `1px solid ${p.color}35`,
                    borderRadius: 99,
                    color: p.color,
                    fontFamily: "var(--f-display)",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    animation: "pulse 1.5s ease infinite",
                  }}
                >
                  {p.icon} {p.name}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <SearchStats
              results={results}
              query={lastSearch?.query}
              elapsed={elapsed}
            />
          </div>

          {/* Controls row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 800,
                fontSize: "1.1rem",
              }}
            >
              "
              <span style={{ color: "var(--c-cyan)" }}>
                {lastSearch?.query}
              </span>
              "
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.7rem",
                  color: "var(--c-text3)",
                  marginLeft: 10,
                  fontWeight: 400,
                }}
              >
                {filteredResults.length} result
                {filteredResults.length !== 1 ? "s" : ""}
                {catFilter !== "all" &&
                  ` · ${PLATFORM_CATEGORIES.find((c) => c.id === catFilter)?.label}`}
                {hiddenPlatforms.length > 0 &&
                  ` · ${hiddenPlatforms.length} hidden`}
              </span>
            </h2>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "6px 10px",
                  fontSize: "0.7rem",
                  borderRadius: 6,
                  minWidth: 130,
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border2)",
                  borderRadius: 6,
                  padding: 3,
                }}
              >
                {[
                  { id: "grid", icon: "⊞" },
                  { id: "list", icon: "☰" },
                  { id: "compact", icon: "⊟" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 4,
                      fontSize: "0.82rem",
                      background:
                        viewMode === v.id
                          ? "rgba(0,212,255,.14)"
                          : "transparent",
                      border: `1px solid ${viewMode === v.id ? "rgba(0,212,255,.4)" : "transparent"}`,
                      color:
                        viewMode === v.id ? "var(--c-cyan)" : "var(--c-text3)",
                      cursor: "pointer",
                    }}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>
              {hiddenPlatforms.length > 0 && (
                <button
                  onClick={() => setHiddenPlatforms([])}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(255,51,102,.1)",
                    border: "1px solid rgba(255,51,102,.3)",
                    borderRadius: 6,
                    color: "#ff3366",
                    fontFamily: "var(--f-display)",
                    fontSize: "0.63rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  SHOW {hiddenPlatforms.length} HIDDEN
                </button>
              )}
              <button
                onClick={handleOpenAll}
                disabled={openingAll}
                style={{
                  padding: "7px 18px",
                  background: openingAll
                    ? "rgba(0,212,255,.1)"
                    : "linear-gradient(135deg,var(--c-cyan),#0080ff)",
                  color: openingAll ? "var(--c-cyan)" : "#000",
                  border: openingAll ? "1px solid rgba(0,212,255,.3)" : "none",
                  borderRadius: 6,
                  fontFamily: "var(--f-display)",
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  boxShadow: openingAll
                    ? "none"
                    : "0 4px 16px rgba(0,212,255,.35)",
                  transition: "all 200ms",
                  cursor: openingAll ? "default" : "pointer",
                }}
              >
                {openingAll
                  ? "🚀 Opening..."
                  : `🚀 Open All ${filteredResults.length}`}
              </button>
            </div>
          </div>

          {/* Category filter */}
          <div style={{ marginBottom: 20 }}>
            <PlatformFilterBar active={catFilter} onChange={setCatFilter} />
          </div>

          {/* Related queries */}
          {related.length > 0 && (
            <div
              style={{
                marginBottom: 22,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--f-display)",
                  fontSize: "0.55rem",
                  color: "var(--c-text4)",
                  letterSpacing: "0.2em",
                }}
              >
                RELATED:
              </span>
              {related.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    startRef.current = Date.now();
                    search({ query: r, platform: initialP }).then((d) => {
                      if (d) {
                        setSearched(true);
                        setFeedQuery(r);
                        setFeedAvailable(false);
                      }
                    });
                    navigate(
                      `/search?q=${encodeURIComponent(r)}&platform=${initialP}`,
                      { replace: true },
                    );
                  }}
                  style={{
                    padding: "4px 11px",
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border2)",
                    borderRadius: 99,
                    color: "var(--c-text2)",
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.7rem",
                    transition: "all 150ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--c-cyan)";
                    e.currentTarget.style.borderColor = "rgba(0,212,255,.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--c-text2)";
                    e.currentTarget.style.borderColor = "var(--c-border2)";
                  }}
                >
                  ↗ {r}
                </button>
              ))}
            </div>
          )}

          {/* Platform results grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              gap: viewMode === "list" ? 8 : 12,
            }}
          >
            {filteredResults.map((r, i) => (
              <ResultCard
                key={r.platform}
                result={r}
                query={lastSearch?.query}
                onBookmark={handleBookmark}
                rank={i + 1}
                onPreview={setPreviewResult}
              />
            ))}
          </div>

          {/* Quick hide bar */}
          <div
            style={{
              marginTop: 28,
              padding: "14px 18px",
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontSize: "0.58rem",
                letterSpacing: "0.2em",
                color: "var(--c-text4)",
                marginBottom: 10,
              }}
            >
              QUICK HIDE PLATFORMS
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {results.map((r) => (
                <button
                  key={r.platform}
                  onClick={() =>
                    setHiddenPlatforms((p) =>
                      p.includes(r.platform)
                        ? p.filter((x) => x !== r.platform)
                        : [...p, r.platform],
                    )
                  }
                  style={{
                    padding: "3px 10px",
                    borderRadius: 99,
                    fontSize: "0.65rem",
                    fontFamily: "var(--f-mono)",
                    transition: "all 150ms",
                    cursor: "pointer",
                    background: hiddenPlatforms.includes(r.platform)
                      ? "rgba(255,51,102,.1)"
                      : r.color + "12",
                    border: `1px solid ${hiddenPlatforms.includes(r.platform) ? "rgba(255,51,102,.35)" : r.color + "40"}`,
                    color: hiddenPlatforms.includes(r.platform)
                      ? "#ff6080"
                      : r.color,
                    textDecoration: hiddenPlatforms.includes(r.platform)
                      ? "line-through"
                      : "none",
                  }}
                >
                  {r.icon} {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Save search */}
          {user && lastSearch?.query && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={async () => {
                  await usersAPI.saveSearch({
                    query: lastSearch.query,
                    platform: lastSearch.platform,
                  });
                  toast.success("Search saved!");
                }}
                style={{
                  padding: "7px 16px",
                  background: "transparent",
                  border: "1px solid rgba(0,212,255,.25)",
                  borderRadius: 6,
                  color: "rgba(0,212,255,.6)",
                  fontFamily: "var(--f-display)",
                  fontSize: "0.63rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  transition: "all 150ms",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--c-cyan)";
                  e.currentTarget.style.color = "var(--c-cyan)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,212,255,.25)";
                  e.currentTarget.style.color = "rgba(0,212,255,.6)";
                }}
              >
                + SAVE THIS SEARCH
              </button>
            </div>
          )}

          {lastSearch?.enhancedQuery && (
            <div
              style={{
                marginTop: 18,
                padding: "10px 14px",
                background: "rgba(124,58,237,.06)",
                border: "1px solid rgba(124,58,237,.2)",
                borderRadius: 8,
                fontFamily: "var(--f-mono)",
                fontSize: "0.73rem",
                color: "var(--c-text2)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span>💡</span>
              <span>
                Query enhanced to: "
                <strong style={{ color: "var(--c-accent2)" }}>
                  {lastSearch.enhancedQuery}
                </strong>
                "
              </span>
            </div>
          )}

          {/* ✅ NEW: Posts / Videos / Trends tabs section */}
          {feedQuery && <ContentTabsSection query={feedQuery} />}

          {/* Recommendation feed (kept for backwards compat) */}
          {feedQuery && (
            <div style={{ marginTop: 40 }}>
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(0,212,255,0.1), transparent)",
                  marginBottom: 28,
                }}
              />
              <RecommendationFeed
                key={feedQuery}
                query={feedQuery}
                platform={
                  initialP !== "all"
                    ? initialP
                    : "youtube,reddit,dailymotion,vimeo"
                }
                title="🎬 Recommended — More Content"
                limit={8}
                showFilters
              />
            </div>
          )}
        </>
      )}

      {/* Pre-search discover state */}
      {!loading && !searched && (
        <div style={{ textAlign: "center", padding: "80px 0 40px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 20, opacity: 0.3 }}>
            ⌕
          </div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "1.1rem",
              color: "var(--c-text3)",
              marginBottom: 12,
            }}
          >
            Ready to Search
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.75rem",
              color: "var(--c-text4)",
              letterSpacing: "0.1em",
            }}
          >
            Press{" "}
            <kbd
              style={{
                padding: "2px 6px",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 4,
                fontFamily: "inherit",
              }}
            >
              /
            </kbd>{" "}
            to focus search
          </div>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              "viral shorts 2025",
              "AI tutorials",
              "live gaming streams",
              "travel vlogs",
            ].map((s) => (
              <button
                key={s}
                onClick={() => {
                  startRef.current = Date.now();
                  search({ query: s, platform: "all" }).then((d) => {
                    if (d) {
                      setSearched(true);
                      setFeedQuery(s);
                      setFeedAvailable(false);
                      navigate(
                        `/search?q=${encodeURIComponent(s)}&platform=all`,
                        { replace: true },
                      );
                    }
                  });
                }}
                style={{
                  padding: "8px 16px",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: 99,
                  color: "var(--c-text2)",
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.76rem",
                  transition: "all 150ms",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,212,255,.4)";
                  e.currentTarget.style.color = "var(--c-cyan)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--c-border)";
                  e.currentTarget.style.color = "var(--c-text2)";
                }}
              >
                ↗ {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

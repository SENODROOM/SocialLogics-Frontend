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

/* ── Compact pill-style user count badge (like YouTube 6.7K+) ── */
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

function ResultCard({ result, query, onBookmark, rank }) {
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
      {/* Top rank badge */}
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

      {/* Header row: icon + name + user count */}
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
          {/* Content type pills — small like YouTube chips */}
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

        {/* Monthly users — compact badge on the right */}
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

      {/* Action row — compact buttons, NOT full-width */}
      <div
        style={{ display: "flex", gap: 5, alignItems: "center" }}
        onClick={(e) => e.stopPropagation()} // prevent card click
      >
        {/* Primary search button — compact, not full-width */}
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

        {/* Copy button */}
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
            flexShrink: 0,
          }}
        >
          {copied ? "✓" : "⎘"}
        </button>

        {/* Bookmark button */}
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
            flexShrink: 0,
          }}
        >
          {bookmarked ? "★" : "☆"}
        </button>

        {/* More/less toggle */}
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

      {/* Sub-URL chips — appear when expanded */}
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
  // FIX: track if content previews are available so we don't show a broken section
  const [feedAvailable, setFeedAvailable] = useState(false);
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
            setFeedAvailable(false); // reset until feed reports success
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

          {/* ── Content recommendation feed ──
              FIX: Only mount after first search, and pass onLoad/onError callbacks
              so we know if real data is available before showing the section.
              "No preview available" now only shows inside the feed component itself
              when it genuinely has no data — we don't render the section header
              unless feedAvailable becomes true OR the feed reports an honest empty state.
          */}
          {feedQuery && (
            <div style={{ marginTop: 52 }}>
              <div
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(0,212,255,0.18), transparent)",
                  marginBottom: 36,
                }}
              />
              {/* 
                Pass onLoad so if the feed gets actual results we show it properly,
                and it self-hides when nothing comes back by checking its own state.
              */}
              <RecommendationFeed
                key={
                  feedQuery
                } /* remount on new query to reset internal state */
                query={feedQuery}
                platform={
                  initialP !== "all"
                    ? initialP
                    : "youtube,reddit,dailymotion,vimeo"
                }
                title="🎬 Content Previews — Videos, Reels & Posts"
                limit={8}
                showFilters
              />
            </div>
          )}
        </>
      )}

      {/* Pre-search discover state */}
      {!loading && !searched && (
        <>
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
        </>
      )}
    </div>
  );
}

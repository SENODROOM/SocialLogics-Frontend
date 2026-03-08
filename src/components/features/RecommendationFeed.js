/**
 * RecommendationFeed.js
 *
 * TRUE infinite scroll — like YouTube:
 * - Fetches page 1 on mount
 * - When user scrolls to bottom, fetches page 2, 3, 4... from backend
 * - Each page uses a varied query (e.g. "cats best", "cats trending", "cats 2024")
 *   so results are always fresh and different — never "end of results"
 * - New cards append below existing ones
 * - Deduplicates by item ID across pages
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { bookmarksAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ─── Platform metadata ────────────────────────────────────────────────────────
const PLAT = {
  youtube: {
    color: "#FF0000",
    bg: "rgba(255,0,0,0.12)",
    label: "YouTube",
    icon: "▶",
    typeLabel: "Video",
  },
  reddit: {
    color: "#FF4500",
    bg: "rgba(255,69,0,0.12)",
    label: "Reddit",
    icon: "◍",
    typeLabel: "Post",
  },
  vimeo: {
    color: "#1AB7EA",
    bg: "rgba(26,183,234,0.12)",
    label: "Vimeo",
    icon: "◐",
    typeLabel: "Video",
  },
  dailymotion: {
    color: "#0066DC",
    bg: "rgba(0,102,220,0.12)",
    label: "Dailymotion",
    icon: "◉",
    typeLabel: "Video",
  },
  twitch: {
    color: "#9146FF",
    bg: "rgba(145,70,255,0.12)",
    label: "Twitch",
    icon: "◈",
    typeLabel: "Live",
  },
  tiktok: {
    color: "#69C9D0",
    bg: "rgba(105,201,208,0.12)",
    label: "TikTok",
    icon: "♪",
    typeLabel: "Short",
  },
  instagram: {
    color: "#E1306C",
    bg: "rgba(225,48,108,0.12)",
    label: "Instagram",
    icon: "◎",
    typeLabel: "Reel",
  },
};
const TYPE_ICONS = {
  video: "▶",
  short: "📱",
  reel: "🎬",
  live: "🔴",
  post: "📄",
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          paddingTop: "56.25%",
          background:
            "linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)",
          backgroundSize: "200% 100%",
          animation: "sl-shimmer 1.4s ease infinite",
        }}
      />
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            height: 12,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 4,
            width: "82%",
          }}
        />
        <div
          style={{
            height: 10,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 4,
            width: "50%",
          }}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <div
            style={{
              height: 18,
              width: 55,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 99,
            }}
          />
          <div
            style={{
              height: 18,
              width: 36,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Embed preview ────────────────────────────────────────────────────────────
function PreviewEmbed({ embedUrl, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        background: "#000",
        borderRadius: "inherit",
        overflow: "hidden",
      }}
    >
      <iframe
        src={embedUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Preview"
        loading="lazy"
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,.8)",
          border: "1px solid rgba(255,255,255,.3)",
          borderRadius: "50%",
          width: 28,
          height: 28,
          color: "#fff",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 11,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function RecommendationCard({ item, compact, onBookmark }) {
  const [hovered, setHovered] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const holdTimer = useRef(null);

  const p = PLAT[item.platform] || {
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.1)",
    label: item.platform,
    icon: "⬡",
    typeLabel: "Content",
  };

  const onEnter = () => {
    setHovered(true);
    if (item.previewable && item.embedUrl)
      holdTimer.current = setTimeout(() => setPreviewing(true), 900);
  };
  const onLeave = () => {
    setHovered(false);
    clearTimeout(holdTimer.current);
    setTimeout(() => setPreviewing(false), 300);
  };
  const onBm = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) return;
    setBookmarked(true);
    await onBookmark(item);
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        style={{
          background: hovered
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.025)",
          border: `1px solid ${hovered ? p.color + "55" : "rgba(255,255,255,0.07)"}`,
          borderTop: `2px solid ${hovered ? p.color : p.color + "35"}`,
          borderRadius: 12,
          overflow: "hidden",
          transition: "all 200ms cubic-bezier(.16,1,.3,1)",
          transform: hovered ? "translateY(-4px)" : "none",
          boxShadow: hovered
            ? `0 16px 40px ${p.color}18,0 4px 16px rgba(0,0,0,.4)`
            : "0 2px 8px rgba(0,0,0,.2)",
          position: "relative",
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingTop: compact ? "52%" : "56.25%",
            overflow: "hidden",
            background: "#080e1a",
          }}
        >
          {previewing && item.embedUrl ? (
            <PreviewEmbed
              embedUrl={item.embedUrl}
              onClose={() => setPreviewing(false)}
            />
          ) : (
            <>
              {item.thumbnail && !imgError ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  onError={() => setImgError(true)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 350ms ease",
                    transform: hovered ? "scale(1.06)" : "scale(1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg,${p.color}14,rgba(0,0,0,.5))`,
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: "2rem", opacity: 0.35 }}>
                    {p.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.58rem",
                      color: p.color,
                      opacity: 0.5,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {p.label.toUpperCase()}
                  </span>
                </div>
              )}
              {hovered && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,.3)",
                  }}
                >
                  {item.previewable ? (
                    <div
                      style={{
                        background: "rgba(0,0,0,.85)",
                        border: `2px solid ${p.color}`,
                        borderRadius: "50%",
                        width: 46,
                        height: 46,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: p.color,
                        fontSize: "1.1rem",
                        boxShadow: `0 0 24px ${p.color}50`,
                      }}
                    >
                      ▶
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "rgba(0,0,0,.7)",
                        border: `1px solid ${p.color}60`,
                        borderRadius: 8,
                        padding: "5px 14px",
                        color: p.color,
                        fontSize: "0.65rem",
                        fontFamily: "var(--f-display)",
                        fontWeight: 700,
                      }}
                    >
                      OPEN →
                    </div>
                  )}
                </div>
              )}
              {hovered && item.previewable && !previewing && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 7,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.52rem",
                    color: "rgba(255,255,255,.45)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  hold to preview
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: p.bg,
                  border: `1px solid ${p.color}45`,
                  borderRadius: 99,
                  padding: "2px 8px",
                  fontFamily: "var(--f-display)",
                  fontSize: "0.54rem",
                  fontWeight: 700,
                  color: p.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span>{TYPE_ICONS[item.type] || p.icon}</span>
                <span>{p.typeLabel.toUpperCase()}</span>
              </div>
              {item.duration && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    background: "rgba(0,0,0,.85)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.62rem",
                    color: "#fff",
                  }}
                >
                  {item.duration}
                </div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: compact ? "10px 12px 12px" : "12px 14px 14px" }}>
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: compact ? "0.74rem" : "0.81rem",
              color: hovered ? "#fff" : "var(--c-text)",
              lineHeight: 1.4,
              marginBottom: 7,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              transition: "color .12s",
            }}
          >
            {item.title || "Untitled"}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "var(--f-display)",
                fontSize: "0.57rem",
                fontWeight: 700,
                color: p.color,
                background: p.bg,
                padding: "2px 7px",
                borderRadius: 99,
                border: `1px solid ${p.color}35`,
              }}
            >
              {p.icon} {p.label}
            </span>
            {item.author && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.58rem",
                  color: "var(--c-text4)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 110,
                }}
              >
                {item.author}
              </span>
            )}
            {item.subreddit && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.58rem",
                  color: "#FF4500",
                  opacity: 0.75,
                }}
              >
                {item.subreddit}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {item.views && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.58rem",
                  color: "var(--c-text4)",
                }}
              >
                👁 {item.views}
              </span>
            )}
            {item.votes && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.58rem",
                  color: "var(--c-text4)",
                }}
              >
                ▲ {item.votes}
              </span>
            )}
            {item.comments && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.58rem",
                  color: "var(--c-text4)",
                }}
              >
                💬 {item.comments}
              </span>
            )}
            {item.timeAgo && (
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.58rem",
                  color: "var(--c-text4)",
                  marginLeft: "auto",
                }}
              >
                {item.timeAgo}
              </span>
            )}
            <button
              onClick={onBm}
              title={bookmarked ? "Saved" : "Bookmark"}
              style={{
                background: bookmarked ? "rgba(251,191,36,.15)" : "transparent",
                border: `1px solid ${bookmarked ? "rgba(251,191,36,.5)" : "rgba(255,255,255,.1)"}`,
                borderRadius: 4,
                padding: "2px 7px",
                marginLeft: item.timeAgo ? 0 : "auto",
                color: bookmarked ? "var(--c-gold,#fbbf24)" : "var(--c-text4)",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              {bookmarked ? "★" : "☆"}
            </button>
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Platform filter tabs ─────────────────────────────────────────────────────
function PlatformTabs({ available, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        overflowX: "auto",
        paddingBottom: 4,
        scrollbarWidth: "none",
      }}
    >
      {["all", ...available].map((pid) => {
        const p =
          pid === "all"
            ? { color: "var(--c-cyan)", label: "All", icon: "⬡" }
            : PLAT[pid] || { color: "#00d4ff", label: pid, icon: "⬡" };
        const on = active === pid;
        return (
          <button
            key={pid}
            onClick={() => onChange(pid)}
            style={{
              padding: "5px 13px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: on ? `${p.color}1a` : "rgba(255,255,255,.04)",
              border: `1px solid ${on ? p.color + "60" : "rgba(255,255,255,.08)"}`,
              color: on ? p.color : "var(--c-text3)",
              fontFamily: "var(--f-display)",
              fontSize: "0.68rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 130ms",
            }}
          >
            {p.icon} {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── YouTube-style bottom spinner ─────────────────────────────────────────────
function BottomSpinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        padding: "32px 0",
        color: "var(--c-text4)",
        fontFamily: "var(--f-mono)",
        fontSize: "0.68rem",
        letterSpacing: "0.14em",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid rgba(0,212,255,.15)",
          borderTop: "2px solid var(--c-cyan)",
          animation: "sl-spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
      Loading more videos...
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RecommendationFeed({
  query,
  platform = "all",
  title = "🎬 Recommended",
  compact = false,
  showFilters = true,
  style: extraStyle,
}) {
  const [items, setItems] = useState([]); // all appended items
  const [seenIds, setSeenIds] = useState(new Set()); // dedup tracker
  const [byPlatform, setByPlatform] = useState({}); // for tab filter
  const [page, setPage] = useState(0); // 0 = not started
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [activePlatform, setActivePlatform] = useState("all");
  const [lastQuery, setLastQuery] = useState(null);

  const { user } = useAuth();
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const loadingRef = useRef(false); // ref mirror so observer callback never reads stale state
  const pageRef = useRef(0);
  const queryRef = useRef(null);
  const platformRef = useRef("all");

  // ── Fetch a single page and append results ────────────────────────────────
  const fetchPage = useCallback(async (q, plat, pageNum) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const isFirst = pageNum === 1;
    if (isFirst) setInitialLoading(true);
    else setLoadingMore(true);

    try {
      // Call the API — page param goes to backend which uses varied queries
      const params = new URLSearchParams({
        q,
        platform: plat,
        limit: "12",
        page: String(pageNum),
      });
      const res = await fetch(`/api/recommendations?${params}`, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("sl_token")
            ? { Authorization: `Bearer ${localStorage.getItem("sl_token")}` }
            : {}),
        },
      });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      const data = json.data || {};
      const newFlat = data.flat || [];
      const newByPlat = data.byPlatform || {};

      setItems((prev) => {
        setSeenIds((ids) => {
          const next = new Set(ids);
          const fresh = newFlat.filter((item) => !next.has(item.id));
          fresh.forEach((item) => next.add(item.id));
          // Append fresh items to the list
          // (we return prev+fresh from inside the setSeenIds callback trick)
          return next;
        });
        // Compute fresh items using seenIds snapshot — use functional update with ref
        const fresh = newFlat.filter(
          (item) => !seenIdsRef.current.has(item.id),
        );
        return isFirst ? fresh : [...prev, ...fresh];
      });

      // Merge byPlatform
      setByPlatform((prev) => {
        const merged = { ...prev };
        for (const [pid, pItems] of Object.entries(newByPlat)) {
          merged[pid] = isFirst ? pItems : [...(prev[pid] || []), ...pItems];
        }
        return isFirst ? newByPlat : merged;
      });

      setError(null);
    } catch (err) {
      if (isFirst)
        setError("Could not load recommendations. Is your backend running?");
    } finally {
      if (isFirst) setInitialLoading(false);
      else setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a ref to seenIds for use inside setItems callback
  const seenIdsRef = useRef(new Set());
  useEffect(() => {
    seenIdsRef.current = seenIds;
  }, [seenIds]);

  // ── Reset and fetch page 1 when query changes ─────────────────────────────
  useEffect(() => {
    if (!query || query === lastQuery) return;

    // Reset all state for new query
    setItems([]);
    setSeenIds(new Set());
    seenIdsRef.current = new Set();
    setByPlatform({});
    setPage(1);
    setActivePlatform("all");
    setError(null);
    setLastQuery(query);
    pageRef.current = 1;
    queryRef.current = query;
    platformRef.current = platform;

    fetchPage(query, platform, 1);
  }, [query, platform, lastQuery, fetchPage]);

  // ── IntersectionObserver: load next page when sentinel enters viewport ────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loadingRef.current) return;
        if (!queryRef.current) return;

        // Load next page
        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        setPage(nextPage);
        fetchPage(queryRef.current, platformRef.current, nextPage);
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 400px 0px", // trigger 400px early — feels instant
      },
    );

    observerRef.current.observe(sentinel);
    return () => observerRef.current?.disconnect();
  }, [items.length, fetchPage]); // Re-bind when items change so sentinel is in DOM

  // ── Bookmark ──────────────────────────────────────────────────────────────
  const handleBookmark = useCallback(
    async (item) => {
      if (!user) {
        toast.error("Login to save bookmarks");
        return;
      }
      try {
        await bookmarksAPI.create({
          title: item.title,
          url: item.url,
          platform: item.platform,
          thumbnail: item.thumbnail || "",
          description: item.author ? `By ${item.author}` : "",
        });
        toast.success("Saved ★", { icon: "★" });
      } catch {
        toast.error("Failed to save");
      }
    },
    [user],
  );

  // ── Derive display list ───────────────────────────────────────────────────
  const displayItems =
    activePlatform === "all" ? items : byPlatform[activePlatform] || [];
  const availablePlatforms = Object.keys(byPlatform);
  const gridCols = compact
    ? "repeat(auto-fill,minmax(190px,1fr))"
    : "repeat(auto-fill,minmax(255px,1fr))";

  // ── Don't render if no query or empty first load ──────────────────────────
  if (!query) return null;
  if (!initialLoading && lastQuery && !error && items.length === 0) return null;

  return (
    <section style={{ marginBottom: 48, ...extraStyle }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "0.65rem",
              letterSpacing: "0.28em",
              color: "var(--c-text3)",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          <div
            style={{
              height: 1,
              width: 60,
              background:
                "linear-gradient(90deg,rgba(0,212,255,.2),transparent)",
            }}
          />
        </div>
        {items.length > 0 && (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.6rem",
              color: "var(--c-text4)",
            }}
          >
            {displayItems.length} videos
          </span>
        )}
      </div>

      {/* Platform tabs */}
      {showFilters && !initialLoading && availablePlatforms.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <PlatformTabs
            available={availablePlatforms}
            active={activePlatform}
            onChange={(p) => setActivePlatform(p)}
          />
        </div>
      )}

      {/* Initial skeleton */}
      {initialLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: compact ? 10 : 14,
          }}
        >
          {Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !initialLoading && (
        <div
          style={{
            padding: "18px 20px",
            textAlign: "center",
            background: "rgba(255,255,255,.02)",
            border: "1px dashed rgba(255,255,255,.08)",
            borderRadius: 10,
            fontFamily: "var(--f-mono)",
            fontSize: "0.74rem",
            color: "var(--c-text4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <span style={{ opacity: 0.5 }}>⚠</span>
          <span>{error}</span>
          <button
            onClick={() => {
              setLastQuery(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--c-cyan)",
              fontFamily: "inherit",
              fontSize: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              marginLeft: 4,
            }}
          >
            retry
          </button>
        </div>
      )}

      {/* Cards grid */}
      {!initialLoading && !error && displayItems.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: compact ? 10 : 14,
          }}
        >
          {displayItems.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              compact={compact}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
      )}

      {/* ── Infinite scroll zone ── */}
      {!initialLoading && !error && displayItems.length > 0 && (
        <>
          {/* YouTube-style spinner while next page loads */}
          {loadingMore && <BottomSpinner />}

          {/* Sentinel — IntersectionObserver watches this */}
          <div
            ref={sentinelRef}
            style={{ height: 4, marginTop: 20 }}
            aria-hidden="true"
          />
        </>
      )}

      <style>{`
        @keyframes sl-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes sl-spin    { to   { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

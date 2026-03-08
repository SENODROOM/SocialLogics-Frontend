/**
 * RecommendationFeed.js
 * Displays content recommendations (videos, reels, posts) from real platform data.
 * - Hover-to-play embeds (YouTube / Vimeo / Dailymotion) after 900ms hold
 * - Platform filter tabs, skeleton loaders, optimistic bookmark
 * - FIX: sets fetchedQuery on both success AND failure so retries don't loop
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { recommendationsAPI, bookmarksAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ── Platform metadata ─────────────────────────────────────────────────────────
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

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        overflow: "hidden",
        animation: "shimmer 1.6s ease infinite",
      }}
    >
      <div
        style={{
          width: "100%",
          paddingTop: "56.25%",
          background:
            "linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s ease infinite",
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

// ── Embed preview (iframe on hover) ───────────────────────────────────────────
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
        title="Video preview"
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
          background: "rgba(0,0,0,0.75)",
          border: "1px solid rgba(255,255,255,0.3)",
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

// ── Recommendation card ───────────────────────────────────────────────────────
function RecommendationCard({ item, compact, onBookmarkItem }) {
  const [hovered, setHovered] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const hoverTimer = useRef(null);
  const p = PLAT[item.platform] || {
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.1)",
    label: item.platform,
    icon: "⬡",
    typeLabel: "Content",
  };

  const handleMouseEnter = () => {
    setHovered(true);
    if (item.previewable && item.embedUrl) {
      hoverTimer.current = setTimeout(() => setPreviewing(true), 900);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    clearTimeout(hoverTimer.current);
    // Don't kill preview if user moves back quickly — only kill on sustained leave
    setTimeout(() => {
      if (!hovered) setPreviewing(false);
    }, 300);
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) return;
    setBookmarked(true);
    await onBookmarkItem(item);
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
            ? `0 16px 40px ${p.color}18, 0 4px 16px rgba(0,0,0,0.4)`
            : "0 2px 8px rgba(0,0,0,0.2)",
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
                    background: `linear-gradient(135deg, ${p.color}14, rgba(0,0,0,0.5))`,
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

              {/* Hover overlay */}
              {hovered && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.3)",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  {item.previewable ? (
                    <div
                      style={{
                        background: "rgba(0,0,0,0.85)",
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
                        background: "rgba(0,0,0,0.7)",
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

              {/* Hold hint */}
              {hovered && item.previewable && !previewing && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 7,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.52rem",
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  hold to preview
                </div>
              )}

              {/* Type badge */}
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
                  letterSpacing: "0.07em",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span>{TYPE_ICONS[item.type] || p.icon}</span>
                <span>{p.typeLabel.toUpperCase()}</span>
              </div>

              {/* Duration */}
              {item.duration && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.85)",
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
              transition: "color 0.12s",
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
                letterSpacing: "0.05em",
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
              onClick={handleBookmark}
              title={bookmarked ? "Saved" : "Save to bookmarks"}
              style={{
                background: bookmarked
                  ? "rgba(251,191,36,0.15)"
                  : "transparent",
                border: `1px solid ${bookmarked ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 4,
                padding: "2px 7px",
                marginLeft: item.timeAgo ? 0 : "auto",
                color: bookmarked ? "var(--c-gold)" : "var(--c-text4)",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 120ms",
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

// ── Platform filter tabs ──────────────────────────────────────────────────────
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
        const isActive = active === pid;
        return (
          <button
            key={pid}
            onClick={() => onChange(pid)}
            style={{
              padding: "5px 13px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: isActive ? `${p.color}1a` : "rgba(255,255,255,0.04)",
              border: `1px solid ${isActive ? p.color + "60" : "rgba(255,255,255,0.08)"}`,
              color: isActive ? p.color : "var(--c-text3)",
              fontFamily: "var(--f-display)",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
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

// ── Main RecommendationFeed ───────────────────────────────────────────────────
export default function RecommendationFeed({
  query,
  platform = "all",
  title = "🎬 Recommended",
  compact = false,
  limit = 8,
  showFilters = true,
  style: extraStyle,
}) {
  const [items, setItems] = useState([]);
  const [byPlatform, setByPlatform] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePlatform, setActivePlatform] = useState("all");
  // KEY FIX: track attempted query (set on both success + failure) to prevent infinite retry
  const [attemptedQuery, setAttemptedQuery] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(
    async (q, plat) => {
      if (!q?.trim()) return;
      setLoading(true);
      setError(null);
      // Set attempted immediately so we don't loop
      setAttemptedQuery(q);

      try {
        const res = await recommendationsAPI.get(q, plat, limit);
        const data = res.data.data;
        setItems(data.flat || []);
        setByPlatform(data.byPlatform || {});
        setActivePlatform("all");
      } catch (err) {
        const msg =
          err?.response?.status === 0 || err?.message?.includes("Network")
            ? "Backend server is offline — start your backend to load recommendations"
            : "Could not load recommendations";
        setError(msg);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    // Only fetch if query changed AND we haven't already tried this exact query
    if (query && query !== attemptedQuery) {
      fetchData(query, platform);
    }
  }, [query, platform, fetchData, attemptedQuery]);

  const handleBookmarkItem = async (item) => {
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
      toast.success("Saved to bookmarks ★", { icon: "★" });
    } catch {
      toast.error("Failed to save");
    }
  };

  const displayItems =
    activePlatform === "all" ? items : byPlatform[activePlatform] || [];
  const availablePlatforms = Object.keys(byPlatform);
  const gridCols = compact
    ? "repeat(auto-fill, minmax(190px, 1fr))"
    : "repeat(auto-fill, minmax(255px, 1fr))";

  if (!query) return null;

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
                "linear-gradient(90deg, rgba(0,212,255,0.2), transparent)",
            }}
          />
        </div>
        {!loading && items.length > 0 && (
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.6rem",
              color: "var(--c-text4)",
            }}
          >
            {displayItems.length} results
          </span>
        )}
      </div>

      {/* Platform tabs */}
      {showFilters && !loading && availablePlatforms.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <PlatformTabs
            available={availablePlatforms}
            active={activePlatform}
            onChange={setActivePlatform}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
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
      {error && !loading && (
        <div
          style={{
            padding: "18px 20px",
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
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
              setAttemptedQuery(null);
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

      {/* Cards */}
      {!loading && !error && displayItems.length > 0 && (
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
              onBookmarkItem={handleBookmarkItem}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayItems.length === 0 && attemptedQuery && (
        <div
          style={{
            padding: "36px 20px",
            textAlign: "center",
            border: "1px dashed rgba(255,255,255,0.07)",
            borderRadius: 12,
            fontFamily: "var(--f-mono)",
            fontSize: "0.74rem",
            color: "var(--c-text4)",
          }}
        >
          No previews available for "{attemptedQuery}"
        </div>
      )}

      <style>{`
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </section>
  );
}

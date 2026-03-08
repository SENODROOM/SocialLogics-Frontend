import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";
import RecommendationFeed from "../components/features/RecommendationFeed";
import { searchAPI, bookmarksAPI } from "../utils/api";
import { CATEGORIES, PLATFORMS } from "../utils/constants";
import { useSearch } from "../hooks/useSearch";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const TYPING_QUERIES = [
  "viral shorts 2025",
  "AI breakthroughs",
  "best gaming clips",
  "trending music videos",
  "travel vlog japan",
  "tech reviews today",
  "comedy compilation",
  "sports highlights",
  "cooking tutorials",
  "documentary films",
  "live concerts",
  "science explained",
];

const HOME_DISCOVER_QUERY = "trending viral 2025";

// ─── Short-video platforms shown in the Shorts CTA card ──────────────────────
const SHORTS_PLATFORMS = [
  { id: "youtube", name: "Shorts", color: "#FF0000", icon: "▶" },
  { id: "tiktok", name: "TikTok", color: "#69C9D0", icon: "♪" },
  { id: "instagram", name: "Reels", color: "#E1306C", icon: "◎" },
  { id: "snapchat", name: "Spotlight", color: "#FFFC00", icon: "◌" },
  { id: "twitter", name: "Clips", color: "#e7e7e7", icon: "✕" },
  { id: "reddit", name: "Reddit", color: "#FF4500", icon: "◍" },
  { id: "triller", name: "Triller", color: "#FF0069", icon: "T" },
  { id: "kwai", name: "Kwai", color: "#FF8200", icon: "K" },
];

function TypingEffect({ queries }) {
  const [text, setText] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    const current = queries[qIdx];
    timer.current = setTimeout(
      () => {
        if (!deleting) {
          if (charIdx < current.length) {
            setText(current.substring(0, charIdx + 1));
            setCharIdx((i) => i + 1);
          } else setTimeout(() => setDeleting(true), 2000);
        } else {
          if (charIdx > 0) {
            setText(current.substring(0, charIdx - 1));
            setCharIdx((i) => i - 1);
          } else {
            setDeleting(false);
            setQIdx((i) => (i + 1) % queries.length);
          }
        }
      },
      deleting ? 35 : 70,
    );
    return () => clearTimeout(timer.current);
  }, [text, charIdx, deleting, qIdx, queries]);
  return (
    <span
      style={{
        color: "var(--c-cyan)",
        fontFamily: "var(--f-mono)",
        borderRight: "2px solid var(--c-cyan)",
        paddingRight: 2,
      }}
    >
      {text || "\u00A0"}
    </span>
  );
}

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const duration = 1500,
      step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      setCount((c) => {
        const next = Math.min(c + step, target);
        if (next >= target) clearInterval(timer);
        return next;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const totalUsersBillions = PLATFORMS.filter((p) => p.id !== "all").reduce(
  (s, p) => {
    const n = parseFloat(
      (p.monthlyUsers || "0").replace("B", "").replace("M", ""),
    );
    const isB = (p.monthlyUsers || "").includes("B");
    const isM = (p.monthlyUsers || "").includes("M");
    return s + (isB ? n : isM ? n / 1000 : 0);
  },
  0,
);

// ─── Shorts CTA Banner ────────────────────────────────────────────────────────
function ShortsBanner({ onEnter }) {
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);

  // Cycle platform highlight for the marquee effect
  useEffect(() => {
    const id = setInterval(
      () => setTick((t) => (t + 1) % SHORTS_PLATFORMS.length),
      900,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        margin: "0 0 48px",
        borderRadius: 16,
        padding: "0",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hovered ? "rgba(124,58,237,.5)" : "rgba(124,58,237,.2)"}`,
        transition: "all .3s ease",
        boxShadow: hovered
          ? "0 20px 60px rgba(124,58,237,.2)"
          : "0 8px 30px rgba(0,0,0,.4)",
        transform: hovered ? "translateY(-3px)" : "none",
      }}
      onClick={onEnter}
    >
      {/* Gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg,rgba(124,58,237,.18) 0%,rgba(219,39,119,.18) 40%,rgba(0,0,0,.6) 100%)",
          zIndex: 0,
        }}
      />

      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
          zIndex: 0,
        }}
      />

      {/* Glowing orb */}
      <div
        style={{
          position: "absolute",
          right: "-5%",
          top: "-30%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(219,39,119,.22) 0%,transparent 65%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "10%",
          bottom: "-20%",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 65%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          gap: 28,
          flexWrap: "wrap",
        }}
      >
        {/* Left — text */}
        <div style={{ flex: 1, minWidth: 220 }}>
          {/* Label */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(124,58,237,.2)",
              border: "1px solid rgba(124,58,237,.4)",
              borderRadius: 99,
              padding: "4px 12px",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#db2777",
                display: "block",
                animation: "pulse 1.5s ease infinite",
                boxShadow: "0 0 8px #db2777",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--f-mono)",
                color: "rgba(255,255,255,.8)",
                letterSpacing: ".12em",
                fontWeight: 600,
              }}
            >
              NEW · SHORTS FEED
            </span>
          </div>

          <h2
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: "clamp(1.4rem,3vw,2.2rem)",
              lineHeight: 1.1,
              marginBottom: 10,
              background:
                "linear-gradient(135deg,#c084fc 0%,#f0abfc 40%,#fb7185 80%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ShortsVerse
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,.6)",
              lineHeight: 1.6,
              marginBottom: 18,
              maxWidth: 380,
              fontFamily: "var(--f-body)",
            }}
          >
            One infinite feed. Every platform. Scroll through
            YouTube&nbsp;Shorts, Instagram&nbsp;Reels, TikToks,
            Snapchat&nbsp;Spotlight and more — all recommended by our
            cross-platform AI.
          </p>

          {/* Platform pills */}
          <div
            style={{
              display: "flex",
              gap: 7,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            {SHORTS_PLATFORMS.map((pl, i) => (
              <div
                key={pl.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background:
                    i === tick ? `${pl.color}25` : "rgba(255,255,255,.06)",
                  border:
                    i === tick
                      ? `1px solid ${pl.color}`
                      : "1px solid rgba(255,255,255,.1)",
                  transition: "all .3s",
                  fontSize: 11,
                  fontWeight: 700,
                  color: i === tick ? pl.color : "rgba(255,255,255,.5)",
                  fontFamily: "var(--f-display)",
                }}
              >
                <span>{pl.icon}</span> {pl.name}
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 28px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg,#7c3aed,#db2777)",
              color: "#fff",
              fontFamily: "var(--f-display)",
              fontSize: "0.85rem",
              fontWeight: 800,
              letterSpacing: ".04em",
              cursor: "pointer",
              boxShadow: hovered
                ? "0 0 32px rgba(124,58,237,.5)"
                : "0 4px 20px rgba(124,58,237,.35)",
              transition: "all .25s",
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}
          >
            <span style={{ fontSize: 18 }}>▶</span>
            Watch Shorts
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>

        {/* Right — phone mockup */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            opacity: hovered ? 1 : 0.85,
            transition: "opacity .3s",
          }}
        >
          {/* Stacked card previews */}
          {[0, 1, 2].map((n) => {
            const pl = SHORTS_PLATFORMS[(tick + n) % SHORTS_PLATFORMS.length];
            return (
              <div
                key={n}
                style={{
                  width: 130,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${pl.color}33`,
                  background: `linear-gradient(160deg,${pl.color}12,rgba(0,0,0,.6))`,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transform:
                    n === 0
                      ? "scale(1.02)"
                      : n === 2
                        ? "scale(.97)"
                        : "scale(1)",
                  transition: "transform .3s",
                  opacity: n === 0 ? 1 : n === 1 ? 0.75 : 0.5,
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {
                    [
                      "☕",
                      "🎮",
                      "🗼",
                      "🔥",
                      "🎨",
                      "🏀",
                      "🌙",
                      "😹",
                      "🤖",
                      "💪",
                    ][(tick + n) % 10]
                  }
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: pl.color,
                      fontWeight: 700,
                      fontFamily: "var(--f-display)",
                    }}
                  >
                    {pl.icon} {pl.name}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: "rgba(255,255,255,.45)",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    @creator_{((tick + n + 1) * 7) % 99}
                  </div>
                  <div
                    style={{
                      height: 2,
                      background: "rgba(255,255,255,.1)",
                      borderRadius: 2,
                      marginTop: 5,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${30 + (((tick + n) * 23) % 55)}%`,
                        background: pl.color,
                        borderRadius: 2,
                        transition: "width .5s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Main Home page ───────────────────────────────────────────────────────────
export default function Home() {
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchCount, setSearchCount] = useState(0);
  const [feedQuery, setFeedQuery] = useState(HOME_DISCOVER_QUERY);
  const navigate = useNavigate();
  const { search, openAll } = useSearch();
  const { user } = useAuth();

  useEffect(() => {
    searchAPI
      .trending(20, "daily")
      .then((r) => setTrending(r.data?.data?.trending || []))
      .catch(() => {});
    searchAPI
      .stats()
      .then((r) => {
        setStats(r.data?.data);
        setSearchCount(r.data?.data?.totalSearches || 0);
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (data) => {
    openAll(data.results);
    setFeedQuery(data.query);
    navigate(
      `/search?q=${encodeURIComponent(data.query)}&platform=${data.platform}`,
    );
  };

  const handleCategory = async (tag) => {
    setActiveCategory(tag);
    setFeedQuery(tag);
    const data = await search({ query: tag, platform: "all" });
    if (data) {
      openAll(data.results.slice(0, 6));
      navigate(`/search?q=${encodeURIComponent(tag)}&platform=all`);
    }
  };

  const handleTrendingClick = async (query) => {
    setFeedQuery(query);
    const data = await search({ query, platform: "all" });
    if (data) {
      openAll(data.results.slice(0, 5));
      navigate(`/search?q=${encodeURIComponent(query)}&platform=all`);
    }
  };

  const handleBookmark = async (item) => {
    if (!user) {
      toast.error("Login to save bookmarks");
      return;
    }
    try {
      await bookmarksAPI.create({
        title: item.title,
        url: item.url,
        platform: item.platform,
        thumbnail: item.thumbnail,
        description: item.author ? `By ${item.author}` : "",
      });
      toast.success("Saved to bookmarks ★", { icon: "★" });
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 100px" }}>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 0 60px", textAlign: "center" }}>
        {/* Live status pill */}
        <div
          className="animate-fade-up"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            background: "rgba(0,212,255,.06)",
            border: "1px solid rgba(0,212,255,.2)",
            borderRadius: 99,
            marginBottom: 36,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--c-green)",
              boxShadow: "0 0 8px var(--c-green)",
              display: "block",
              animation: "pulse 2s ease infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.68rem",
              color: "var(--c-text2)",
              letterSpacing: ".1em",
            }}
          >
            {stats
              ? `${stats.totalSearches?.toLocaleString() || "—"} searches · ${stats.platforms || 18} platforms · live`
              : "LIVE · 18+ PLATFORMS · REAL-TIME SEARCH"}
          </span>
        </div>

        {/* Logo */}
        <div
          className="animate-fade-up animate-delay-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "2px solid var(--c-cyan)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--c-cyan)",
              fontSize: "1.9rem",
              boxShadow:
                "0 0 30px rgba(0,212,255,.35),0 0 80px rgba(0,212,255,.1)",
              animation: "glow-pulse 3s ease infinite",
            }}
          >
            ⬡
          </div>
          <h1
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: "clamp(2.6rem,8vw,5.5rem)",
              letterSpacing: "-.01em",
              background:
                "linear-gradient(135deg,var(--c-cyan) 0%,#fff 40%,#80c0ff 70%,#a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            SocialLogics
          </h1>
        </div>

        <div
          className="animate-fade-up animate-delay-1"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: "clamp(0.7rem,1.8vw,0.9rem)",
            color: "var(--c-text3)",
            letterSpacing: ".3em",
            marginBottom: 14,
            textTransform: "uppercase",
          }}
        >
          Unified Video Search Engine
        </div>

        <div
          className="animate-fade-up animate-delay-2"
          style={{
            fontFamily: "var(--f-body)",
            fontSize: "clamp(1rem,2.5vw,1.2rem)",
            color: "var(--c-text2)",
            marginBottom: 52,
            lineHeight: 1.5,
          }}
        >
          Discover <TypingEffect queries={TYPING_QUERIES} /> across every
          platform
        </div>

        {/* Search */}
        <div
          className="animate-fade-up animate-delay-3"
          style={{
            maxWidth: 880,
            margin: "0 auto",
            position: "relative",
            padding: "0 8px",
          }}
        >
          {[
            ["top", "-10px", "left", "-2px", "borderTop", "borderLeft"],
            ["top", "-10px", "right", "-2px", "borderTop", "borderRight"],
            ["bottom", "-10px", "left", "-2px", "borderBottom", "borderLeft"],
            ["bottom", "-10px", "right", "-2px", "borderBottom", "borderRight"],
          ].map(([s1, v1, s2, v2, b1, b2], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                [s1]: v1,
                [s2]: v2,
                width: 18,
                height: 18,
                [b1]: "2px solid rgba(0,212,255,.5)",
                [b2]: "2px solid rgba(0,212,255,.5)",
              }}
            />
          ))}
          <SearchBar large autoFocus onSearch={handleSearch} />
        </div>

        {/* Stats */}
        <div
          className="animate-fade-up animate-delay-4"
          style={{
            display: "flex",
            gap: 32,
            justifyContent: "center",
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Platforms",
              value: PLATFORMS.filter((p) => p.id !== "all").length,
              suffix: "",
            },
            {
              label: "Monthly Reach",
              value: Math.round(totalUsersBillions * 10) / 10,
              suffix: "B+",
            },
            {
              label: "Searches Today",
              value: Math.max(searchCount, 1247),
              suffix: "",
            },
            { label: "Content Types", value: 8, suffix: "" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  color: "var(--c-cyan)",
                  lineHeight: 1,
                }}
              >
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.62rem",
                  color: "var(--c-text4)",
                  letterSpacing: ".15em",
                  marginTop: 4,
                }}
              >
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Platform marquee */}
        <div
          className="animate-fade-up animate-delay-4"
          style={{ marginTop: 36, overflow: "hidden", position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 80,
              background: "linear-gradient(90deg,var(--c-bg),transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 80,
              background: "linear-gradient(270deg,var(--c-bg),transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              animation: "ticker 35s linear infinite",
              width: "max-content",
              gap: 10,
            }}
          >
            {[
              ...PLATFORMS.filter((p) => p.id !== "all"),
              ...PLATFORMS.filter((p) => p.id !== "all"),
            ].map((p, i) => (
              <span
                key={i}
                onClick={() => navigate(`/search?platform=${p.id}`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 16px",
                  background: p.color + "10",
                  border: `1px solid ${p.color}35`,
                  borderRadius: 99,
                  cursor: "pointer",
                  flexShrink: 0,
                  color: p.color,
                  fontFamily: "var(--f-display)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  transition: "all var(--t-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = p.color + "22";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = p.color + "10";
                  e.currentTarget.style.transform = "none";
                }}
              >
                {p.icon} {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ★ SHORTS CTA BANNER ────────────────────────────────────── */}
      <ShortsBanner onEnter={() => navigate("/shorts")} />

      {/* ── Categories ─────────────────────────────────────────────── */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "0.65rem",
              letterSpacing: ".3em",
              color: "var(--c-text3)",
              textTransform: "uppercase",
            }}
          >
            Browse by category
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "linear-gradient(90deg,rgba(255,255,255,.08),transparent)",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.tag}
              onClick={() => handleCategory(c.tag)}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--r-md)",
                background:
                  activeCategory === c.tag
                    ? "rgba(0,212,255,.1)"
                    : "var(--c-surface)",
                border: `1px solid ${activeCategory === c.tag ? "var(--c-cyan)" : "var(--c-border)"}`,
                color:
                  activeCategory === c.tag ? "var(--c-cyan)" : "var(--c-text2)",
                fontFamily: "var(--f-body)",
                fontSize: "0.85rem",
                fontWeight: 500,
                transition: "all var(--t-fast)",
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== c.tag) {
                  e.currentTarget.style.borderColor = "rgba(0,212,255,.4)";
                  e.currentTarget.style.background = "rgba(0,212,255,.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== c.tag) {
                  e.currentTarget.style.borderColor = "var(--c-border)";
                  e.currentTarget.style.background = "var(--c-surface)";
                }
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Recommendation Feed ────────────────────────────────────── */}
      <RecommendationFeed
        query={feedQuery}
        platform="youtube,reddit,dailymotion,vimeo"
        title="🎬 Discover — Videos, Reels & Posts"
        limit={8}
        showFilters={true}
        onBookmark={handleBookmark}
        style={{ marginBottom: 60 }}
      />

      {/* ── Trending ───────────────────────────────────────────────── */}
      {trending.length > 0 && (
        <section style={{ marginBottom: 60 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontSize: "0.65rem",
                letterSpacing: ".3em",
                color: "var(--c-text3)",
                textTransform: "uppercase",
              }}
            >
              🔥 Trending searches
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  "linear-gradient(90deg,rgba(255,255,255,.08),transparent)",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
              gap: 8,
            }}
          >
            {trending.map((t, i) => (
              <div
                key={i}
                onClick={() => handleTrendingClick(t.displayQuery || t.query)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  transition: "all var(--t-fast)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--c-surface2)";
                  e.currentTarget.style.borderColor = "rgba(0,212,255,.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--c-surface)";
                  e.currentTarget.style.borderColor = "var(--c-border)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: "0.65rem",
                    color: i < 3 ? "var(--c-gold)" : "var(--c-text4)",
                    width: 22,
                    textAlign: "center",
                    flexShrink: 0,
                    fontWeight: 800,
                  }}
                >
                  #{i + 1}
                </span>
                <span
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.78rem",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.displayQuery || t.query}
                </span>
                <span
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.6rem",
                    color: "var(--c-text4)",
                    flexShrink: 0,
                  }}
                >
                  {t.count?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Platform grid ──────────────────────────────────────────── */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "0.65rem",
              letterSpacing: ".3em",
              color: "var(--c-text3)",
              textTransform: "uppercase",
            }}
          >
            All {PLATFORMS.filter((p) => p.id !== "all").length} platforms
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "linear-gradient(90deg,rgba(255,255,255,.08),transparent)",
            }}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 10,
          }}
        >
          {PLATFORMS.filter((p) => p.id !== "all").map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/search?platform=${p.id}`)}
              style={{
                background: "rgba(255,255,255,.02)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 10,
                padding: "16px 18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all 220ms cubic-bezier(.16,1,.3,1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = p.color + "80";
                e.currentTarget.style.background = "rgba(255,255,255,.05)";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 10px 30px ${p.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,.07)";
                e.currentTarget.style.background = "rgba(255,255,255,.02)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  border: `1.5px solid ${p.color}55`,
                  background: p.color + "14",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: p.color,
                  fontWeight: 900,
                  fontSize: "1.05rem",
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: p.color,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,.3)",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.desc}
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: "0.58rem",
                    color: "var(--c-text4)",
                    marginTop: 3,
                  }}
                >
                  {p.monthlyUsers} users/mo
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

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

// Default "discover" query shown on homepage before user searches
const HOME_DISCOVER_QUERY = "trending viral 2025";

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

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchCount, setSearchCount] = useState(0);
  // Track what the user just searched to feed into RecommendationFeed
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
      {/* ── Hero ──────────────────────────────────────────────────────── */}
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
              letterSpacing: "0.1em",
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
              letterSpacing: "-0.01em",
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
            letterSpacing: "0.3em",
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
          <div
            style={{
              position: "absolute",
              top: -10,
              left: -2,
              width: 18,
              height: 18,
              borderTop: "2px solid rgba(0,212,255,.5)",
              borderLeft: "2px solid rgba(0,212,255,.5)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -10,
              right: -2,
              width: 18,
              height: 18,
              borderTop: "2px solid rgba(0,212,255,.5)",
              borderRight: "2px solid rgba(0,212,255,.5)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -10,
              left: -2,
              width: 18,
              height: 18,
              borderBottom: "2px solid rgba(0,212,255,.5)",
              borderLeft: "2px solid rgba(0,212,255,.5)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -10,
              right: -2,
              width: 18,
              height: 18,
              borderBottom: "2px solid rgba(0,212,255,.5)",
              borderRight: "2px solid rgba(0,212,255,.5)",
            }}
          />
          <SearchBar large autoFocus onSearch={handleSearch} />
        </div>

        {/* Stats bar */}
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
                  letterSpacing: "0.15em",
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

      {/* ── Categories ─────────────────────────────────────────────────── */}
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
              letterSpacing: "0.3em",
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

      {/* ── Recommendation Feed ────────────────────────────────────────── */}
      <RecommendationFeed
        query={feedQuery}
        platform="youtube,reddit,dailymotion,vimeo"
        title="🎬 Discover — Videos, Reels & Posts"
        limit={8}
        showFilters={true}
        onBookmark={handleBookmark}
        style={{ marginBottom: 60 }}
      />

      {/* ── Trending ───────────────────────────────────────────────────── */}
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
                letterSpacing: "0.3em",
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

      {/* ── Platform grid ──────────────────────────────────────────────── */}
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
              letterSpacing: "0.3em",
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

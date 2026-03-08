/**
 * Profile.js  ─  frontend/src/pages/Profile.js
 *
 * NEW IN THIS VERSION
 * ────────────────────
 * A full YouTube-style "My Activity" section is added at the bottom of the
 * profile page. It includes tabs for:
 *   • Search History  — all past searches, filterable, individually deletable
 *   • Video History   — platforms the user has opened (from search clicks)
 *   • Posts History   — (placeholder) Reddit-style posts the user has interacted with
 *   • Bookmarks       — quick view of saved bookmarks
 *
 * Each entry has a trash icon to delete it individually, and there is a
 * "Clear All" button per section — just like YouTube's history management.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  authAPI,
  usersAPI,
  alertsAPI,
  historyAPI,
  bookmarksAPI,
} from "../utils/api";
import { PLATFORMS } from "../utils/constants";
import { SectionHeader, Badge } from "../components/ui";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Card = ({ title, children }) => (
  <div
    style={{
      background: "var(--c-surface)",
      border: "1px solid var(--c-border)",
      borderRadius: "var(--r-lg)",
      padding: "28px",
      marginBottom: 20,
    }}
  >
    <SectionHeader>{title}</SectionHeader>
    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label
      style={{
        display: "block",
        fontFamily: "var(--f-display)",
        fontSize: "0.6rem",
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "rgba(0,212,255,0.6)",
        marginBottom: 8,
        textTransform: "uppercase",
      }}
    >
      {label}
    </label>
    {children}
    {hint && (
      <div
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: "0.62rem",
          color: "var(--c-text4)",
          marginTop: 5,
        }}
      >
        {hint}
      </div>
    )}
  </div>
);

// ── YouTube-style Activity / History Panel ────────────────────────────────────
function ActivityPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("search");
  const [searchHistory, setSearchHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const TABS = [
    { id: "search", label: "🔍 Search History" },
    { id: "video", label: "🎬 Video History" },
    { id: "posts", label: "📝 Posts History" },
    { id: "bookmarks", label: "★ Bookmarks" },
  ];

  // Load search history
  useEffect(() => {
    if (activeTab === "search" || activeTab === "video") {
      setLoading(true);
      historyAPI
        .getHistory({ page: 1, limit: 50 })
        .then((res) => {
          setSearchHistory(res?.data?.data?.history || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (activeTab === "bookmarks") {
      setLoading(true);
      bookmarksAPI
        .getBookmarks({ page: 1, limit: 30 })
        .then((res) => {
          setBookmarks(res?.data?.data?.bookmarks || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const deleteHistoryItem = async (id) => {
    setRemovingIds((s) => new Set([...s, id]));
    try {
      await historyAPI.deleteHistory(id);
      setSearchHistory((prev) => prev.filter((h) => h._id !== id));
      toast.success("Entry removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setRemovingIds((s) => {
        const ns = new Set(s);
        ns.delete(id);
        return ns;
      });
    }
  };

  const clearAllHistory = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    try {
      await historyAPI.clearHistory();
      setSearchHistory([]);
      setConfirmClear(false);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear");
    }
  };

  const deleteBookmark = async (id) => {
    setRemovingIds((s) => new Set([...s, id]));
    try {
      await bookmarksAPI.deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
      toast.success("Bookmark removed");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setRemovingIds((s) => {
        const ns = new Set(s);
        ns.delete(id);
        return ns;
      });
    }
  };

  const filteredHistory = searchHistory.filter(
    (h) =>
      !searchFilter ||
      h.query?.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  // For "video history" — items that had platform clicks recorded
  const videoHistory = searchHistory.filter(
    (h) => h.clickedPlatforms && h.clickedPlatforms.length > 0,
  );

  const formatTime = (ts) =>
    new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "20px 28px 0",
          borderBottom: "1px solid var(--c-border)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--f-display)",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            color: "rgba(0,212,255,0.6)",
            marginBottom: 6,
          }}
        >
          MY ACTIVITY
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 0,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: "1.2rem",
              margin: 0,
            }}
          >
            History & Saves
          </h2>
          {(activeTab === "search" || activeTab === "video") &&
            searchHistory.length > 0 && (
              <button
                onClick={clearAllHistory}
                style={{
                  padding: "6px 14px",
                  background: confirmClear
                    ? "rgba(255,51,102,.2)"
                    : "rgba(255,51,102,.08)",
                  border: `1px solid ${confirmClear ? "rgba(255,51,102,.7)" : "rgba(255,51,102,.25)"}`,
                  borderRadius: 7,
                  color: confirmClear ? "#ff3366" : "rgba(255,51,102,.7)",
                  fontFamily: "var(--f-display)",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  transition: "all 150ms",
                }}
              >
                {confirmClear
                  ? "⚠ CLICK AGAIN TO CONFIRM"
                  : "🗑 Clear All History"}
              </button>
            )}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginTop: 16 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid var(--c-cyan)"
                    : "2px solid transparent",
                color:
                  activeTab === tab.id ? "var(--c-cyan)" : "var(--c-text3)",
                fontFamily: "var(--f-display)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 150ms",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 28px 24px" }}>
        {/* ── Search History Tab ── */}
        {activeTab === "search" && (
          <>
            {/* Search filter */}
            <div style={{ marginBottom: 16 }}>
              <input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter history..."
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  fontSize: "0.85rem",
                  background: "var(--c-bg2)",
                  border: "1px solid var(--c-border2)",
                  borderRadius: 8,
                  color: "var(--c-text)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {loading ? (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: "var(--c-text4)",
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.75rem",
                }}
              >
                Loading history...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div
                  style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 12 }}
                >
                  🔍
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.75rem",
                    color: "var(--c-text4)",
                  }}
                >
                  {searchFilter
                    ? "No matching history"
                    : "No search history yet"}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filteredHistory.map((item) => {
                  const platform = PLATFORMS.find(
                    (p) => p.id === item.platform,
                  );
                  const color = platform?.color || "var(--c-cyan)";
                  const removing = removingIds.has(item._id);
                  return (
                    <div
                      key={item._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,.02)",
                        border: `1px solid rgba(255,255,255,.06)`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 8,
                        opacity: removing ? 0.4 : 1,
                        transform: removing ? "translateX(8px)" : "none",
                        transition: "all 180ms",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--f-mono)",
                            fontSize: "0.88rem",
                            color: "var(--c-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.query}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--f-mono)",
                            fontSize: "0.6rem",
                            color: "var(--c-text4)",
                            marginTop: 3,
                            display: "flex",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{ color: color + "aa", fontWeight: 600 }}
                          >
                            {platform?.name || item.platform}
                          </span>
                          {item.contentType && item.contentType !== "all" && (
                            <span>· {item.contentType}</span>
                          )}
                          <span>· {formatTime(item.createdAt)}</span>
                          {item.resultCount && (
                            <span>· {item.resultCount} results</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() =>
                            navigate(
                              `/search?q=${encodeURIComponent(item.query)}&platform=${item.platform}`,
                            )
                          }
                          style={{
                            padding: "4px 10px",
                            background: "rgba(0,212,255,.06)",
                            border: "1px solid rgba(0,212,255,.18)",
                            borderRadius: 6,
                            color: "var(--c-cyan)",
                            fontFamily: "var(--f-display)",
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ↗ Search again
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item._id)}
                          disabled={removing}
                          title="Remove"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,.08)",
                            color: "var(--c-text4)",
                            fontSize: "1rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 120ms",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,51,102,.12)";
                            e.currentTarget.style.borderColor =
                              "rgba(255,51,102,.35)";
                            e.currentTarget.style.color = "#ff3366";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor =
                              "rgba(255,255,255,.08)";
                            e.currentTarget.style.color = "var(--c-text4)";
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Video History Tab ── */}
        {activeTab === "video" && (
          <>
            {loading ? (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: "var(--c-text4)",
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.75rem",
                }}
              >
                Loading...
              </div>
            ) : videoHistory.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div
                  style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 12 }}
                >
                  🎬
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.75rem",
                    color: "var(--c-text4)",
                  }}
                >
                  No video history yet. When you open platforms from search
                  results, they'll appear here.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {videoHistory.map((item) => {
                  const removing = removingIds.has(item._id);
                  return (
                    <div
                      key={item._id}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "13px 14px",
                        background: "rgba(255,255,255,.02)",
                        border: "1px solid rgba(255,255,255,.06)",
                        borderRadius: 10,
                        opacity: removing ? 0.4 : 1,
                        transition: "all 180ms",
                        alignItems: "center",
                      }}
                    >
                      {/* Platforms opened */}
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          flexShrink: 0,
                          flexWrap: "wrap",
                          maxWidth: 120,
                        }}
                      >
                        {item.clickedPlatforms.map((pid) => {
                          const p = PLATFORMS.find((x) => x.id === pid);
                          return p ? (
                            <div
                              key={pid}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                background: p.color + "18",
                                border: `1px solid ${p.color}44`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: p.color,
                                fontSize: "0.85rem",
                                title: p.name,
                              }}
                            >
                              {p.icon}
                            </div>
                          ) : null;
                        })}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "var(--f-mono)",
                            fontSize: "0.88rem",
                            color: "var(--c-text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.query}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--f-mono)",
                            fontSize: "0.6rem",
                            color: "var(--c-text4)",
                            marginTop: 3,
                          }}
                        >
                          Opened: {item.clickedPlatforms.join(", ")} ·{" "}
                          {formatTime(item.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() =>
                            navigate(
                              `/search?q=${encodeURIComponent(item.query)}&platform=all`,
                            )
                          }
                          style={{
                            padding: "4px 10px",
                            background: "rgba(0,212,255,.06)",
                            border: "1px solid rgba(0,212,255,.18)",
                            borderRadius: 6,
                            color: "var(--c-cyan)",
                            fontFamily: "var(--f-display)",
                            fontSize: "0.58rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ↗ Search again
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item._id)}
                          disabled={removing}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,.08)",
                            color: "var(--c-text4)",
                            fontSize: "1rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 120ms",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,51,102,.12)";
                            e.currentTarget.style.color = "#ff3366";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--c-text4)";
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Posts History Tab ── */}
        {activeTab === "posts" && (
          <div style={{ padding: "30px 0", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 12 }}>
              📝
            </div>
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--c-text2)",
                marginBottom: 8,
              }}
            >
              Posts History Coming Soon
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: "0.72rem",
                color: "var(--c-text4)",
                maxWidth: 400,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              When Reddit posts, Dailymotion videos, and other social content
              interactions are tracked, they will appear here. You will be able
              to delete individual post views from your history.
            </div>
            <button
              onClick={() => navigate("/search")}
              style={{
                marginTop: 20,
                padding: "9px 20px",
                background: "rgba(0,212,255,.08)",
                border: "1px solid rgba(0,212,255,.25)",
                borderRadius: 8,
                color: "var(--c-cyan)",
                fontFamily: "var(--f-display)",
                fontSize: "0.68rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Start Browsing →
            </button>
          </div>
        )}

        {/* ── Bookmarks Tab ── */}
        {activeTab === "bookmarks" && (
          <>
            {loading ? (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: "var(--c-text4)",
                  fontFamily: "var(--f-mono)",
                  fontSize: "0.75rem",
                }}
              >
                Loading bookmarks...
              </div>
            ) : bookmarks.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div
                  style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 12 }}
                >
                  ★
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-mono)",
                    fontSize: "0.75rem",
                    color: "var(--c-text4)",
                  }}
                >
                  No bookmarks yet. Star platforms while searching to save them
                  here.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {bookmarks.map((bm) => {
                  const p = PLATFORMS.find((x) => x.id === bm.platform);
                  const color = p?.color || "var(--c-cyan)";
                  const removing = removingIds.has(bm._id);
                  return (
                    <div
                      key={bm._id}
                      style={{
                        background: "rgba(255,255,255,.025)",
                        border: `1px solid rgba(255,255,255,.07)`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 9,
                        padding: "12px 14px",
                        opacity: removing ? 0.4 : 1,
                        transition: "all 180ms",
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            background: color + "18",
                            border: `1px solid ${color}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {p?.icon || "★"}
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
                            {bm.title}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--f-display)",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                              color,
                              marginTop: 2,
                            }}
                          >
                            {p?.name || bm.platform}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteBookmark(bm._id)}
                          disabled={removing}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,.08)",
                            color: "var(--c-text4)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 120ms",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(255,51,102,.12)";
                            e.currentTarget.style.color = "#ff3366";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--c-text4)";
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      {bm.notes && (
                        <div
                          style={{
                            fontFamily: "var(--f-mono)",
                            fontSize: "0.62rem",
                            color: "var(--c-text4)",
                            fontStyle: "italic",
                          }}
                        >
                          {bm.notes}
                        </div>
                      )}
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.58rem",
                          color: color + "aa",
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {bm.url}
                      </a>
                      <div
                        style={{
                          fontFamily: "var(--f-mono)",
                          fontSize: "0.55rem",
                          color: "var(--c-text4)",
                        }}
                      >
                        {formatTime(bm.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {bookmarks.length > 0 && (
              <div style={{ marginTop: 14, textAlign: "right" }}>
                <a
                  href="/bookmarks"
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "var(--c-cyan)",
                    textDecoration: "none",
                    letterSpacing: "0.08em",
                  }}
                >
                  VIEW ALL BOOKMARKS →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Profile component ────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [theme, setTheme] = useState(user?.theme || "cyber");
  const [prefs, setPrefs] = useState(user?.preferredPlatforms || []);
  const [safeSearch, setSafeSearch] = useState(user?.safeSearch !== false);
  const [defaultMode, setDefaultMode] = useState(
    user?.defaultSearchMode || "all",
  );
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [alertQuery, setAlertQuery] = useState("");
  const [alertFreq, setAlertFreq] = useState("daily");

  const inp = { width: "100%", padding: "12px 14px", fontSize: "0.9rem" };

  const togglePlatform = (id) =>
    setPrefs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        bio,
        avatar,
        theme,
        preferredPlatforms: prefs,
        safeSearch,
        defaultSearchMode: defaultMode,
      });
      updateUser(res.data.data.user);
      toast.success("Profile saved ✓");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currPass || !newPass) {
      toast.error("Fill both fields");
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: currPass,
        newPassword: newPass,
      });
      setCurrPass("");
      setNewPass("");
      toast.success("Password changed ✓");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveAlert = async () => {
    if (!alertQuery) return;
    try {
      await alertsAPI.create({
        query: alertQuery,
        platform: "all",
        frequency: alertFreq,
      });
      setAlertQuery("");
      toast.success("Search alert created ✓");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeSaved = async (i) => {
    try {
      await usersAPI.deleteSaved(i);
      updateUser({
        savedSearches: user.savedSearches.filter((_, idx) => idx !== i),
      });
    } catch {}
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontFamily: "var(--f-display)",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "var(--c-text3)",
            marginBottom: 6,
          }}
        >
          MY ACCOUNT
        </div>
        <h1
          style={{
            fontFamily: "var(--f-display)",
            fontWeight: 800,
            fontSize: "1.8rem",
          }}
        >
          Settings & Profile
        </h1>
      </div>

      {/* Account info */}
      <Card title="ACCOUNT INFO">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
            padding: "14px",
            background: "var(--c-bg2)",
            borderRadius: "var(--r-md)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(0,212,255,0.12)",
              border: "2px solid rgba(0,212,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--f-display)",
              fontWeight: 800,
              fontSize: "1.3rem",
              color: "var(--c-cyan)",
              flexShrink: 0,
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 700,
                color: "var(--c-cyan)",
              }}
            >
              @{user?.username}
            </div>
            <div
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: "0.75rem",
                color: "var(--c-text3)",
                marginTop: 2,
              }}
            >
              {user?.email}
            </div>
            <Badge color="var(--c-green)" size="sm">
              {user?.role || "user"}
            </Badge>
          </div>
        </div>
        <Field label="Bio" hint="Max 300 characters">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={300}
            style={{ ...inp, height: 80, resize: "none" }}
            placeholder="Tell us about yourself..."
          />
        </Field>
        <Field label="Avatar URL">
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            style={inp}
            placeholder="https://..."
          />
        </Field>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Field label="Theme">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ ...inp }}
            >
              <option value="cyber">Cyber (Default)</option>
              <option value="dark">Dark</option>
              <option value="neon">Neon</option>
              <option value="matrix">Matrix</option>
            </select>
          </Field>
          <Field label="Default search mode">
            <select
              value={defaultMode}
              onChange={(e) => setDefaultMode(e.target.value)}
              style={{ ...inp }}
            >
              <option value="all">Search all platforms</option>
              <option value="single">Single platform</option>
            </select>
          </Field>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <input
            type="checkbox"
            id="safe"
            checked={safeSearch}
            onChange={(e) => setSafeSearch(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: "var(--c-cyan)" }}
          />
          <label
            htmlFor="safe"
            style={{
              fontFamily: "var(--f-body)",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Safe search enabled
          </label>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(135deg,var(--c-cyan),#0080ff)",
            color: "#000",
            borderRadius: "var(--r-sm)",
            fontFamily: "var(--f-display)",
            fontWeight: 800,
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            cursor: "pointer",
            border: "none",
          }}
        >
          {saving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </Card>

      {/* Platform preferences */}
      <Card title="PREFERRED PLATFORMS">
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: "0.72rem",
            color: "var(--c-text3)",
            marginBottom: 16,
          }}
        >
          Pin your go-to platforms for quick access
        </p>
        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {PLATFORMS.filter((p) => p.id !== "all").map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-full)",
                fontSize: "0.72rem",
                fontFamily: "var(--f-mono)",
                transition: "all var(--t-fast)",
                background: prefs.includes(p.id)
                  ? p.color + "22"
                  : "transparent",
                border: `1px solid ${prefs.includes(p.id) ? p.color : "var(--c-border2)"}`,
                color: prefs.includes(p.id) ? p.color : "var(--c-text3)",
              }}
            >
              {p.icon} {p.name}
            </button>
          ))}
        </div>
        <button
          onClick={saveProfile}
          style={{
            padding: "9px 20px",
            background: "var(--c-cyan-dim)",
            border: "1px solid rgba(0,212,255,0.3)",
            borderRadius: "var(--r-sm)",
            color: "var(--c-cyan)",
            fontFamily: "var(--f-display)",
            fontSize: "0.65rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          SAVE PREFERENCES
        </button>
      </Card>

      {/* Search alerts */}
      <Card title="SEARCH ALERTS">
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: "0.72rem",
            color: "var(--c-text3)",
            marginBottom: 16,
          }}
        >
          Get notified when topics trend on your platforms
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={alertQuery}
            onChange={(e) => setAlertQuery(e.target.value)}
            placeholder="e.g. AI news, gaming clips..."
            style={{
              flex: 1,
              minWidth: 200,
              padding: "10px 14px",
              fontSize: "0.85rem",
            }}
          />
          <select
            value={alertFreq}
            onChange={(e) => setAlertFreq(e.target.value)}
            style={{ padding: "10px 12px", fontSize: "0.75rem" }}
          >
            <option value="realtime">Real-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            onClick={saveAlert}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(135deg,var(--c-cyan),#0080ff)",
              color: "#000",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--f-display)",
              fontSize: "0.7rem",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
            }}
          >
            ADD ALERT
          </button>
        </div>
      </Card>

      {/* Saved searches */}
      {user?.savedSearches?.length > 0 && (
        <Card title="SAVED SEARCHES">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {user.savedSearches.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--c-bg2)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <div>
                  <span
                    style={{ fontFamily: "var(--f-mono)", fontSize: "0.85rem" }}
                  >
                    {s.query}
                  </span>
                  {s.platform && s.platform !== "all" && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.65rem",
                        color: "var(--c-cyan)",
                      }}
                    >
                      {s.platform}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeSaved(i)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,51,102,0.5)",
                    fontSize: "1.1rem",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Change password */}
      <Card title="CHANGE PASSWORD">
        <Field label="Current password">
          <input
            type="password"
            value={currPass}
            onChange={(e) => setCurrPass(e.target.value)}
            style={inp}
            placeholder="••••••••"
          />
        </Field>
        <Field label="New password" hint="Minimum 6 characters">
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            style={inp}
            placeholder="••••••••"
          />
        </Field>
        <button
          onClick={changePassword}
          style={{
            padding: "12px 24px",
            background: "var(--c-surface2)",
            border: "1px solid var(--c-border2)",
            borderRadius: "var(--r-sm)",
            color: "var(--c-text)",
            fontFamily: "var(--f-display)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          UPDATE PASSWORD
        </button>
      </Card>

      {/* ✅ NEW: YouTube-style history & activity panel */}
      <ActivityPanel />
    </div>
  );
}

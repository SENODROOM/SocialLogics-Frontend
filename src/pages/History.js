import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { historyAPI } from "../utils/api";
import { PLATFORMS } from "../utils/constants";
import toast from "react-hot-toast";

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 8,
        animation: "pulse 1.6s ease infinite",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      />
      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}
      >
        <div
          style={{
            height: 13,
            width: "55%",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            height: 10,
            width: "35%",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 4,
          }}
        />
      </div>
      <div
        style={{
          width: 90,
          height: 28,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          width: 28,
          height: 28,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

// ── Single history row ─────────────────────────────────────────────────────────
function HistoryRow({
  item,
  onRemove,
  onReSearch,
  selected,
  onSelect,
  removing,
}) {
  const [hovered, setHovered] = useState(false);
  const platform = PLATFORMS.find((p) => p.id === item.platform);
  const color = platform?.color || "var(--c-cyan)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        background: selected
          ? "rgba(0,212,255,0.06)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
        border: `1px solid ${selected ? "rgba(0,212,255,0.35)" : hovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
        borderLeft: `3px solid ${removing ? "rgba(255,51,102,0.5)" : color}`,
        borderRadius: 8,
        transition: "all 180ms cubic-bezier(.16,1,.3,1)",
        opacity: removing ? 0.4 : 1,
        transform: removing ? "translateX(8px)" : "none",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {/* Checkbox — appears on hover or when something is selected */}
      <div
        onClick={() => onSelect(item._id)}
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          flexShrink: 0,
          border: `1.5px solid ${selected ? "var(--c-cyan)" : "rgba(255,255,255,0.2)"}`,
          background: selected ? "var(--c-cyan)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 150ms",
          opacity: hovered || selected ? 1 : 0,
        }}
      >
        {selected && (
          <span style={{ color: "#000", fontSize: "0.6rem", fontWeight: 900 }}>
            ✓
          </span>
        )}
      </div>

      {/* Platform dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          boxShadow: hovered ? `0 0 8px ${color}80` : "none",
          transition: "box-shadow 150ms",
        }}
      />

      {/* Query + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: "0.88rem",
            color: hovered ? "#fff" : "var(--c-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 150ms",
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
            alignItems: "center",
          }}
        >
          <span style={{ color: color + "aa", fontWeight: 600 }}>
            {platform?.name || item.platform}
          </span>
          {item.contentType && item.contentType !== "all" && (
            <span style={{ color: "var(--c-text4)" }}>
              · {item.contentType}
            </span>
          )}
          <span>·</span>
          <span>
            {new Date(item.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Actions — always visible on hover, only × visible otherwise */}
      <div
        style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}
      >
        {hovered && (
          <button
            onClick={() => onReSearch(item)}
            style={{
              padding: "5px 12px",
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              borderRadius: 6,
              color: "var(--c-cyan)",
              fontFamily: "var(--f-display)",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              transition: "all 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,212,255,0.15)";
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,212,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)";
            }}
          >
            ↗ Search again
          </button>
        )}
        <button
          onClick={() => onRemove(item._id)}
          title="Remove"
          disabled={removing}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            flexShrink: 0,
            background: hovered ? "rgba(255,51,102,0.1)" : "transparent",
            border: `1px solid ${hovered ? "rgba(255,51,102,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: hovered ? "var(--c-red)" : "var(--c-text4)",
            fontSize: "1rem",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 120ms",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,51,102,0.18)";
            e.currentTarget.style.color = "var(--c-red)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = hovered
              ? "rgba(255,51,102,0.1)"
              : "transparent";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ── Main History page ─────────────────────────────────────────────────────────
export default function History() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [removingIds, setRemovingIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [clearingAll, setClearingAll] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(
    async (p = 1, q = searchQ, plat = filterPlatform) => {
      setLoading(true);
      try {
        const res = await historyAPI.get(p, {
          q: q || undefined,
          platform: plat || undefined,
        });
        const d = res.data.data;
        setHistory(d.history);
        setTotal(d.total);
        setPages(d.pages);
        setPage(p);
        setSelectedIds(new Set());
      } catch {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    },
    [searchQ, filterPlatform],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  // ── Debounced search filter ───────────────────────────────────────────────
  const handleSearchChange = (val) => {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val, filterPlatform), 320);
  };

  const handlePlatformChange = (val) => {
    setFilterPlatform(val);
    load(1, searchQ, val);
  };

  // ── Remove single (optimistic) ────────────────────────────────────────────
  const remove = useCallback(
    async (id) => {
      setRemovingIds((s) => new Set(s).add(id));
      // Optimistic update after brief visual delay
      setTimeout(() => {
        setHistory((h) => h.filter((i) => i._id !== id));
        setTotal((t) => t - 1);
      }, 200);
      try {
        await historyAPI.delete(id);
      } catch {
        // Rollback
        setHistory((h) => h); // trigger re-fetch
        load(page);
        toast.error("Failed to remove");
      } finally {
        setRemovingIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    },
    [load, page],
  );

  // ── Bulk remove selected ──────────────────────────────────────────────────
  const removeSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    // Optimistic
    setHistory((h) => h.filter((i) => !ids.includes(i._id)));
    setTotal((t) => t - ids.length);
    setSelectedIds(new Set());
    try {
      await Promise.all(ids.map((id) => historyAPI.delete(id)));
      toast.success(`Removed ${ids.length} item${ids.length > 1 ? "s" : ""}`);
    } catch {
      load(page);
      toast.error("Some items failed to delete");
    }
  };

  // ── Select / deselect ────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map((i) => i._id)));
    }
  };

  // ── Clear all ────────────────────────────────────────────────────────────
  const clearAll = async () => {
    if (
      !window.confirm(`Permanently clear all ${total} search history entries?`)
    )
      return;
    setClearingAll(true);
    try {
      await historyAPI.clear();
      setHistory([]);
      setTotal(0);
      setSelectedIds(new Set());
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    } finally {
      setClearingAll(false);
    }
  };

  // ── Re-search ────────────────────────────────────────────────────────────
  const reSearch = (item) => {
    navigate(
      `/search?q=${encodeURIComponent(item.query)}&platform=${item.platform}`,
    );
  };

  const allSelected = history.length > 0 && selectedIds.size === history.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "0.58rem",
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
            Search History
          </h1>
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.72rem",
              color: "var(--c-text3)",
              marginTop: 6,
            }}
          >
            {loading ? "—" : total.toLocaleString()} searches recorded
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {someSelected && (
            <button
              onClick={removeSelected}
              style={{
                padding: "8px 16px",
                background: "rgba(255,51,102,0.1)",
                border: "1px solid rgba(255,51,102,0.35)",
                borderRadius: 6,
                color: "var(--c-red)",
                fontFamily: "var(--f-display)",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                animation: "fadeUp 0.2s ease",
              }}
            >
              DELETE {selectedIds.size} SELECTED
            </button>
          )}
          {!loading && total > 0 && (
            <button
              onClick={clearAll}
              disabled={clearingAll}
              style={{
                padding: "8px 18px",
                background: "rgba(255,51,102,0.06)",
                border: "1px solid rgba(255,51,102,0.25)",
                borderRadius: 6,
                color: "rgba(255,51,102,0.7)",
                fontFamily: "var(--f-display)",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              {clearingAll ? "CLEARING..." : "CLEAR ALL"}
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--c-text4)",
              fontSize: "0.9rem",
              pointerEvents: "none",
            }}
          >
            ⌕
          </span>
          <input
            value={searchQ}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Filter by query..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 34px",
              fontSize: "0.85rem",
            }}
          />
          {searchQ && (
            <button
              onClick={() => handleSearchChange("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--c-text4)",
                fontSize: "1rem",
                padding: 2,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          )}
        </div>
        <select
          value={filterPlatform}
          onChange={(e) => handlePlatformChange(e.target.value)}
          style={{ padding: "10px 14px", fontSize: "0.78rem", minWidth: 140 }}
        >
          <option value="">All platforms</option>
          {PLATFORMS.filter((p) => p.id !== "all").map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Bulk select bar ─────────────────────────────────────────────── */}
      {!loading && history.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 6,
          }}
        >
          <button
            onClick={selectAll}
            style={{
              background: "none",
              border: "none",
              color: "var(--c-text3)",
              fontFamily: "var(--f-mono)",
              fontSize: "0.68rem",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: `1.5px solid ${allSelected ? "var(--c-cyan)" : "rgba(255,255,255,0.25)"}`,
                background: allSelected ? "var(--c-cyan)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {allSelected && (
                <span
                  style={{ color: "#000", fontSize: "0.5rem", fontWeight: 900 }}
                >
                  ✓
                </span>
              )}
            </div>
            {allSelected ? "Deselect all" : `Select all (${history.length})`}
          </button>
          {someSelected && (
            <span
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: "0.65rem",
                color: "var(--c-cyan)",
                marginLeft: 4,
              }}
            >
              {selectedIds.size} selected
            </span>
          )}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.2 }}>
            🔍
          </div>
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--c-text3)",
              marginBottom: 8,
            }}
          >
            {searchQ || filterPlatform
              ? "No matches found"
              : "No search history"}
          </div>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.75rem",
              color: "var(--c-text4)",
            }}
          >
            {searchQ || filterPlatform
              ? "Try a different filter"
              : "Your searches will appear here"}
          </div>
          {(searchQ || filterPlatform) && (
            <button
              onClick={() => {
                setSearchQ("");
                setFilterPlatform("");
                load(1, "", "");
              }}
              style={{
                marginTop: 16,
                padding: "8px 18px",
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.3)",
                borderRadius: 6,
                color: "var(--c-cyan)",
                fontFamily: "var(--f-display)",
                fontSize: "0.7rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {history.map((item) => (
              <HistoryRow
                key={item._id}
                item={item}
                onRemove={remove}
                onReSearch={reSearch}
                selected={selectedIds.has(item._id)}
                onSelect={toggleSelect}
                removing={removingIds.has(item._id)}
              />
            ))}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {pages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 4,
                marginTop: 28,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  color: "var(--c-text3)",
                  fontFamily: "var(--f-display)",
                  fontSize: "0.7rem",
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>

              {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 6,
                      background:
                        page === p
                          ? "rgba(0,212,255,0.15)"
                          : "var(--c-surface)",
                      border: `1px solid ${page === p ? "var(--c-cyan)" : "var(--c-border)"}`,
                      color: page === p ? "var(--c-cyan)" : "var(--c-text3)",
                      fontFamily: "var(--f-display)",
                      fontSize: "0.72rem",
                      transition: "all 120ms",
                    }}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => load(page + 1)}
                disabled={page >= pages}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  color: "var(--c-text3)",
                  fontFamily: "var(--f-display)",
                  fontSize: "0.7rem",
                  opacity: page >= pages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}

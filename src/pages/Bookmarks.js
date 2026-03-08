import { useState, useEffect, useCallback } from "react";
import { bookmarksAPI } from "../utils/api";
import { PLATFORMS } from "../utils/constants";
import { EmptyState, Badge } from "../components/ui";
import toast from "react-hot-toast";

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    collection: "",
    platform: "",
    sort: "newest",
    q: "",
    favorite: false,
  });
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.collection) delete params.collection;
      if (!params.platform) delete params.platform;
      if (!params.q) delete params.q;
      if (!params.favorite) delete params.favorite;
      const res = await bookmarksAPI.get(params);
      const d = res.data.data;
      setBookmarks(d.bookmarks);
      setCollections(d.collections);
      setTotal(d.total);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    await bookmarksAPI.delete(id);
    setBookmarks((b) => b.filter((x) => x._id !== id));
    toast.success("Removed");
  };

  const toggleFav = async (id) => {
    const res = await bookmarksAPI.toggleFavorite(id);
    setBookmarks((b) =>
      b.map((x) =>
        x._id === id ? { ...x, isFavorite: res.data.data.isFavorite } : x,
      ),
    );
  };

  const saveEdit = async (id) => {
    await bookmarksAPI.update(id, { notes: editNotes });
    setBookmarks((b) =>
      b.map((x) => (x._id === id ? { ...x, notes: editNotes } : x)),
    );
    setEditingId(null);
    toast.success("Notes saved");
  };

  const getColor = (id) =>
    PLATFORMS.find((p) => p.id === id)?.color || "var(--c-cyan)";
  const getPlatform = (id) => PLATFORMS.find((p) => p.id === id);

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}
    >
      <div style={{ marginBottom: 32 }}>
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
          Bookmarks
        </h1>
        <p
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: "0.75rem",
            color: "var(--c-text3)",
            marginTop: 6,
          }}
        >
          {total.toLocaleString()} saved items
        </p>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}
      >
        <input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Search bookmarks..."
          style={{
            flex: 1,
            minWidth: 180,
            padding: "9px 14px",
            fontSize: "0.85rem",
          }}
        />
        <select
          value={filters.collection}
          onChange={(e) =>
            setFilters((f) => ({ ...f, collection: e.target.value }))
          }
          style={{ padding: "9px 12px", fontSize: "0.75rem", minWidth: 130 }}
        >
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.platform}
          onChange={(e) =>
            setFilters((f) => ({ ...f, platform: e.target.value }))
          }
          style={{ padding: "9px 12px", fontSize: "0.75rem", minWidth: 130 }}
        >
          <option value="">All platforms</option>
          {PLATFORMS.filter((p) => p.id !== "all").map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          style={{ padding: "9px 12px", fontSize: "0.75rem" }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A-Z</option>
        </select>
        <button
          onClick={() => setFilters((f) => ({ ...f, favorite: !f.favorite }))}
          style={{
            padding: "9px 16px",
            background: filters.favorite
              ? "rgba(251,191,36,0.12)"
              : "var(--c-surface)",
            border: `1px solid ${filters.favorite ? "rgba(251,191,36,0.4)" : "var(--c-border)"}`,
            borderRadius: "var(--r-sm)",
            color: filters.favorite ? "var(--c-gold)" : "var(--c-text3)",
            fontFamily: "var(--f-body)",
            fontSize: "0.8rem",
          }}
        >
          ★ Favorites
        </button>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--c-text4)",
            fontFamily: "var(--f-mono)",
            letterSpacing: "0.2em",
          }}
        >
          LOADING...
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon="☆"
          title="No bookmarks"
          subtitle="Save search results to see them here"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
            gap: 12,
          }}
        >
          {bookmarks.map((b) => {
            const plat = getPlatform(b.platform);
            const color = getColor(b.platform);
            return (
              <div
                key={b._id}
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--r-lg)",
                  padding: "18px 20px",
                  borderLeft: `3px solid ${color}`,
                  transition: "all var(--t-mid)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--c-surface2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--c-surface)")
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.85rem",
                        marginBottom: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Badge color={color}>{plat?.name || b.platform}</Badge>
                      {b.isFavorite && (
                        <Badge color="var(--c-gold)">★ Fav</Badge>
                      )}
                      {b.collection !== "Default" && (
                        <span
                          style={{
                            fontFamily: "var(--f-mono)",
                            fontSize: "0.62rem",
                            color: "var(--c-text4)",
                          }}
                        >
                          📁 {b.collection}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleFav(b._id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: b.isFavorite
                          ? "var(--c-gold)"
                          : "var(--c-text4)",
                        fontSize: "1rem",
                        padding: "2px",
                      }}
                    >
                      {b.isFavorite ? "★" : "☆"}
                    </button>
                    <button
                      onClick={() => remove(b._id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,51,102,0.5)",
                        fontSize: "1.1rem",
                        padding: "2px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {editingId === b._id ? (
                  <div style={{ marginBottom: 10 }}>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        fontSize: "0.78rem",
                        height: 64,
                        resize: "none",
                        borderRadius: "var(--r-sm)",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => saveEdit(b._id)}
                        style={{
                          padding: "5px 14px",
                          background: "rgba(0,212,255,0.1)",
                          border: "1px solid rgba(0,212,255,0.3)",
                          borderRadius: "var(--r-sm)",
                          color: "var(--c-cyan)",
                          fontFamily: "var(--f-display)",
                          fontSize: "0.62rem",
                        }}
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: "5px 14px",
                          background: "transparent",
                          border: "1px solid var(--c-border)",
                          borderRadius: "var(--r-sm)",
                          color: "var(--c-text3)",
                          fontFamily: "var(--f-display)",
                          fontSize: "0.62rem",
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  b.notes && (
                    <div
                      style={{
                        fontFamily: "var(--f-mono)",
                        fontSize: "0.72rem",
                        color: "var(--c-text3)",
                        marginBottom: 10,
                        fontStyle: "italic",
                      }}
                    >
                      "{b.notes}"
                    </div>
                  )
                )}

                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      padding: "9px",
                      background: color + "18",
                      border: `1px solid ${color}40`,
                      borderRadius: "var(--r-sm)",
                      textAlign: "center",
                      color,
                      fontFamily: "var(--f-display)",
                      fontWeight: 700,
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                    }}
                  >
                    OPEN →
                  </a>
                  <button
                    onClick={() => {
                      setEditingId(b._id);
                      setEditNotes(b.notes || "");
                    }}
                    style={{
                      padding: "9px 12px",
                      background: "var(--c-surface)",
                      border: "1px solid var(--c-border)",
                      borderRadius: "var(--r-sm)",
                      color: "var(--c-text3)",
                      fontSize: "0.85rem",
                    }}
                  >
                    ✎
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;

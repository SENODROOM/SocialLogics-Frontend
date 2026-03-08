import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/search", label: "Search" },
  { path: "/history", label: "History", auth: true },
  { path: "/bookmarks", label: "Bookmarks", auth: true },
  { path: "/dashboard", label: "Dashboard", auth: true },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {}, [location]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    navigate("/");
  };

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 900,
          background: scrolled ? "rgba(3,7,15,0.95)" : "rgba(3,7,15,0.8)",
          backdropFilter: "blur(24px)",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1.5px solid var(--c-cyan)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--c-cyan)",
                fontSize: "0.9rem",
                boxShadow: "0 0 12px rgba(0,212,255,0.3)",
                animation: "glow-pulse 3s ease infinite",
              }}
            >
              ⬡
            </div>
            <span
              style={{
                fontFamily: "var(--f-display)",
                fontWeight: 800,
                fontSize: "1.05rem",
                letterSpacing: "0.04em",
                background:
                  "linear-gradient(135deg,var(--c-cyan) 0%,#fff 50%,#0080ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SocialLogics
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
            {NAV.filter((l) => !l.auth || user).map((l) => (
              <Link
                key={l.path}
                to={l.path}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--r-sm)",
                  fontFamily: "var(--f-display)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: isActive(l.path) ? "var(--c-cyan)" : "var(--c-text3)",
                  background: isActive(l.path)
                    ? "rgba(0,212,255,0.08)"
                    : "transparent",
                  transition: "all var(--t-fast)",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(l.path))
                    e.currentTarget.style.color = "var(--c-text)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive(l.path))
                    e.currentTarget.style.color = "var(--c-text3)";
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginLeft: "auto",
            }}
          >
            {user ? (
              <>
                <Link
                  to="/profile"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 12px 5px 5px",
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border2)",
                    borderRadius: "var(--r-full)",
                    textDecoration: "none",
                    transition: "all var(--t-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-cyan)";
                    e.currentTarget.style.background = "var(--c-surface2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-border2)";
                    e.currentTarget.style.background = "var(--c-surface)";
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "rgba(0,212,255,0.15)",
                      border: "1px solid rgba(0,212,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--f-display)",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      color: "var(--c-cyan)",
                    }}
                  >
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: "0.75rem",
                      color: "var(--c-text2)",
                    }}
                  >
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "6px 14px",
                    background: "transparent",
                    border: "1px solid var(--c-border2)",
                    borderRadius: "var(--r-sm)",
                    color: "var(--c-text3)",
                    fontFamily: "var(--f-display)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    transition: "all var(--t-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--c-red)";
                    e.currentTarget.style.borderColor = "rgba(255,51,102,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--c-text3)";
                    e.currentTarget.style.borderColor = "var(--c-border2)";
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button
                    style={{
                      padding: "7px 16px",
                      background: "transparent",
                      border: "1px solid var(--c-border2)",
                      borderRadius: "var(--r-sm)",
                      color: "var(--c-text2)",
                      fontFamily: "var(--f-display)",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    style={{
                      padding: "7px 18px",
                      background:
                        "linear-gradient(135deg,var(--c-cyan),#0080ff)",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      color: "#000",
                      fontFamily: "var(--f-display)",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      boxShadow: "0 2px 12px rgba(0,212,255,0.3)",
                    }}
                  >
                    Sign up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Scanline */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "1.5px",
          background:
            "linear-gradient(transparent,rgba(0,212,255,0.05),transparent)",
          animation: "scanline 12s linear infinite",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    </>
  );
}

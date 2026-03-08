import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  fontSize: "0.9rem",
  borderRadius: 4,
  boxSizing: "border-box",
};

const Field = ({ label, type, value, onChange, placeholder, onKeyDown }) => (
  <div style={{ marginBottom: 20 }}>
    <label
      style={{
        display: "block",
        fontFamily: "var(--f-display)",
        fontSize: "0.6rem",
        letterSpacing: "0.2em",
        color: "rgba(0,212,255,0.6)",
        marginBottom: 8,
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={inputStyle}
    />
  </div>
);

/* ── Social provider configs ── */
const SOCIAL_PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    color: "#fff",
    bg: "#fff",
    textColor: "#1f1f1f",
    border: "1px solid rgba(0,0,0,0.12)",
    hoverBg: "#f5f5f5",
    logo: (
      <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
        <path
          fill="#EA4335"
          d="M24 9.5c3.1 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 3.5 29.3 1.5 24 1.5 14.8 1.5 7 7.4 3.7 15.6l6.7 5.2C12 14.1 17.5 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.4c4.1-3.8 6.5-9.4 6.5-16.2z"
        />
        <path
          fill="#FBBC05"
          d="M10.4 28.8C9.8 27.1 9.5 25.3 9.5 23.5s.3-3.6.9-5.2l-6.7-5.2C2 16.1 1 19.7 1 23.5s1 7.4 2.7 10.4l6.7-5.1z"
        />
        <path
          fill="#34A853"
          d="M24 46.5c5.3 0 9.8-1.8 13.1-4.8l-7-5.4c-1.8 1.2-4.1 1.9-6.1 1.9-6.5 0-12-4.6-13.6-10.9l-6.7 5.1C7 40.5 14.8 46.5 24 46.5z"
        />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    color: "#1877F2",
    bg: "#1877F2",
    textColor: "#fff",
    border: "none",
    hoverBg: "#0d65d8",
    logo: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="white"
        style={{ flexShrink: 0 }}
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Continue with Instagram",
    color: "#E1306C",
    bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    textColor: "#fff",
    border: "none",
    hoverBg:
      "linear-gradient(45deg, #e08322 0%, #d5572b 25%, #cb1632 50%, #bb1255 100%)",
    logo: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="white"
        style={{ flexShrink: 0 }}
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
];

function SocialButton({ provider, onClick, loading }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onClick(provider.id)}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "11px 16px",
        background: hovered ? provider.hoverBg : provider.bg,
        border: provider.border,
        borderRadius: 7,
        color: provider.textColor,
        fontFamily: "var(--f-body, system-ui)",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        transition: "all 160ms ease",
        opacity: loading ? 0.7 : 1,
        boxSizing: "border-box",
      }}
    >
      {provider.logo}
      {provider.label}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "22px 0",
      }}
    >
      <div
        style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }}
      />
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.12em",
        }}
      >
        OR
      </span>
      <div
        style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }}
      />
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setSocialLoading(provider);
    // Redirect to backend OAuth route
    // The backend will redirect back with a token after OAuth flow
    const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const onKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 900,
              fontSize: "1.4rem",
              letterSpacing: "0.08em",
              background: "linear-gradient(135deg,var(--c-cyan),#fff,#0080ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ⬡ SOCIALLOGICS
          </Link>
          <h2
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "1rem",
              fontWeight: 700,
              marginTop: 24,
              marginBottom: 8,
              letterSpacing: "0.1em",
            }}
          >
            SIGN IN
          </h2>
          <p
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: "0.72rem",
              color: "rgba(0,212,255,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            ACCESS YOUR ACCOUNT
          </p>
        </div>

        <div
          style={{
            background: "rgba(9,20,34,0.92)",
            border: "1px solid rgba(0,212,255,0.15)",
            borderRadius: 10,
            padding: "36px 32px",
          }}
        >
          {/* Social login buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 4,
            }}
          >
            {SOCIAL_PROVIDERS.map((provider) => (
              <SocialButton
                key={provider.id}
                provider={provider}
                onClick={handleSocialLogin}
                loading={socialLoading === provider.id}
              />
            ))}
          </div>

          <Divider />

          {/* Email/password */}
          <Field
            label="EMAIL"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={onKey}
          />
          <Field
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={onKey}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg,var(--c-cyan),#0080ff)",
              color: "#000",
              borderRadius: 6,
              fontFamily: "var(--f-display)",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              marginTop: 8,
              transition: "all 0.2s",
              cursor: loading ? "default" : "pointer",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontFamily: "var(--f-mono)",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            No account?{" "}
            <Link to="/register" style={{ color: "var(--c-cyan)" }}>
              Register
            </Link>
          </p>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontFamily: "var(--f-mono)",
            fontSize: "0.62rem",
            color: "rgba(255,255,255,0.2)",
            lineHeight: 1.6,
          }}
        >
          By continuing, you agree to SocialLogics Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}

export default Login;

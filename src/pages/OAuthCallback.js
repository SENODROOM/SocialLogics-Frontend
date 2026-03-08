/**
 * frontend/src/pages/OAuthCallback.js
 *
 * This page is loaded after a successful OAuth redirect from the backend.
 * The backend redirects to: /oauth-callback?token=JWT_TOKEN
 * We grab the token, store it, fetch the user, and redirect home.
 *
 * Add to App.js routes:
 *   import OAuthCallback from './pages/OAuthCallback';
 *   <Route path="/oauth-callback" element={<OAuthCallback />} />
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";
import toast from "react-hot-toast";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error || !token) {
      setStatus("Authentication failed.");
      toast.error("Social login failed. Please try again.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    // Store token and fetch user profile
    localStorage.setItem("sl_token", token);
    authAPI
      .me()
      .then((r) => {
        const user = r.data?.data?.user || r.data?.user;
        if (user) {
          updateUser(user);
          toast.success(`Welcome, ${user.username}! 🎉`);
          navigate("/", { replace: true });
        } else {
          throw new Error("Could not load user profile");
        }
      })
      .catch((err) => {
        localStorage.removeItem("sl_token");
        setStatus("Sign-in failed.");
        toast.error(err.message || "Login failed");
        setTimeout(() => navigate("/login"), 2000);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      {/* Spinner */}
      <div style={{ position: "relative", width: 56, height: 56 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(0,212,255,.1)",
            borderTop: "2px solid var(--c-cyan)",
            animation: "spin 0.7s linear infinite",
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
            fontSize: "1.2rem",
          }}
        >
          ⬡
        </div>
      </div>
      <div
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: "0.8rem",
          color: "var(--c-text3)",
          letterSpacing: "0.2em",
        }}
      >
        {status}
      </div>
    </div>
  );
}

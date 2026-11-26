import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleIcon, LockIcon, ShieldCheckIcon } from "../components/Icons";

export default function Login() {
  const { user, isAdmin, userRole, signInWithGoogle, signOut, authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      await signInWithGoogle();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to initialize Google authentication.");
      }
      setLoading(false);
    }
  };

  const displayError = authError || errorMsg;

  return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass-panel" style={{ maxWidth: "480px", width: "100%", padding: "2.75rem 2.25rem", textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "rgba(217, 119, 6, 0.15)",
            border: "1px solid rgba(217, 119, 6, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            color: "var(--primary-light)",
          }}
        >
          <LockIcon size={26} />
        </div>

        <h1 style={{ fontSize: "1.9rem", marginBottom: "0.5rem" }}>TeaceLock Identity Guard</h1>
        <p style={{ fontSize: "0.92rem", marginBottom: "2rem", color: "var(--text-secondary)" }}>
          Access to manufacturer creation, ledger auditing, and supply-chain administration is restricted to authorized operators.
        </p>

        {user ? (
          <div>
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface-2)",
                border: "1px solid var(--border-medium)",
                marginBottom: "1.5rem",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {user.user_metadata?.full_name || user.email}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  className="step-type-badge"
                  style={{
                    fontSize: "0.72rem",
                    background: isAdmin ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    borderColor: isAdmin ? "#10b981" : "#ef4444",
                    color: isAdmin ? "#10b981" : "#ef4444",
                  }}
                >
                  {isAdmin ? "ROLE: AUTHORIZED ADMIN" : `ROLE: ${userRole ? userRole.toUpperCase() : "STANDARD VIEWER"}`}
                </span>
              </div>
            </div>

            {isAdmin ? (
              <a href="/admin" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}>
                <ShieldCheckIcon size={18} />
                <span>Enter Admin Console</span>
              </a>
            ) : (
              <div className="status-alert error" style={{ marginBottom: "1.5rem" }}>
                <span>Access Denied: Your Google account is not configured as an administrator.</span>
              </div>
            )}

            <button onClick={signOut} className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            {displayError && (
              <div className="status-alert error" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
                <span>{displayError}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "14px",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderColor: "var(--border-medium)",
              }}
            >
              <GoogleIcon size={20} />
              <span>{loading ? "Connecting to Google..." : "Sign in with Google"}</span>
            </button>

            <div style={{ marginTop: "1.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Protected by TeaceLock Multi-Tenant OAuth. Session tokens are signed via cryptographic state validation. Made by Aayan Srivastwa
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


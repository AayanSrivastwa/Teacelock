import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LockIcon } from "./Icons";
import Unauthorized from "./Unauthorized";

type Role = "admin" | "manufacturer" | "distributor" | "retailer" | "customer";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
  redirectTo?: string;
  unauthorizedMessage?: string;
}

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
  unauthorizedMessage,
}: ProtectedRouteProps) {
  const { user, isAdmin, loading, userRole, authError } = useAuth();

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
        <div className="live-dot" style={{ width: "16px", height: "16px", margin: "0 auto 1.5rem" }}></div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--primary-light)" }}>
          Authenticating security privileges...
        </p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="page-container" style={{ maxWidth: "560px", margin: "4rem auto", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "3rem 2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "var(--danger)",
            }}
          >
            <LockIcon size={26} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Authentication Error</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {authError}
          </p>
          <a href="/" className="btn-secondary">
            Return to Public Portal
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If specific roles are required, check against the user's role
  if (roles && roles.length > 0) {
    const hasRole = roles.includes(userRole as Role) || (roles.includes("admin") && isAdmin);
    if (!hasRole) {
      return (
        <Unauthorized
          message={unauthorizedMessage || "Access Denied"}
          userEmail={user.email}
          requiredRole={roles.join(" / ")}
        />
      );
    }
  }

  return <>{children}</>;
}

/**
 * Admin-only route wrapper. Only users with the admin role can access.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, userRole, authError } = useAuth();

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "6rem 1.5rem" }}>
        <div className="live-dot" style={{ width: "16px", height: "16px", margin: "0 auto 1.5rem" }}></div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--primary-light)" }}>
          Authenticating admin privileges...
        </p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="page-container" style={{ maxWidth: "560px", margin: "4rem auto", textAlign: "center" }}>
        <div className="glass-panel" style={{ padding: "3rem 2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              color: "var(--danger)",
            }}
          >
            <LockIcon size={26} />
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Authentication Error</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            {authError}
          </p>
          <a href="/" className="btn-secondary">
            Return to Public Portal
          </a>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin || userRole !== "admin") {
    return (
      <Unauthorized
        message="Admin Access Required"
        userEmail={user?.email ?? null}
        requiredRole="admin"
      />
    );
  }

  return <>{children}</>;
}


import { NavLink } from "react-router-dom";
import { LockIcon } from "./Icons";

interface UnauthorizedProps {
  message?: string;
  userEmail?: string | null;
  requiredRole?: string;
}

export default function Unauthorized({
  message = "Access Denied",
  userEmail,
  requiredRole,
}: UnauthorizedProps) {
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
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{message}</h2>
        {userEmail && (
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            Account: <code>{userEmail}</code>
          </p>
        )}
        {requiredRole && (
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Required role: <strong>{requiredRole}</strong>
          </p>
        )}
        {!requiredRole && (
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            This account does not have authorization to access this area.
          </p>
        )}
        <NavLink to="/" className="btn-secondary" style={{ display: "inline-block", marginTop: "0.5rem" }}>
          Return to Public Portal
        </NavLink>
      </div>
    </div>
  );
}
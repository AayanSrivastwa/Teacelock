import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import Manufacturer from "./pages/Manufacturer";
import Verify from "./pages/verify";
import QRScanner from "./components/Qrscanner";
import Login from "./pages/Login";
import AdminPortal from "./pages/AdminPortal";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";
import BackgroundMesh from "./components/BackgroundMesh";
import InteractiveTerminal from "./components/InteractiveTerminal";
import WalletButton from "./components/WalletButton";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Web3Provider } from "./context/Web3Context";
import { 
  SunIcon,
  MoonIcon,
  LogOutIcon,
  ShieldCheckIcon,
  ScanIcon,
  CpuIcon,
  ArrowRightIcon
} from "./components/Icons";
import "./App.css";

function HomePage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--primary-light)" }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Hero Section with distinct Brand Badge & Hologram Headline */}
      <section className="hero-section">
        <div className="hero-pill-badge">
          <span className="brand-dot"></span>
          <span>EVM Blockchain & SHA-256 Provenance</span>
        </div>

        <h1 className="hero-title">
          Authenticity, cryptographically{" "}
          <span className="hero-highlight-gradient">sealed.</span>
        </h1>

        <p className="hero-subtitle">
          TeaceLock binds high-value physical goods to unalterable cryptographic state hashes and smart contracts.
          Verify manufacturer origins, detect counterfeits in milliseconds, and audit the live supply-chain ledger.
        </p>

        <div className="hero-actions">
          <Link
            to={user && isAdmin ? "/admin" : "/login"}
            className="btn-hero-primary"
          >
            <span>{user && isAdmin ? "Admin Operations Portal" : "Enter Brand Portal"}</span>
            <ArrowRightIcon size={16} />
          </Link>

          <Link to="/scan" className="btn-hero-secondary">
            <ScanIcon size={18} />
            <span>Scan Physical QR</span>
          </Link>
        </div>

        {/* Live Interactive Ledger Terminal */}
        <InteractiveTerminal />
      </section>

      {/* Feature Cards with Unique Card Accents */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-card-header">
            <span className="feature-card-tag">#01 // CRYPTO-GENESIS</span>
            <CpuIcon size={18} color="var(--neon-green)" />
          </div>
          <div className="feature-card-title">SHA-256 State Hashing</div>
          <p className="feature-card-desc">
            Each batch computes an unforgeable 256-bit hash combining timestamp, manufacturer seed, and SKU metadata into an unalterable genesis block.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card-header">
            <span className="feature-card-tag">#02 // BLOCKCHAIN ANCHOR</span>
            <ShieldCheckIcon size={18} color="var(--neon-green)" />
          </div>
          <div className="feature-card-title">Smart Contract Attestation</div>
          <p className="feature-card-desc">
            Directly binds product fingerprints to EVM blockchains (Polygon / Ethereum). Records custody transitions with immutable cryptographic receipts.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card-header">
            <span className="feature-card-tag">#03 // ZERO-FRICTION</span>
            <ScanIcon size={18} color="var(--neon-cyan)" />
          </div>
          <div className="feature-card-title">Instant Browser Audit</div>
          <p className="feature-card-desc">
            High-density QR tags resolve instantly in the browser without third-party app installations, cross-checking hash proofs against on-chain contract states.
          </p>
        </div>
      </div>
    </div>
  );
}

function NavigationBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-content">
        {/* Brand Link */}
        <Link to="/" className="brand-link">
          <span className="brand-dot"></span>
          <span className="brand-name">TeaceLock</span>
          <span className="brand-badge">On-Chain v2.2</span>
        </Link>

        {/* Center Links */}
        <nav className="nav-center-links">
          <NavLink to="/" end className="nav-text-link">
            Architecture
          </NavLink>
          <NavLink to="/verify" className="nav-text-link">
            Proof of Authenticity
          </NavLink>
          <NavLink to="/scan" className="nav-text-link">
            Live Scanner
          </NavLink>
          {user && isAdmin && (
            <NavLink to="/manufacturer" className="nav-text-link">
              Factory Mint
            </NavLink>
          )}
        </nav>

        {/* Right Nav */}
        <div className="nav-right-actions">
          {/* Web3 Wallet Connect */}
          <WalletButton />

          {/* Theme switch */}
          <button 
            type="button" 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>

          {/* Admin portal shortcut */}
          {user && isAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link to="/admin" className="btn-nav-admin">
                Console Active ↗
              </Link>
              <button 
                onClick={signOut} 
                className="theme-toggle-btn" 
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-nav-admin">
              Admin Portal
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Web3Provider>
          <BrowserRouter>
            {/* Dynamic cryptographic scanline & dual-color hologram background */}
            <BackgroundMesh />

            <div className="app-container">
              <NavigationBar />

              {/* Dynamic Routes */}
              <main style={{ flex: 1 }}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/scan" element={<QRScanner />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/login" element={<Login />} />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPortal />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/manufacturer"
                    element={
                      <ProtectedRoute roles={["admin", "manufacturer"]}>
                        <Manufacturer />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>

              {/* Tech Footer */}
              <footer className="footer">
                <div className="footer-inner">
                  <div>
                    <span>© {new Date().getFullYear()} <strong>TeaceLock Protocol</strong>. Tamper-proof cryptographic & blockchain provenance.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    <span>EVM Smart Contracts</span>
                    <span>•</span>
                    <span>SHA-256 Engine</span>
                    <span>•</span>
                    <span>PostgreSQL Audit State</span>
                  </div>
                </div>
              </footer>
            </div>
          </BrowserRouter>
        </Web3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

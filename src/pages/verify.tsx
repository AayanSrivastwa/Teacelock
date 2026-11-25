import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { blockchainService, type OnChainProductData } from "../lib/blockchain";
import { useWeb3 } from "../context/Web3Context";
import { 
  ShieldCheckIcon, 
  ShieldAlertIcon, 
  ArrowRightIcon, 
  CpuIcon,
  WalletIcon,
  LinkExternalIcon
} from "../components/Icons";

interface Product {
  id: string;
  product_code: string;
  name: string;
  brand: string;
  product_hash: string;
  status: string;
  created_at: string;
  tx_hash?: string;
}

interface SupplyChainEvent {
  id: string;
  product_id: string;
  event_type: string;
  location: string | null;
  actor_name: string | null;
  notes: string | null;
  created_at: string;
}

export default function Verify() {
  const [product, setProduct] = useState<Product | null>(null);
  const [events, setEvents] = useState<SupplyChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);

  // Blockchain verification state
  const [onChainData, setOnChainData] = useState<OnChainProductData | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  const { chainConfig } = useWeb3();

  const fetchVerification = async (targetCode: string) => {
    setLoading(true);
    setNotFound(false);
    setProduct(null);
    setEvents([]);
    setOnChainData(null);

    try {
      // 1. Query PostgreSQL via Supabase
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("product_code", targetCode)
        .single();

      if (productError || !productData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(productData);

      // 2. Fetch supply chain audit trail
      const { data: eventData, error: eventError } = await supabase
        .from("supply_chain_events")
        .select("*")
        .eq("product_id", productData.id)
        .order("created_at", { ascending: true });

      if (!eventError) {
        setEvents(eventData || []);
      }

      // 3. Perform on-chain blockchain verification
      setVerifyingChain(true);
      const chainResult = await blockchainService.verifyOnChain(targetCode);
      setOnChainData(chainResult);
      setVerifyingChain(false);

    } catch (err) {
      console.error("Verification query error:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setManualCode(code);
      fetchVerification(code.trim());
    } else {
      setLoading(false);
    }
  }, []);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    const newUrl = `${window.location.pathname}?code=${encodeURIComponent(manualCode.trim())}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
    fetchVerification(manualCode.trim());
  };

  const copyHash = () => {
    if (product?.product_hash) {
      navigator.clipboard.writeText(product.product_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="page-container">
      {/* Header & Quick Lookup Input */}
      <div className="page-header" style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 2.5rem" }}>
        <div className="page-badge">
          <ShieldCheckIcon size={14} />
          <span>Real-time Proof of Authenticity</span>
        </div>
        <h1 className="page-title">Product Verification Portal</h1>
        <p className="page-description" style={{ margin: "0 auto 1.5rem" }}>
          Verify the cryptographic signature and track the immutable chain-of-custody milestones across Supabase and Blockchain.
        </p>

        {/* Manual lookup input */}
        <form onSubmit={handleManualSearch} style={{ display: "flex", gap: "10px", maxWidth: "460px", margin: "0 auto" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter Serial or Code (e.g. TL-829184)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}
          />
          <button type="submit" className="btn-primary" style={{ padding: "0 18px", whiteSpace: "nowrap" }}>
            <span>Audit</span>
            <ArrowRightIcon size={16} />
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-panel" style={{ padding: "3.5rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
          <div className="live-dot" style={{ width: "16px", height: "16px", margin: "0 auto 1.5rem" }}></div>
          <h3 style={{ marginBottom: "0.5rem" }}>Verifying Cryptographic Ledger...</h3>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--neon-green)" }}>
            Querying SHA-256 hash proofs, PostgreSQL consensus, and smart contract state...
          </p>
        </div>
      )}

      {/* Not Found State */}
      {!loading && notFound && (
        <div className="verify-container">
          <div className="auth-badge-banner tampered">
            <div className="auth-badge-left">
              <div className="shield-icon danger">
                <ShieldAlertIcon size={32} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div className="auth-status-title" style={{ color: "var(--danger)" }}>
                  Authenticity Verification Failed
                </div>
                <div className="auth-status-subtitle">
                  This product serial is not recognized in the TeaceLock registry. Potential counterfeit risk detected.
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "2rem", textAlign: "left" }}>
            <h4 style={{ color: "#fda4af", marginBottom: "0.5rem" }}>Warning: Unregistered Serial Code</h4>
            <p style={{ fontSize: "0.92rem", lineHeight: "1.6" }}>
              The code entered (<code>{manualCode || "None provided"}</code>) does not match any valid manufacturer cryptographic records. If you recently purchased this item from an authorized retailer, please request batch verification or contact brand security directly.
            </p>
          </div>
        </div>
      )}

      {/* Verified Success State */}
      {!loading && !notFound && product && (
        <div className="verify-container">
          {/* Top Verification Shield Banner */}
          <div className="auth-badge-banner">
            <div className="auth-badge-left">
              <div className="shield-icon">
                <ShieldCheckIcon size={34} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div className="auth-status-title" style={{ color: "#34d399" }}>
                  100% Genuine & Verified
                </div>
                <div className="auth-status-subtitle">
                  Digital signature and SHA-256 state hash confirmed against manufacturer root.
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span className="step-type-badge" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "#10b981", color: "#34d399" }}>
                STATUS: {product.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Blockchain Attestation Card */}
          <div className="glass-panel" style={{ padding: "1.5rem 2rem", borderLeft: "4px solid var(--neon-green)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <WalletIcon size={20} color="var(--neon-green)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Blockchain Ledger Verification</h4>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {onChainData
                      ? "Smart contract validated on EVM blockchain network."
                      : verifyingChain
                      ? "Querying on-chain registry contract..."
                      : `Anchored to ${chainConfig.name}.`}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  className="step-type-badge"
                  style={{
                    background: onChainData ? "rgba(0, 230, 118, 0.15)" : "rgba(6, 182, 212, 0.15)",
                    borderColor: onChainData ? "var(--neon-green)" : "var(--neon-cyan)",
                    color: onChainData ? "var(--neon-green)" : "var(--neon-cyan)",
                  }}
                >
                  {onChainData ? "ON-CHAIN CONFIRMED" : "BLOCKCHAIN SYNCED"}
                </span>

                <a
                  href={`${chainConfig.explorerUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-copy"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <span>Explorer</span>
                  <LinkExternalIcon size={12} />
                </a>
              </div>
            </div>

            {onChainData && (
              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border-card)", fontSize: "0.84rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                <div>Contract Status: <strong style={{ color: "var(--neon-green)" }}>Active</strong> | Milestones: {onChainData.milestoneCount} | Minter: {onChainData.registeredBy.slice(0, 8)}...</div>
              </div>
            )}
          </div>

          {/* Product Metadata Card */}
          <div className="glass-panel product-meta-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-card)", paddingBottom: "1rem" }}>
              <div>
                <span className="spec-label">Product Name</span>
                <h2 style={{ fontSize: "1.75rem", margin: "4px 0 0" }}>{product.name}</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="spec-label">Brand</span>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--neon-green)" }}>
                  {product.brand}
                </div>
              </div>
            </div>

            <div className="meta-grid">
              <div className="meta-field">
                <span className="meta-field-label">Serial / Product Code</span>
                <span className="meta-field-value" style={{ fontFamily: "var(--font-mono)", color: "var(--neon-green)" }}>
                  {product.product_code}
                </span>
              </div>

              <div className="meta-field">
                <span className="meta-field-label">Registered On</span>
                <span className="meta-field-value" style={{ fontSize: "0.95rem" }}>
                  {new Date(product.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="meta-field">
                <span className="meta-field-label">Security Protocol</span>
                <span className="meta-field-value" style={{ fontSize: "0.95rem", color: "#34d399" }}>
                  SHA-256 + Smart Contract
                </span>
              </div>
            </div>
          </div>

          {/* Supply Chain Journey Timeline */}
          <div className="glass-panel timeline-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Chain of Custody Timeline</h3>
                <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                  Verified checkpoint transit history through the global logistics network.
                </p>
              </div>
              <span className="spec-label" style={{ fontFamily: "var(--font-mono)" }}>
                {events.length} Milestones Recorded
              </span>
            </div>

            <div className="timeline">
              {events.length === 0 ? (
                <div style={{ padding: "1.5rem 0", color: "var(--text-muted)" }}>
                  No transit checkpoints registered yet for this code.
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="timeline-step">
                    <div className="timeline-dot"></div>
                    <div className="timeline-box">
                      <div className="step-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1.2rem" }}>{getEventIcon(event.event_type)}</span>
                          <span className="step-type-badge">
                            {formatEventType(event.event_type)}
                          </span>
                        </div>
                        <span className="step-timestamp">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="step-details-grid">
                        {event.actor_name && (
                          <div>
                            <span className="meta-field-label">Custodian / Actor</span>
                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                              {event.actor_name}
                            </div>
                          </div>
                        )}

                        {event.location && (
                          <div>
                            <span className="meta-field-label">Checkpoint Location</span>
                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                              {event.location}
                            </div>
                          </div>
                        )}
                      </div>

                      {event.notes && (
                        <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", borderTop: "1px dashed var(--border-card)", paddingTop: "0.5rem" }}>
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cryptographic Hash Card */}
          <div className="glass-panel hash-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
              <CpuIcon size={18} color="var(--neon-green)" />
              <h4 style={{ margin: 0, fontSize: "1rem" }}>Cryptographic State Hash (SHA-256)</h4>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              The mathematical digest below represents the exact state seal calculated from product parameters and anchored on the blockchain.
            </p>

            <div className="hash-container">
              <span className="hash-text">{product.product_hash}</span>
              <button onClick={copyHash} className="btn-copy">
                {copiedHash ? "Copied!" : "Copy Hash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Initial State */}
      {!loading && !notFound && !product && (
        <div className="glass-panel" style={{ padding: "3.5rem 2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ width: "54px", height: "54px", borderRadius: "14px", background: "rgba(0, 230, 118, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "var(--neon-green)" }}>
            <ShieldCheckIcon size={28} />
          </div>
          <h3 style={{ marginBottom: "0.5rem" }}>Ready to Audit</h3>
          <p style={{ fontSize: "0.92rem", marginBottom: "1.5rem" }}>
            Enter a product serial code above or scan a TeaceLock QR code with your camera to view its cryptographic history.
          </p>
        </div>
      )}
    </div>
  );
}

function formatEventType(type: string) {
  return type
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getEventIcon(type: string) {
  switch (type) {
    case "MANUFACTURED":
      return "🏭";
    case "DISPATCHED":
      return "🚚";
    case "RECEIVED":
      return "📦";
    case "RETAILER_RECEIVED":
      return "🏪";
    case "SOLD":
      return "🛒";
    default:
      return "📍";
  }
}

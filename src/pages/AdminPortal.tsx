import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  generateProductCode,
  generateProductHash,
} from "../lib/hash";
import { blockchainService } from "../lib/blockchain";
import { useWeb3 } from "../context/Web3Context";
import ProductQR from "../components/ProductQR";
import WalletButton from "../components/WalletButton";
import { 
  FactoryIcon, 
  ArrowRightIcon, 
  PlusCircleIcon, 
  EditIcon, 
  TrashIcon, 
  CpuIcon,
  WalletIcon
} from "../components/Icons";

interface ProductRecord {
  id: string;
  product_code: string;
  name: string;
  brand: string;
  product_hash: string;
  status: string;
  created_at: string;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<"catalog" | "register" | "milestone" | "blockchain">("catalog");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Registration form states
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [location, setLocation] = useState("");
  const [registering, setRegistering] = useState(false);
  const [regMessage, setRegMessage] = useState("");
  const [regError, setRegError] = useState(false);
  const [latestCode, setLatestCode] = useState("");
  const [anchorOnChain, setAnchorOnChain] = useState(true);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Milestone event states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [eventType, setEventType] = useState("DISPATCHED");
  const [eventLocation, setEventLocation] = useState("");
  const [actorName, setActorName] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [eventError, setEventError] = useState(false);
  const [milestoneTxHash, setMilestoneTxHash] = useState<string | null>(null);

  // Edit status modal/state
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [editStatus, setEditStatus] = useState("active");
  const [savingEdit, setSavingEdit] = useState(false);

  // Web3 & Contract settings
  const { account, chainConfig, contractAddress, setContractAddress } = useWeb3();
  const [customContractInput, setCustomContractInput] = useState(contractAddress);
  const [contractSavedMsg, setContractSavedMsg] = useState("");

  const fetchCatalog = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
      if (data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id);
      }
    }
    setLoadingProducts(false);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || !location.trim()) {
      setRegMessage("All fields are mandatory.");
      setRegError(true);
      return;
    }

    setRegistering(true);
    setRegMessage("");
    setRegError(false);
    setLatestCode("");
    setLastTxHash(null);

    try {
      const newProductCode = generateProductCode();
      const timestamp = new Date().toISOString();
      const productHash = generateProductHash(
        newProductCode,
        name.trim(),
        brand.trim(),
        timestamp
      );

      // 1. Insert into Supabase PostgreSQL
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .insert({
          product_code: newProductCode,
          name: name.trim(),
          brand: brand.trim(),
          manufacturer_id: null,
          product_hash: productHash,
          status: "active",
        })
        .select()
        .single();

      if (prodErr) throw new Error(prodErr.message);

      // 2. Insert genesis milestone into Supabase
      const { error: eventErr } = await supabase
        .from("supply_chain_events")
        .insert({
          product_id: product.id,
          event_type: "MANUFACTURED",
          location: location.trim(),
          actor_name: "Master Factory Admin",
          notes: "Initial genesis minted and signed on TeaceLock.",
        });

      if (eventErr) throw new Error(eventErr.message);

      // 3. Anchor onto EVM Blockchain
      if (anchorOnChain) {
        try {
          const { txHash } = await blockchainService.anchorProduct(
            newProductCode,
            name.trim(),
            brand.trim(),
            productHash
          );
          setLastTxHash(txHash);
        } catch (bcErr: any) {
          console.warn("Blockchain anchoring notice:", bcErr);
        }
      }

      setLatestCode(newProductCode);
      setRegMessage("Product successfully minted, registered, and anchored onto blockchain.");
      setName("");
      setBrand("");
      setLocation("");
      fetchCatalog();
    } catch (err: unknown) {
      setRegError(true);
      setRegMessage(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !eventLocation.trim() || !actorName.trim()) {
      setEventError(true);
      setEventMessage("Select a product and specify location & custodian.");
      return;
    }

    setAddingEvent(true);
    setEventMessage("");
    setEventError(false);
    setMilestoneTxHash(null);

    const targetProduct = products.find((p) => p.id === selectedProductId);

    try {
      const { error } = await supabase.from("supply_chain_events").insert({
        product_id: selectedProductId,
        event_type: eventType,
        location: eventLocation.trim(),
        actor_name: actorName.trim(),
        notes: eventNotes.trim() || null,
      });

      if (error) throw new Error(error.message);

      // Anchor milestone to blockchain
      if (targetProduct) {
        try {
          const { txHash } = await blockchainService.recordMilestoneOnChain(
            targetProduct.product_code,
            eventType,
            eventLocation.trim(),
            actorName.trim(),
            eventNotes.trim()
          );
          setMilestoneTxHash(txHash);
        } catch (bcErr) {
          console.warn("Milestone blockchain anchoring notice:", bcErr);
        }
      }

      setEventMessage("Checkpoint milestone etched onto chain history!");
      setEventLocation("");
      setActorName("");
      setEventNotes("");
    } catch (err: unknown) {
      setEventError(true);
      setEventMessage(err instanceof Error ? err.message : "Failed to record event.");
    } finally {
      setAddingEvent(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingProduct) return;
    setSavingEdit(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({ status: editStatus })
        .eq("id", editingProduct.id);

      if (error) throw new Error(error.message);

      await supabase.from("supply_chain_events").insert({
        product_id: editingProduct.id,
        event_type: editStatus === "recalled" ? "RECALLED" : "STATUS_UPDATED",
        location: "Central Ledger HQ",
        actor_name: "Admin Operator",
        notes: `Ledger state transition: status changed to '${editStatus}'.`,
      });

      setEditingProduct(null);
      fetchCatalog();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProduct = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete item ${code} from ledger?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert(`Deletion error: ${error.message}`);
    } else {
      fetchCatalog();
    }
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    setContractAddress(customContractInput);
    setContractSavedMsg("Smart contract address updated and synced to web3 client!");
    setTimeout(() => setContractSavedMsg(""), 3500);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="page-badge">
            <CpuIcon size={14} />
            <span>Cryptographic Operations Console</span>
          </div>
          <h1 className="page-title">Admin Management Portal</h1>
          <p className="page-description">
            Dual-layer ledger management: register physical items, record custody milestones, and anchor SHA-256 states to the blockchain.
          </p>
        </div>

        {/* Tab Switcher & Wallet Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <WalletButton />

          <div style={{ display: "flex", background: "var(--bg-card)", padding: "4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)" }}>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`btn-secondary ${activeTab === "catalog" ? "active-tab" : ""}`}
              style={{ padding: "8px 14px", border: "none", fontSize: "0.85rem" }}
            >
              Catalog ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`btn-secondary ${activeTab === "register" ? "active-tab" : ""}`}
              style={{ padding: "8px 14px", border: "none", fontSize: "0.85rem" }}
            >
              + Mint
            </button>
            <button
              onClick={() => setActiveTab("milestone")}
              className={`btn-secondary ${activeTab === "milestone" ? "active-tab" : ""}`}
              style={{ padding: "8px 14px", border: "none", fontSize: "0.85rem" }}
            >
              Milestone
            </button>
            <button
              onClick={() => setActiveTab("blockchain")}
              className={`btn-secondary ${activeTab === "blockchain" ? "active-tab" : ""}`}
              style={{ padding: "8px 14px", border: "none", fontSize: "0.85rem" }}
            >
              Blockchain Setup
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PRODUCT CATALOG */}
      {activeTab === "catalog" && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Registered Items & Chain Status</h3>
            <button onClick={() => setActiveTab("register")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              <PlusCircleIcon size={16} />
              <span>Mint New Item</span>
            </button>
          </div>

          {loadingProducts ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div className="live-dot" style={{ width: "14px", height: "14px", margin: "0 auto 1rem" }}></div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>Loading database records...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No items in catalog yet. Click "+ Mint" to register your first authentic SKU.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-medium)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                    <th style={{ padding: "12px 14px" }}>PRODUCT CODE</th>
                    <th style={{ padding: "12px 14px" }}>NAME</th>
                    <th style={{ padding: "12px 14px" }}>BRAND</th>
                    <th style={{ padding: "12px 14px" }}>STATUS</th>
                    <th style={{ padding: "12px 14px" }}>REGISTERED</th>
                    <th style={{ padding: "12px 14px", textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px", fontFamily: "var(--font-mono)", color: "var(--neon-green)", fontWeight: 700 }}>
                        {p.product_code}
                      </td>
                      <td style={{ padding: "14px", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "14px", color: "var(--text-secondary)" }}>{p.brand}</td>
                      <td style={{ padding: "14px" }}>
                        <span
                          className="step-type-badge"
                          style={{
                            fontSize: "0.72rem",
                            background: p.status === "active" ? "rgba(0, 230, 118, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            borderColor: p.status === "active" ? "var(--neon-green)" : "#ef4444",
                            color: p.status === "active" ? "var(--neon-green)" : "#ef4444",
                          }}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "14px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <a
                            href={`/verify?code=${p.product_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-copy"
                            style={{ textDecoration: "none" }}
                            title="Verify in Public Portal"
                          >
                            Verify ↗
                          </a>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditStatus(p.status);
                            }}
                            className="btn-copy"
                            title="Edit Status"
                          >
                            <EditIcon size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.product_code)}
                            className="btn-copy"
                            style={{ color: "var(--danger)" }}
                            title="Delete"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTER NEW PRODUCT */}
      {activeTab === "register" && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="glass-panel form-card">
            <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem" }}>Register & Anchor Item</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Computes a SHA-256 fingerprint, saves genesis record to PostgreSQL, and anchors the digital proof onto the blockchain.
            </p>

            <form onSubmit={handleRegister} className="form-grid">
              <div className="form-group">
                <label className="form-label">Product Name / Model</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UltraBoost Pure 24"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Adidas"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manufacturing Facility Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Herzogenaurach, Germany"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-sm)" }}>
                <input
                  type="checkbox"
                  id="anchorCheck"
                  checked={anchorOnChain}
                  onChange={(e) => setAnchorOnChain(e.target.checked)}
                  style={{ accentColor: "var(--neon-green)", width: "16px", height: "16px" }}
                />
                <label htmlFor="anchorCheck" style={{ fontSize: "0.86rem", color: "var(--text-main)", cursor: "pointer" }}>
                  Anchor cryptographic hash onto <strong>{chainConfig.name}</strong>
                </label>
              </div>

              {regMessage && (
                <div className={`status-alert ${regError ? "error" : "success"}`}>
                  <span>{regError ? "⚠️" : "✓"}</span>
                  <div>
                    <div>{regMessage}</div>
                    {lastTxHash && (
                      <div style={{ marginTop: "4px", fontSize: "0.78rem", fontFamily: "var(--font-mono)" }}>
                        <span>Tx Hash: </span>
                        <a
                          href={`${chainConfig.explorerUrl}/tx/${lastTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "inherit", textDecoration: "underline" }}
                        >
                          {lastTxHash.slice(0, 18)}... ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" disabled={registering} className="btn-primary" style={{ width: "100%", padding: "14px" }}>
                {registering ? (
                  <span>Minting Token & Anchoring...</span>
                ) : (
                  <>
                    <FactoryIcon size={18} />
                    <span>Mint & Anchor onto Blockchain</span>
                    <ArrowRightIcon size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {latestCode && (
            <div className="glass-panel success-banner" style={{ marginTop: "2rem" }}>
              <ProductQR productCode={latestCode} />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECORD CHECKPOINT MILESTONE */}
      {activeTab === "milestone" && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="glass-panel form-card">
            <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>Record Custody Milestone</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Etch a transit event into a product's supply chain timeline and commit proof to the blockchain.
            </p>

            <form onSubmit={handleAddMilestone} className="form-grid">
              <div className="form-group">
                <label className="form-label">Target Product</label>
                <select
                  className="form-input"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ background: "var(--bg-input)" }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_code} — {p.name} ({p.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Milestone Event Type</label>
                <select
                  className="form-input"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{ background: "var(--bg-input)" }}
                >
                  <option value="DISPATCHED">🚚 Dispatched from Facility</option>
                  <option value="RECEIVED">📦 Regional Hub Received</option>
                  <option value="CUSTOMS_CLEARED">🛃 Customs Cleared</option>
                  <option value="RETAILER_RECEIVED">🏪 Retail Store Received</option>
                  <option value="SOLD">🛒 Sold to End Consumer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Checkpoint Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Frankfurt Logistics Hub 4, Germany"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custodian / Actor Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DHL Global Forwarding Ltd."
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Seal intact, verified via biometric terminal"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                />
              </div>

              {eventMessage && (
                <div className={`status-alert ${eventError ? "error" : "success"}`}>
                  <span>{eventError ? "⚠️" : "✓"}</span>
                  <div>
                    <div>{eventMessage}</div>
                    {milestoneTxHash && (
                      <div style={{ marginTop: "4px", fontSize: "0.78rem", fontFamily: "var(--font-mono)" }}>
                        <span>On-Chain Tx: </span>
                        <a
                          href={`${chainConfig.explorerUrl}/tx/${milestoneTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "inherit", textDecoration: "underline" }}
                        >
                          {milestoneTxHash.slice(0, 18)}... ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" disabled={addingEvent} className="btn-primary" style={{ width: "100%", padding: "14px" }}>
                {addingEvent ? <span>Anchoring Milestone...</span> : <span>Commit Checkpoint Event</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: BLOCKCHAIN SETUP */}
      {activeTab === "blockchain" && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="glass-panel form-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <WalletIcon size={22} color="var(--neon-green)" />
              <h3 style={{ margin: 0, fontSize: "1.3rem" }}>Blockchain & Smart Contract Configuration</h3>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              TeaceLock integrates with EVM-compatible blockchains (Polygon, Sepolia, Arbitrum). You can configure your deployed contract or test in simulated on-chain mode.
            </p>

            <form onSubmit={handleSaveContract} className="form-grid">
              <div className="form-group">
                <label className="form-label">Active Network</label>
                <div style={{ padding: "12px 16px", background: "var(--bg-input)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--neon-green)" }}>
                  {chainConfig.name} (Chain ID: {chainConfig.chainId})
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Connected Wallet Address</label>
                <div style={{ padding: "12px 16px", background: "var(--bg-input)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: account ? "var(--text-main)" : "var(--text-muted)" }}>
                  {account || "No wallet connected. Use the 'Connect Wallet' button in the top right."}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">TeaceLockRegistry Contract Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0x..."
                  value={customContractInput}
                  onChange={(e) => setCustomContractInput(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)" }}
                />
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  Leave empty to run in simulated mode, or deploy <code>contracts/TeaceLockRegistry.sol</code> via Remix/Hardhat and paste address here.
                </span>
              </div>

              {contractSavedMsg && (
                <div className="status-alert success">
                  <span>✓</span>
                  <span>{contractSavedMsg}</span>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                <span>Save Contract Address</span>
              </button>
            </form>

            <div style={{ marginTop: "2rem", borderTop: "1px dashed var(--border-card)", paddingTop: "1rem" }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Smart Contract Source:</h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                The Solidity contract source is saved in <code>teacelock/contracts/TeaceLockRegistry.sol</code>. It implements tamper-proof SHA-256 anchoring and supply chain milestone tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div className="glass-panel" style={{ maxWidth: "440px", width: "100%", padding: "2rem" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Update Product Status</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Modifying status for <strong>{editingProduct.product_code}</strong> ({editingProduct.name}).
            </p>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Ledger State</label>
              <select
                className="form-input"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="active">Active (Verified Genuine)</option>
                <option value="flagged">Flagged (Under Review)</option>
                <option value="recalled">Recalled (Tamper Warning)</option>
                <option value="retired">Retired / Decommissioned</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="btn-secondary"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="btn-primary"
                disabled={savingEdit}
              >
                {savingEdit ? "Updating..." : "Save State"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
  generateProductCode,
  generateProductHash,
} from "../lib/hash";
import ProductQR from "../components/ProductQR";
import { FactoryIcon, ArrowRightIcon } from "../components/Icons";

export default function Manufacturer() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [productCode, setProductCode] = useState("");

  const registerProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate fields
    if (!name.trim() || !brand.trim() || !location.trim()) {
      setMessage("Please complete all required fields before generating credentials.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);
    setProductCode("");

    try {
      // 1. Generate Product Code
      const newProductCode = generateProductCode();

      // 2. Generate Timestamp
      const timestamp = new Date().toISOString();

      // 3. Generate SHA-256 Hash
      const productHash = generateProductHash(
        newProductCode,
        name.trim(),
        brand.trim(),
        timestamp
      );

      // 4. Insert Product
      const { data: product, error: productError } =
        await supabase
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

      if (productError) {
        console.error("Product insertion error:", productError);
        throw new Error(`Product registration failed: ${productError.message}`);
      }

      // 5. Create Supply Chain Event
      const { error: eventError } =
        await supabase
          .from("supply_chain_events")
          .insert({
            product_id: product.id,
            event_type: "MANUFACTURED",
            location: location.trim(),
            actor_name: "Original Manufacturer Facility",
            notes: "Product registered and cryptographic token stamped in TeaceLock database.",
          });

      if (eventError) {
        console.error("Supply chain event error:", eventError);
        throw new Error(`Product recorded, but provenance event failed: ${eventError.message}`);
      }

      // 6. Success
      setMessage("Item authenticated & registered successfully. Cryptographic QR ready.");
      setIsError(false);
      setProductCode(newProductCode);

      // Clear form
      setName("");
      setBrand("");
      setLocation("");

    } catch (error) {
      console.error("Registration error:", error);
      setIsError(true);
      if (error instanceof Error) {
        setMessage(`Registration Error: ${error.message}`);
      } else {
        setMessage("An unexpected error occurred during cryptographic registration.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 2.5rem" }}>
        <div className="page-badge">
          <FactoryIcon size={14} />
          <span>Manufacturer Operations</span>
        </div>
        <h1 className="page-title">Register Authenticated Item</h1>
        <p className="page-description" style={{ margin: "0 auto" }}>
          Generate a deterministic SHA-256 fingerprint and cryptographically signed QR code to establish 
          unforged provenance from point-of-origin.
        </p>
      </div>

      <div className="glass-panel form-card">
        <form onSubmit={registerProduct} className="form-grid">
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="prod-name">
              <span>Product Title</span>
              <span className="form-label-hint">e.g. Model / SKU identifier</span>
            </label>
            <input
              id="prod-name"
              className="form-input"
              type="text"
              placeholder="e.g. Air Max 95 / Chronograph 41"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Brand */}
          <div className="form-group">
            <label className="form-label" htmlFor="prod-brand">
              <span>Brand / Manufacturer Identity</span>
              <span className="form-label-hint">Registered corporate name</span>
            </label>
            <input
              id="prod-brand"
              className="form-input"
              type="text"
              placeholder="e.g. Nike, Rolex, Pfizer"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="prod-loc">
              <span>Manufacturing Facility Location</span>
              <span className="form-label-hint">City, Country / Facility ID</span>
            </label>
            <input
              id="prod-loc"
              className="form-input"
              type="text"
              placeholder="e.g. Facility Alpha, Stuttgart, Germany"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`status-alert ${isError ? "error" : "success"}`}>
              <span>{isError ? "⚠️" : "✓"}</span>
              <span>{message}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "14px", marginTop: "0.5rem" }}
          >
            {loading ? (
              <span>Minting Digital Signature...</span>
            ) : (
              <>
                <FactoryIcon size={18} />
                <span>Register & Mint Product Signature</span>
                <ArrowRightIcon size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Product QR Result */}
      {productCode && (
        <div className="glass-panel success-banner">
          <ProductQR productCode={productCode} />
        </div>
      )}
    </div>
  );
}

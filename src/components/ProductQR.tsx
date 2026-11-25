import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCodeIcon, CheckCircleIcon } from "./Icons";

interface ProductQRProps {
  productCode: string;
}

export default function ProductQR({ productCode }: ProductQRProps) {
  const [copied, setCopied] = useState(false);
  const verificationUrl = `${window.location.origin}/verify?code=${productCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(productCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const canvas = document.querySelector("#product-qr-canvas") as HTMLCanvasElement | null;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `TeaceLock-${productCode}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
        <CheckCircleIcon size={20} color="#10b981" />
        <h3 style={{ margin: 0, fontSize: "1.35rem" }}>Product Registered on Ledger</h3>
      </div>
      
      <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
        This unique token identity is permanently etched into the TeaceLock database with SHA-256 validation.
      </p>

      {/* High-contrast QR Container */}
      <div className="qr-box-container">
        <QRCodeCanvas
          id="product-qr-canvas"
          value={verificationUrl}
          size={210}
          level="H"
          marginSize={2}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Product Code:
          </span>
          <span className="hash-pill">
            {productCode}
          </span>
          <button onClick={copyCode} className="btn-copy">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
          <button onClick={downloadQR} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            <QrCodeIcon size={16} />
            <span>Download High-Res QR</span>
          </button>
          
          <a 
            href={verificationUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary" 
            style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}
          >
            <span>Preview Verification Link ↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

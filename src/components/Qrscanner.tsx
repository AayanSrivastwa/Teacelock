import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { ScanIcon, ShieldCheckIcon } from "./Icons";

export default function QRScanner() {
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 12,
        qrbox: {
          width: 260,
          height: 260,
        },
        aspectRatio: 1.0,
      },
      false
    );

    const handleScan = (decodedText: string) => {
      console.log("QR scanned:", decodedText);

      try {
        let code: string | null = null;
        if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
          const url = new URL(decodedText);
          code = url.searchParams.get("code");
        } else {
          // In case the QR code contains the direct code string
          code = decodedText.trim();
        }

        if (code) {
          scanner.clear().catch(() => {});
          navigate(`/verify?code=${encodeURIComponent(code)}`);
        } else {
          alert("Invalid TeaceLock QR payload.");
        }
      } catch {
        // Fallback if plain code string was scanned
        scanner.clear().catch(() => {});
        navigate(`/verify?code=${encodeURIComponent(decodedText.trim())}`);
      }
    };

    const handleError = () => {
      // Quiet recurring frame errors from camera streams
    };

    scanner.render(handleScan, handleError);

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="page-container">
      <div className="scanner-wrapper">
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="page-badge">
            <ScanIcon size={14} />
            <span>Hardware / Optical Scan</span>
          </div>
          <h1 className="page-title">Live QR Scanner</h1>
          <p className="page-description" style={{ margin: "0 auto" }}>
            Align the physical TeaceLock QR code within the viewfinder. The hardware feed will automatically decode and direct to the verification ledger.
          </p>
        </div>

        <div className="glass-panel camera-card">
          <div id="qr-reader"></div>

          <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            <ShieldCheckIcon size={16} color="var(--accent-cyan)" />
            <span>End-to-end client-side optical decoding</span>
          </div>
        </div>
      </div>
    </div>
  );
}

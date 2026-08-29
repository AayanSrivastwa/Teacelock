import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

export default function QRScanner() {
    const navigate = useNavigate();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 250,
                },
            },
            false
        );

        const handleScan = (decodedText: string) => {
            console.log("QR scanned:", decodedText);

            try {
                const url = new URL(decodedText);

                const code = url.searchParams.get("code");

                if (code) {
                    scanner.clear();
                    navigate(`/verify?code=${encodeURIComponent(code)}`);
                } else {
                    alert("Invalid TeaceLock QR code.");
                }
            } catch {
                alert("Invalid QR code.");
            }
        };

        const handleError = (errorMessage: string) => {
            console.log("QR scan error:", errorMessage);
        };

        scanner.render(handleScan, handleError);

        return () => {
            scanner.clear().catch(() => {
                // Scanner already cleared
            });
        };
    }, [navigate]);

    return (
        <div>
            <h1>Scan Product QR 🔍</h1>

            <p>
                Point your camera at the TeaceLock QR code.
            </p>

            <div id="qr-reader"></div>
        </div>
    );
}
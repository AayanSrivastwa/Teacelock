import { QRCodeCanvas } from "qrcode.react";

interface ProductQRProps {
    productCode: string;
}

export default function ProductQR({
    productCode,
}: ProductQRProps) {

    const verificationUrl =
        `${window.location.origin}/verify?code=${productCode}`;

    return (
        <div>
            <h3>Product QR Code</h3>

            <QRCodeCanvas
                value={verificationUrl}
                size={220}
            />

            <p>
                Product Code: {productCode}
            </p>

            <p>
                Scan this QR to verify the product.
            </p>
        </div>
    );
}
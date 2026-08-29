import { sha256 } from "@noble/hashes/sha2.js";
import {
    bytesToHex,
    utf8ToBytes,
} from "@noble/hashes/utils.js";

export function generateProductCode(): string {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "PRD-";

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(
            Math.random() * characters.length
        );

        code += characters[randomIndex];
    }

    return code;
}

export function generateProductHash(
    productCode: string,
    name: string,
    brand: string,
    timestamp: string
): string {
    const payload =
        `${productCode}|${name}|${brand}|${timestamp}`;

    const hash = sha256(
        utf8ToBytes(payload)
    );

    return bytesToHex(hash);
}
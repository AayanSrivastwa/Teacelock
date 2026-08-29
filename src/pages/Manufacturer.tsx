import { useState } from "react";
import { supabase } from "../lib/supabase";
import {
    generateProductCode,
    generateProductHash,
} from "../lib/hash";
import ProductQR from "../components/ProductQR";

export default function Manufacturer() {
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [productCode, setProductCode] = useState("");

    const registerProduct = async () => {
        if (!name.trim() || !brand.trim()) {
            setMessage("Please enter product name and brand.");
            return;
        }

        setLoading(true);
        setMessage("");
        setProductCode("");

        try {
            // 1. Generate unique product code
            const newProductCode = generateProductCode();

            // 2. Generate timestamp
            const timestamp = new Date().toISOString();

            // 3. Generate product hash
            const productHash = generateProductHash(
                newProductCode,
                name.trim(),
                brand.trim(),
                timestamp
            );

            // 4. Save product to Supabase
            const { error } = await supabase
                .from("products")
                .insert({
                    product_code: newProductCode,
                    name: name.trim(),
                    brand: brand.trim(),
                    manufacturer_id: null,
                    product_hash: productHash,
                    status: "active",
                });

            if (error) {
                throw error;
            }

            // 5. Show success
            setMessage("Product registered successfully!");
            setProductCode(newProductCode);

            // Clear form
            setName("");
            setBrand("");
        } catch (error) {
            console.error("Product registration error:", error);
            setMessage("Failed to register product.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <h1>Manufacturer Dashboard</h1>

            <div>
                <h2>Register New Product</h2>

                <input
                    type="text"
                    placeholder="Product Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                />

                <button
                    onClick={registerProduct}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Register Product"}
                </button>

                {message && <p>{message}</p>}
            </div>

            {productCode && (
                <div>
                    <h2>Product Registered 🎉</h2>

                    <p>
                        Product Code: <strong>{productCode}</strong>
                    </p>

                    <ProductQR
                        productCode={productCode}
                    />
                </div>
            )}
        </main>
    );
}
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Product {
    id: string;
    product_code: string;
    name: string;
    brand: string;
    product_hash: string;
    status: string;
    created_at: string;
}

export default function Verify() {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const verifyProduct = async () => {
            // Get product code from URL
            const params = new URLSearchParams(
                window.location.search
            );

            const code = params.get("code");

            // No product code
            if (!code) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            // Search product in Supabase
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("product_code", code)
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setProduct(data);
            }

            setLoading(false);
        };

        verifyProduct();
    }, []);

    // Loading
    if (loading) {
        return (
            <main>
                <h1>TeaceLock 🔐</h1>
                <h2>Verifying Product...</h2>
                <p>Please wait.</p>
            </main>
        );
    }

    // Product not found
    if (notFound) {
        return (
            <main>
                <h1>TeaceLock 🔐</h1>

                <div>
                    <h2>❌ Product Not Found</h2>

                    <p>
                        This product could not be verified.
                    </p>

                    <p>
                        The product code does not exist
                        in the TeaceLock database.
                    </p>
                </div>
            </main>
        );
    }

    // Product found
    return (
        <main>
            <h1>TeaceLock 🔐</h1>

            <div>
                <h2>✅ Product Verified</h2>

                <h3>{product?.name}</h3>

                <p>
                    <strong>Brand:</strong>{" "}
                    {product?.brand}
                </p>

                <p>
                    <strong>Product Code:</strong>{" "}
                    {product?.product_code}
                </p>

                <p>
                    <strong>Status:</strong>{" "}
                    {product?.status}
                </p>

                <p>
                    <strong>Registered On:</strong>{" "}
                    {new Date(
                        product!.created_at
                    ).toLocaleString()}
                </p>

                <p>
                    <strong>Product Hash:</strong>
                </p>

                <code>
                    {product?.product_hash}
                </code>
            </div>
        </main>
    );
}
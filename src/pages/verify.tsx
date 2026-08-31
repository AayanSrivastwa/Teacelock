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

    useEffect(() => {
        const verifyProduct = async () => {
            const params = new URLSearchParams(
                window.location.search
            );

            const code = params.get("code");

            if (!code) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            // Get product
            const { data: productData, error: productError } =
                await supabase
                    .from("products")
                    .select("*")
                    .eq("product_code", code)
                    .single();

            if (productError || !productData) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setProduct(productData);

            // Get supply chain history
            const { data: eventData, error: eventError } =
                await supabase
                    .from("supply_chain_events")
                    .select("*")
                    .eq("product_id", productData.id)
                    .order("created_at", {
                        ascending: true,
                    });

            if (eventError) {
                console.error(
                    "Supply chain error:",
                    eventError
                );
            } else {
                setEvents(eventData || []);
            }

            setLoading(false);
        };

        verifyProduct();
    }, []);

    if (loading) {
        return (
            <main>
                <h1>TeaceLock 🔐</h1>
                <h2>Verifying Product...</h2>
                <p>Please wait.</p>
            </main>
        );
    }

    if (notFound) {
        return (
            <main>
                <h1>TeaceLock 🔐</h1>

                <h2>❌ Product Not Found</h2>

                <p>
                    This product could not be verified.
                </p>

                <p>
                    The product code does not exist in the
                    TeaceLock database.
                </p>
            </main>
        );
    }

    return (
        <main>
            <h1>TeaceLock 🔐</h1>

            {/* Product verification */}
            <section>
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
            </section>

            <hr />

            {/* Supply chain */}
            <section>
                <h2>📦 Supply Chain Journey</h2>

                {events.length === 0 ? (
                    <p>
                        No supply chain events recorded yet.
                    </p>
                ) : (
                    events.map((event, index) => (
                        <div key={event.id}>
                            <h3>
                                {index + 1}.{" "}
                                {getEventIcon(event.event_type)}{" "}
                                {formatEventType(event.event_type)}
                            </h3>

                            {event.actor_name && (
                                <p>
                                    <strong>Actor:</strong>{" "}
                                    {event.actor_name}
                                </p>
                            )}

                            {event.location && (
                                <p>
                                    <strong>Location:</strong>{" "}
                                    {event.location}
                                </p>
                            )}

                            {event.notes && (
                                <p>
                                    <strong>Details:</strong>{" "}
                                    {event.notes}
                                </p>
                            )}

                            <p>
                                <strong>Date:</strong>{" "}
                                {new Date(
                                    event.created_at
                                ).toLocaleString()}
                            </p>

                            {index < events.length - 1 && (
                                <p>↓</p>
                            )}
                        </div>
                    ))
                )}
            </section>

            <hr />

            {/* Hash */}
            <section>
                <h2>🔐 Product Hash</h2>

                <code>
                    {product?.product_hash}
                </code>
            </section>
        </main>
    );
}

function formatEventType(type: string) {
    return type
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
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
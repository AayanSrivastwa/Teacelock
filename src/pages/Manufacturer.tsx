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
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [productCode, setProductCode] = useState("");

  const registerProduct = async () => {
    if (!name.trim() || !brand.trim() || !location.trim()) {
      setMessage("Please fill all fields.");
      return;
    }

    setLoading(true);
    setMessage("");
    setProductCode("");

    try {
      // Generate product code
      const newProductCode = generateProductCode();

      // Timestamp
      const timestamp = new Date().toISOString();

      // Generate product hash
      const productHash = generateProductHash(
        newProductCode,
        name.trim(),
        brand.trim(),
        timestamp
      );

      // Create product
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
        throw productError;
      }

      // Create first supply-chain event
      const { error: eventError } = await supabase
        .from("supply_chain_events")
        .insert({
          product_id: product.id,
          event_type: "MANUFACTURED",
          location: location.trim(),
          actor_name: "Manufacturer",
          notes:
            "Product manufactured and registered with TeaceLock.",
        });

      if (eventError) {
        throw eventError;
      }

      setMessage(
        "Product registered successfully!"
      );

      setProductCode(newProductCode);

      // Clear form
      setName("");
      setBrand("");
      setLocation("");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Failed to register product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Manufacturer Dashboard 🏭</h1>

      <section>
        <h2>Register New Product</h2>

        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Manufacturing Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <br />
        <br />

        <button
          onClick={registerProduct}
          disabled={loading}
        >
          {loading
            ? "Registering..."
            : "Register Product"}
        </button>

        {message && <p>{message}</p>}
      </section>

      {productCode && (
        <section>
          <h2>Product Registered 🎉</h2>

          <p>
            Product Code:{" "}
            <strong>{productCode}</strong>
          </p>

          <ProductQR
            productCode={productCode}
          />
        </section>
      )}
    </main>
  );
}
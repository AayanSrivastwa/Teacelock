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
    // Validate fields
    if (!name.trim() || !brand.trim() || !location.trim()) {
      setMessage("Please fill all fields.");
      return;
    }

    setLoading(true);
    setMessage("");
    setProductCode("");

    try {
      // --------------------------------
      // 1. Generate Product Code
      // --------------------------------
      const newProductCode = generateProductCode();

      // --------------------------------
      // 2. Generate Timestamp
      // --------------------------------
      const timestamp = new Date().toISOString();

      // --------------------------------
      // 3. Generate SHA-256 Hash
      // --------------------------------
      const productHash = generateProductHash(
        newProductCode,
        name.trim(),
        brand.trim(),
        timestamp
      );

      // --------------------------------
      // 4. Insert Product
      // --------------------------------
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

      // Check product error
      if (productError) {
        console.error(
          "Product insertion error:",
          productError
        );

        throw new Error(
          `Product creation failed: ${productError.message}`
        );
      }

      // --------------------------------
      // 5. Create Supply Chain Event
      // --------------------------------
      const { error: eventError } =
        await supabase
          .from("supply_chain_events")
          .insert({
            product_id: product.id,
            event_type: "MANUFACTURED",
            location: location.trim(),
            actor_name: "Manufacturer",
            notes:
              "Product manufactured and registered with TeaceLock.",
          });

      // Check event error
      if (eventError) {
        console.error(
          "Supply chain event error:",
          eventError
        );

        throw new Error(
          `Product created, but supply-chain event failed: ${eventError.message}`
        );
      }

      // --------------------------------
      // 6. Success
      // --------------------------------
      setMessage(
        "Product registered successfully! QR code generated."
      );

      setProductCode(newProductCode);

      // Clear form
      setName("");
      setBrand("");
      setLocation("");

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      // Show exact error
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(
          "An unknown error occurred."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Manufacturer Dashboard 🏭</h1>

      <section>
        <h2>Register New Product</h2>

        {/* Product Name */}
        <div>
          <label>
            Product Name
          </label>

          <br />

          <input
            type="text"
            placeholder="e.g. Air Max 95"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </div>

        <br />

        {/* Brand */}
        <div>
          <label>
            Brand
          </label>

          <br />

          <input
            type="text"
            placeholder="e.g. Nike"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
          />
        </div>

        <br />

        {/* Location */}
        <div>
          <label>
            Manufacturing Location
          </label>

          <br />

          <input
            type="text"
            placeholder="e.g. Delhi"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
          />
        </div>

        <br />

        {/* Register Button */}
        <button
          onClick={registerProduct}
          disabled={loading}
        >
          {loading
            ? "Registering..."
            : "Register Product"}
        </button>

        {/* Message */}
        {message && (
          <p>{message}</p>
        )}
      </section>

      {/* Generated Product */}
      {productCode && (
        <section>
          <h2>
            Product Registered 🎉
          </h2>

          <p>
            Product Code:{" "}
            <strong>
              {productCode}
            </strong>
          </p>

          <ProductQR
            productCode={productCode}
          />
        </section>
      )}
    </main>
  );
}
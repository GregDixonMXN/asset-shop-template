"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  blurb: string;
  priceCents: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [email, setEmail] = useState("");
  const [buying, setBuying] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ publicId: string; token: string } | null>(null);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  async function buy(id: string) {
    setBuying(id);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: id, email: email || undefined }),
    });
    const data = await res.json();
    setBuying(null);
    if (data.publicId) setReceipt({ publicId: data.publicId, token: data.token });
    else alert(data.error ?? "checkout failed");
  }

  return (
    <div>
      <h1>Sell digital goods this afternoon.</h1>
      <p style={{ color: "#aaa" }}>
        Guest checkout, magic-link accounts, order dashboard, mock fulfillment.
        Swap the mock provider for your real backend when ready.
      </p>
      {receipt && (
        <p style={{ border: "1px solid #4a4", padding: 12 }}>
          Order placed! Track it here (save this link):{" "}
          <a href={`/o/${receipt.publicId}?token=${receipt.token}`} style={{ color: "#9cf" }}>
            /o/{receipt.publicId}
          </a>
        </p>
      )}
      <label style={{ display: "block", margin: "16px 0" }}>
        Email for receipts (optional — log in later with the same address to claim the order):<br />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ width: 300, padding: 8, marginTop: 4 }}
        />
      </label>
      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #333", padding: 16, marginBottom: 12 }}>
          <h2 style={{ margin: "0 0 4px" }}>{p.name} — ${(p.priceCents / 100).toFixed(2)}</h2>
          <p style={{ color: "#aaa", margin: "0 0 12px" }}>{p.blurb}</p>
          <button onClick={() => buy(p.id)} disabled={buying === p.id} style={{ padding: "8px 20px" }}>
            {buying === p.id ? "Working…" : "Buy (mock payment)"}
          </button>
        </div>
      ))}
    </div>
  );
}

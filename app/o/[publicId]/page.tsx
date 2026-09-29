"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface OrderView {
  publicId: string;
  productId: string;
  status: string;
  job: { stage: string; status: string } | null;
  downloadReady: boolean;
}

export default function OrderPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);
  const token = useSearchParams().get("token") ?? "";
  const [order, setOrder] = useState<OrderView | null>(null);

  async function load() {
    const res = await fetch(`/api/orders/${publicId}${token ? `?token=${token}` : ""}`);
    if (res.ok) setOrder(await res.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId, token]);

  if (!order) return <p>Loading…</p>;
  return (
    <div>
      <h1>Order {order.publicId}</h1>
      <p style={{ color: "#aaa" }}>{order.productId} · status: {order.status}</p>
      {order.job && <p>Fulfillment: {order.job.stage} ({order.job.status})</p>}
      {order.downloadReady ? (
        <p><a href={`/api/orders/${order.publicId}/download${token ? `?token=${token}` : ""}`} style={{ color: "#9cf" }}>Download your file</a></p>
      ) : (
        <p style={{ color: "#888" }}>Your download appears here when fulfillment completes (mock: ~30s).</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function Dashboard() {
  const me = await sessionUser().catch(() => null);
  if (!me) redirect("/login");
  const db = getDb();
  const orders = db.prepare("SELECT public_id, product_id, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(me.id) as any[];
  return (
    <div>
      <h1>Your orders</h1>
      {orders.length === 0 && <p style={{ color: "#aaa" }}>Nothing yet — buy something on the homepage.</p>}
      {orders.map((o) => (
        <p key={o.public_id}>
          <Link href={`/o/${o.publicId}`} style={{ color: "#9cf" }}>{o.public_id}</Link>{" "}
          <span style={{ color: "#888" }}>{o.product_id} · {o.status}</span>
        </p>
      ))}
    </div>
  );
}

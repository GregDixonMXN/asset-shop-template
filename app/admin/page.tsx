import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function Admin() {
  const me = await sessionUser().catch(() => null);
  if (!me?.isAdmin) redirect("/login");
  const db = getDb();
  const orders = db.prepare("SELECT public_id, email, product_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 50").all() as any[];
  return (
    <div>
      <h1>Admin — recent orders</h1>
      {orders.map((o) => (
        <p key={o.public_id}>
          <Link href={`/o/${o.publicId}`} style={{ color: "#9cf" }}>{o.publicId}</Link>{" "}
          <span style={{ color: "#888" }}>{o.email ?? "guest"} · {o.product_id} · {o.status}</span>
        </p>
      ))}
    </div>
  );
}

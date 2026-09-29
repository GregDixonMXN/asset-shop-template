import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, newId, PRODUCTS } from "@/lib/db";
import { sessionUser } from "@/lib/auth";

/**
 * Mock checkout: no money moves. Creates a paid order and a fulfillment job.
 * Seam ("Going live: Stripe"): verify a real payment here, then run the same
 * paid-transition below (status → paid, insert job).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const product = PRODUCTS.find((p) => p.id === body?.productId);
  if (!product) return NextResponse.json({ error: "unknown product" }, { status: 400 });
  const email = typeof body?.email === "string" && body.email.includes("@") ? body.email.toLowerCase() : null;

  const db = getDb();
  const me = await sessionUser().catch(() => null);
  const publicId = newId("ord").replace("ord_", "");
  const token = randomUUID().replace(/-/g, "");
  const id = randomUUID();
  db.prepare(
    "INSERT INTO orders (id, public_id, email, user_id, product_id, price_cents, status, receipt_token, paid_at) VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, datetime('now'))"
  ).run(id, publicId, email ?? me?.email ?? null, me?.id ?? null, product.id, product.priceCents, token);
  db.prepare("INSERT INTO jobs (order_id, stage, status) VALUES (?, 'queued', 'queued')").run(id);
  return NextResponse.json({ publicId, token });
}

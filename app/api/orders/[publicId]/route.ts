import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sessionUser } from "@/lib/auth";
import { readJob } from "../../_job";

export async function GET(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE public_id = ?").get(publicId) as any;
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  const me = await sessionUser().catch(() => null);
  const owner = me && order.user_id === me.id;
  // Receipt-token links keep working for guests; owners rely on the session.
  if (!owner && order.receipt_token !== token) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const job = order.status === "paid" || order.status === "complete" ? readJob(order.id) : null;
  const status = job?.stage === "complete" ? "complete" : order.status;
  return NextResponse.json({
    publicId: order.public_id,
    productId: order.product_id,
    status,
    job,
    downloadReady: status === "complete",
  });
}

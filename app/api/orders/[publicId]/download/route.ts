import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sessionUser } from "@/lib/auth";

/** Mock download: replace with your real artifact (S3/R2 signed URL, zip, …). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE public_id = ?").get(publicId) as any;
  if (!order || order.status !== "complete") return NextResponse.json({ error: "not ready" }, { status: 404 });
  const me = await sessionUser().catch(() => null);
  if (!(me && order.user_id === me.id) && order.receipt_token !== token) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = [
    `Asset Shop Template — mock fulfillment artifact`,
    `order: ${order.public_id}`,
    `product: ${order.product_id}`,
    ``,
    `This file stands in for your real deliverable.`,
    `Seam: serve the built artifact here (object storage, signed URL, zip).`,
    ``,
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain",
      "content-disposition": `attachment; filename="${order.public_id}.txt"`,
    },
  });
}

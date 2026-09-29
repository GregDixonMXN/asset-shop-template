import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const COMPLETE_AFTER_S = 30;

/** Read a job, advancing the mock fulfillment clock lazily (no worker needed). */
export function readJob(orderId: string): { stage: string; status: string } | null {
  const db = getDb();
  const job = db.prepare("SELECT * FROM jobs WHERE order_id = ?").get(orderId) as any;
  if (!job) return null;
  const order = db.prepare("SELECT paid_at, completed_at FROM orders WHERE id = ?").get(orderId) as any;
  const elapsed = order?.paid_at ? (Date.now() - new Date(order.paid_at + "Z").getTime()) / 1000 : 0;
  let stage = "queued";
  if (elapsed > COMPLETE_AFTER_S) stage = "complete";
  else if (elapsed > 5) stage = "working";
  if (stage !== job.stage) {
    db.prepare("UPDATE jobs SET stage = ?, status = ?, updated_at = datetime('now') WHERE order_id = ?")
      .run(stage, stage, orderId);
    if (stage === "complete" && !order.completed_at) {
      db.prepare("UPDATE orders SET status = 'complete', completed_at = datetime('now') WHERE id = ?").run(orderId);
    }
  }
  return { stage, status: stage };
}

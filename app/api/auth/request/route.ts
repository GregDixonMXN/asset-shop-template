import { NextRequest, NextResponse } from "next/server";
import { requestLink } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email.includes("@")) return NextResponse.json({ error: "valid email required" }, { status: 400 });
  const { devLink } = requestLink(email);
  // Seam ("Going live: email"): send devLink via your provider when EMAIL_API_KEY is set.
  return NextResponse.json({ ok: true, emailed: !devLink, devLink });
}

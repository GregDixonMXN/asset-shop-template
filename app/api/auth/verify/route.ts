import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { verifyCode } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const user = await verifyCode(code).catch(() => null);
  if (!user) return NextResponse.json({ error: "expired or invalid link" }, { status: 400 });
  redirect("/dashboard");
}

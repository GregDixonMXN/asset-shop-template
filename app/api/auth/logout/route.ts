import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { logout, sessionUser } from "@/lib/auth";

export async function GET() {
  await logout();
  redirect("/");
}

export async function POST() {
  const me = await sessionUser().catch(() => null);
  return NextResponse.json({ user: me });
}

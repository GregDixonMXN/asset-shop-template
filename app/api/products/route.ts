import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ products: PRODUCTS });
}

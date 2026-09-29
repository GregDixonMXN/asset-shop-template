import type { Metadata } from "next";
import Link from "next/link";
import { sessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Asset Shop Template",
  description: "Sell digital goods: guest checkout, magic-link accounts, order dashboard, mock fulfillment.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await sessionUser().catch(() => null);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#111", color: "#eee" }}>
        <header style={{ display: "flex", gap: 16, padding: "12px 20px", borderBottom: "1px solid #333" }}>
          <Link href="/" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>Asset Shop</Link>
          <span style={{ flex: 1 }} />
          {me ? (
            <>
              <Link href="/dashboard" style={{ color: "#9cf" }}>Dashboard</Link>
              {me.isAdmin && <Link href="/admin" style={{ color: "#9cf" }}>Admin</Link>}
              <span style={{ color: "#888" }}>{me.email}</span>
              <a href="/api/auth/logout" style={{ color: "#888" }}>Log out</a>
            </>
          ) : (
            <Link href="/login" style={{ color: "#9cf" }}>Log in</Link>
          )}
        </header>
        <main style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getDb, isAdminEmail } from "./db";

const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/** Request a magic link. Returns a dev link when no email provider is set. */
export function requestLink(email: string): { devLink: string | null } {
  const db = getDb();
  const code = randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare("INSERT INTO magic_links (code, email, expires_at) VALUES (?, ?, ?)")
    .run(code, email.toLowerCase(), expires);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  // Seam: send this link via Resend/Postmark here when EMAIL_API_KEY is set.
  return { devLink: `${base}/api/auth/verify?code=${code}` };
}

export async function verifyCode(code: string): Promise<SessionUser | null> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM magic_links WHERE code = ?").get(code) as any;
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return null;
  db.prepare("UPDATE magic_links SET used_at = datetime('now') WHERE code = ?").run(code);
  const email = String(row.email).toLowerCase();
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    const id = randomUUID();
    db.prepare("INSERT INTO users (id, email, is_admin) VALUES (?, ?, ?)").run(id, email, 0);
    user = { id, email, is_admin: 0 };
  }
  const admin = user.is_admin === 1 || isAdminEmail(email);
  if (admin && user.is_admin !== 1) {
    db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(user.id);
  }
  // Auto-claim guest orders placed with this email.
  db.prepare("UPDATE orders SET user_id = ? WHERE email = ? AND user_id IS NULL").run(user.id, email);
  const token = randomUUID().replace(/-/g, "");
  const exp = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, user.id, exp);
  (await cookies()).set("session", token, { httpOnly: true, path: "/", maxAge: SESSION_DAYS * 86400 });
  return { id: user.id, email, isAdmin: admin };
}

export async function sessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  const db = getDb();
  const row = db.prepare(
    "SELECT u.id, u.email, u.is_admin FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?"
  ).get(token) as any;
  if (!row || new Date((db.prepare("SELECT expires_at AS e FROM sessions WHERE token = ?").get(token) as any).e) < new Date()) {
    return null;
  }
  return { id: row.id, email: row.email, isAdmin: row.is_admin === 1 };
}

export async function logout(): Promise<void> {
  const token = (await cookies()).get("session")?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  (await cookies()).delete("session");
}

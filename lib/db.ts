import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

const DB_PATH = process.env.DATABASE_PATH ?? join(process.cwd(), "data", "shop.db");

let db: DatabaseSync | null = null;

export interface Product {
  id: string;
  name: string;
  blurb: string;
  priceCents: number;
}

export const PRODUCTS: Product[] = [
  { id: "widget", name: "Widget", blurb: "The standard thing this shop sells.", priceCents: 900 },
  { id: "widget_pro", name: "Widget Pro", blurb: "The thing, but faster and shinier.", priceCents: 2900 },
];

function connect(): DatabaseSync {
  if (!db) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    const fresh = !existsSync(DB_PATH);
    db = new DatabaseSync(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE,
        is_admin INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS magic_links (
        code TEXT PRIMARY KEY, email TEXT NOT NULL,
        expires_at TEXT NOT NULL, used_at TEXT
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, public_id TEXT NOT NULL UNIQUE,
        email TEXT, user_id TEXT REFERENCES users(id),
        product_id TEXT NOT NULL, price_cents INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'payment_pending',
        receipt_token TEXT, paid_at TEXT, completed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS jobs (
        order_id TEXT PRIMARY KEY REFERENCES orders(id),
        stage TEXT NOT NULL DEFAULT 'queued', status TEXT NOT NULL DEFAULT 'queued',
        detail TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    if (fresh) {
      const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      for (const email of admins) {
        db.prepare("INSERT OR IGNORE INTO users (id, email, is_admin) VALUES (?, ?, 1)")
          .run(randomUUID(), email);
      }
    }
  }
  return db;
}

export function getDb(): DatabaseSync {
  return connect();
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function isAdminEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((s) => s.trim().toLowerCase()).includes(email.toLowerCase());
}

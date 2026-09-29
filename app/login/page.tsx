"use client";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.devLink) setLink(data.devLink);
    else alert(data.error ?? "failed");
  }

  return (
    <div>
      <h1>Log in</h1>
      <p style={{ color: "#aaa" }}>No passwords. A 15-minute magic link, 30-day session.</p>
      <form onSubmit={send}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ width: 300, padding: 8 }}
        />{" "}
        <button type="submit" style={{ padding: 8 }}>Send link</button>
      </form>
      {link && (
        <p style={{ border: "1px solid #aa4", padding: 12, marginTop: 16 }}>
          Mock email — click to log in:{" "}
          <a href={link} style={{ color: "#9cf" }}>log in as {email}</a>
        </p>
      )}
    </div>
  );
}

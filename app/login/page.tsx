"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      style={{ backgroundImage: "radial-gradient(600px circle at 50% 40%, rgba(198,217,46,0.06), transparent 70%)" }}
    >
      <form onSubmit={handleSubmit} className="card w-full max-w-[400px] !p-8">
        <Image src="/logo_transparent.webp" alt="Galylio" width={739} height={276} priority className="mx-auto mb-2 h-14 w-auto" />
        <h1 className="mb-1 text-center font-[family-name:var(--font-display)] text-xl font-semibold">Galylio Blogs</h1>
        <p className="mb-6 text-center text-sm text-muted">Sign in to continue</p>

        <label htmlFor="u" className="label mb-1 block">Username</label>
        <input id="u" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required className="input mb-4" />

        <label htmlFor="p" className="label mb-1 block">Password</label>
        <input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="input mb-5" />

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

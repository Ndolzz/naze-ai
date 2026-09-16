"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar. Coba lagi.");
        setLoading(false);
        return;
      }
      // Account created. Sign in immediately so the person doesn't
      // have to fill the form twice.
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (!signInRes || signInRes.error) {
        setError("Akun dibuat, tapi login otomatis gagal. Coba masuk manual.");
        return;
      }
      window.location.href = "/";
    } catch {
      setLoading(false);
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-logo-pop">
            <NazeMark size={36} />
          </div>
          <h1
            className="animate-rise-in-lg font-display text-2xl font-semibold text-ink"
            style={{ animationDelay: "120ms" }}
          >
            Buat akun Naze
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="animate-rise-in-lg" style={{ animationDelay: "180ms" }}>
            <Input
              type="text"
              placeholder="Nama (opsional)"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="animate-rise-in-lg" style={{ animationDelay: "230ms" }}>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="animate-rise-in-lg" style={{ animationDelay: "280ms" }}>
            <Input
              type="password"
              placeholder="Password (minimal 8 karakter)"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-[13px] text-danger animate-rise-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="animate-rise-in-lg" style={{ animationDelay: "330ms" }}>
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
          </div>
        </form>

        <p
          className="animate-rise-in-lg text-center text-[13px] text-ink-muted"
          style={{ animationDelay: "380ms" }}
        >
          Sudah punya akun?{" "}
          <Link href="/login" className="text-accent-text hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

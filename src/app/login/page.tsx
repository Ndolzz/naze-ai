"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // redirect:false so a wrong password shows inline instead of Auth.js's
    // own generic /login?error=... redirect round-trip.
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("Email atau password salah.");
      return;
    }
    window.location.href = callbackUrl;
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
            Masuk ke Naze
          </h1>
        </div>

        <form
          onSubmit={handleCredentials}
          className="animate-rise-in-lg space-y-3"
          style={{ animationDelay: "200ms" }}
        >
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-[13px] text-danger animate-rise-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading ? "Memeriksa..." : "Masuk"}
          </Button>
        </form>

        <p
          className="animate-rise-in-lg text-center text-[13px] text-ink-muted"
          style={{ animationDelay: "280ms" }}
        >
          Belum punya akun?{" "}
          <Link href="/register" className="text-accent-text hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary at build time.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

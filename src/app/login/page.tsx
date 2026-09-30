"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setSession } from "@/lib/client-api";
import { Button, Card, Input, Label } from "@/components/workshop-ui";

type Mode = "staff" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("staff");
  const [email, setEmail] = useState("owner@servc.in");
  const [password, setPassword] = useState("ServC@123");
  const [phone, setPhone] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function staffLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api<{ token: string; user: Parameters<typeof setSession>[1] }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || "Login failed");
      return;
    }
    setSession(res.data.token, res.data.user);
    router.push(res.data.user.role === "CUSTOMER" ? "/portal" : "/dashboard");
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api<{ demoOtp?: string }>("/api/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to send OTP");
      return;
    }
    setOtpSent(true);
    if (res.data?.demoOtp) {
      setDemoOtp(res.data.demoOtp);
      setOtp(res.data.demoOtp);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api<{ token: string; user: Parameters<typeof setSession>[1] }>(
      "/api/auth/otp/verify",
      { method: "POST", body: JSON.stringify({ phone, code: otp }) }
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || "Invalid OTP");
      return;
    }
    setSession(res.data.token, res.data.user);
    router.push(res.data.user.role === "CUSTOMER" ? "/portal" : "/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, #145c45 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 80% 80%, #e8a31733 0%, transparent 45%), linear-gradient(160deg, #0b3d2e 0%, #0f1f1a 55%, #1a2e26 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center animate-fade-up">
          <div className="font-display text-5xl font-bold tracking-tight text-white md:text-6xl">
            ServC
          </div>
          <p className="mt-2 text-lg text-accent">Auto India</p>
          <p className="mt-3 max-w-md text-sm text-white/70">
            GST-ready workshop management for multi-brand service centres across India.
          </p>
        </div>

        <Card className="w-full max-w-md animate-fade-up border-0 shadow-2xl">
          <div className="mb-5 flex rounded-lg bg-surface p-1">
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "staff" ? "bg-white shadow text-ink" : "text-muted"
              }`}
              onClick={() => setMode("staff")}
            >
              Staff Login
            </button>
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "otp" ? "bg-white shadow text-ink" : "text-muted"
              }`}
              onClick={() => setMode("otp")}
            >
              Customer OTP
            </button>
          </div>

          {mode === "staff" ? (
            <form onSubmit={staffLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in to Workshop"}
              </Button>
              <p className="text-center text-xs text-muted">
                Demo: owner@servc.in / ServC@123
              </p>
            </form>
          ) : (
            <form onSubmit={otpSent ? verifyOtp : requestOtp} className="space-y-4">
              <div>
                <Label>Mobile Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  required
                  disabled={otpSent}
                />
              </div>
              {otpSent && (
                <div>
                  <Label>OTP</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    required
                  />
                  {demoOtp && (
                    <p className="mt-1 text-xs text-success">Demo OTP: {demoOtp}</p>
                  )}
                </div>
              )}
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : otpSent
                    ? "Verify & Continue"
                    : "Send OTP via WhatsApp"}
              </Button>
              {otpSent && (
                <button
                  type="button"
                  className="w-full text-xs text-muted underline"
                  onClick={() => setOtpSent(false)}
                >
                  Change number
                </button>
              )}
            </form>
          )}
        </Card>

        <p className="mt-8 text-center text-xs text-white/40">
          <Link href="/" className="hover:text-white/70">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setSession } from "@/lib/client-api";
import { Button, Input, Label } from "@/components/workshop-ui";

type Audience = "staff" | "customer";
type CustomerIntent = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>("staff");
  const [customerIntent, setCustomerIntent] = useState<CustomerIntent>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetCustomerFlow() {
    setOtpSent(false);
    setOtp("");
    setDemoOtp("");
    setError("");
  }

  function switchAudience(next: Audience) {
    setAudience(next);
    setError("");
    resetCustomerFlow();
  }

  function switchCustomerIntent(next: CustomerIntent) {
    setCustomerIntent(next);
    resetCustomerFlow();
  }

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
    if (customerIntent === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError("");
    const res = await api<{ demoOtp?: string }>("/api/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({
        phone,
        purpose: "LOGIN",
        name: customerIntent === "signup" ? name.trim() : undefined,
      }),
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
      {
        method: "POST",
        body: JSON.stringify({
          phone,
          code: otp,
          name: customerIntent === "signup" ? name.trim() : undefined,
          signup: customerIntent === "signup",
        }),
      }
    );
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || "Invalid OTP");
      return;
    }
    setSession(res.data.token, res.data.user);
    router.push(res.data.user.role === "CUSTOMER" ? "/portal" : "/dashboard");
  }

  const heading =
    audience === "staff"
      ? "Staff sign in"
      : customerIntent === "signup"
        ? "Create customer account"
        : "Customer sign in";

  const subtitle =
    audience === "staff"
      ? "Access workshop operations with your email."
      : customerIntent === "signup"
        ? "Book services and track your vehicle with OTP."
        : "Enter your mobile number to receive an OTP.";

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="auth-brand-bg absolute inset-0" aria-hidden />
      <div className="auth-brand-grain absolute inset-0" aria-hidden />
      <div className="auth-brand-sweep absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-3xl opacity-[0.16]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 45% 35% at 72% 58%, rgba(232,163,23,0.3) 0%, transparent 70%), linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.04) 55%, transparent 75%)",
        }}
      />
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-[50vh] w-auto max-w-[65vw] translate-x-[10%] opacity-[0.1]"
        viewBox="0 0 640 480"
        fill="none"
        aria-hidden
      >
        <path
          d="M40 400 V180 H120 V120 H280 V180 H360 V100 H520 V180 H600 V400"
          stroke="white"
          strokeWidth="3"
        />
        <path d="M160 400 V240 H240 V400 M400 400 V220 H480 V400" stroke="white" strokeWidth="2.5" />
        <circle cx="200" cy="400" r="36" stroke="white" strokeWidth="3" />
        <circle cx="440" cy="400" r="36" stroke="white" strokeWidth="3" />
        <path d="M80 180 H200 M360 180 H500" stroke="#e8a317" strokeWidth="2" opacity="0.8" />
      </svg>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white">
          ServC
        </Link>
        <Link
          href="/"
          className="text-sm text-white/60 transition hover:text-accent"
        >
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[440px] flex-col px-5 pb-16 pt-4 sm:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/95 p-6 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-8 animate-fade-up">
          <div className="mb-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-dark">
              Auto India
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-[1.75rem]">
              {heading}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>

          <div
            className="mb-7 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1"
            role="tablist"
            aria-label="Account type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={audience === "staff"}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                audience === "staff" ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
              onClick={() => switchAudience("staff")}
            >
              Workshop staff
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === "customer"}
              className={`rounded-lg py-2.5 text-sm font-medium transition ${
                audience === "customer" ? "bg-brand text-white" : "text-muted hover:text-ink"
              }`}
              onClick={() => switchAudience("customer")}
            >
              Customer
            </button>
          </div>

          {audience === "staff" ? (
            <form onSubmit={staffLogin} className="space-y-4">
              <div>
                <Label>Work email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@workshop.in"
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="h-11 w-full text-[15px]" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="pt-1 text-center text-xs text-muted">
                Demo: owner@servc.in / ServC@123
              </p>
            </form>
          ) : (
            <form onSubmit={otpSent ? verifyOtp : requestOtp} className="space-y-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">
                  {customerIntent === "login" ? "New here?" : "Already registered?"}
                </span>
                <button
                  type="button"
                  className="font-medium text-brand underline-offset-2 hover:underline"
                  onClick={() =>
                    switchCustomerIntent(customerIntent === "login" ? "signup" : "login")
                  }
                >
                  {customerIntent === "login" ? "Create an account" : "Sign in instead"}
                </button>
              </div>

              {customerIntent === "signup" && (
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ananya Joshi"
                    autoComplete="name"
                    required
                    disabled={otpSent}
                  />
                </div>
              )}

              <div>
                <Label>Mobile number</Label>
                <div className="flex overflow-hidden rounded-lg border border-border bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="w-full border-0 bg-transparent px-3 py-2 text-sm outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    autoComplete="tel"
                    required
                    disabled={otpSent}
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <Label>One-time password</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    required
                  />
                  {demoOtp && (
                    <p className="mt-1.5 text-xs text-success">Demo OTP: {demoOtp}</p>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button type="submit" className="h-11 w-full text-[15px]" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : otpSent
                    ? "Verify & continue"
                    : customerIntent === "signup"
                      ? "Send OTP to sign up"
                      : "Send OTP"}
              </Button>

              {otpSent && (
                <button
                  type="button"
                  className="w-full text-xs text-muted underline-offset-2 hover:underline"
                  onClick={resetCustomerFlow}
                >
                  Use a different number
                </button>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

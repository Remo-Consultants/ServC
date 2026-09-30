"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearSession, getStoredUser, SessionUser } from "@/lib/client-api";
import { formatINR, formatDateTime } from "@/lib/utils";
import { Button, Card, StatusBadge } from "@/components/workshop-ui";

type Vehicle = {
  id: string;
  registrationNo: string;
  brand: string;
  model: string;
};

type Job = {
  id: string;
  jobCardNumber: string;
  status: string;
  vehicle: { registrationNo: string; brand: string; model: string };
  invoice?: { id: string; totalAmount: string; status: string };
};

const TRACKER = [
  "REQUESTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
];

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    api<Vehicle[]>("/api/vehicles").then((r) => r.data && setVehicles(r.data));
    api<Job[]>("/api/repair-orders").then((r) => r.data && setJobs(r.data));
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-brand px-4 py-4 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <div className="font-display text-xl font-bold">ServC</div>
            <div className="text-xs text-white/60">Customer Portal</div>
          </div>
          <div className="text-right text-sm">
            <div>{user.name}</div>
            <button
              className="text-xs text-white/60 underline"
              onClick={() => {
                clearSession();
                router.replace("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 py-8">
        <section>
          <h1 className="font-display text-2xl font-bold">Namaste, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">Track service progress, approve estimates, pay via UPI.</p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">My Vehicles</h2>
            <Link href="/portal/book" className="text-sm font-medium text-brand">
              + Book Service
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((v) => (
              <Card key={v.id}>
                <div className="font-semibold">{v.registrationNo}</div>
                <div className="text-sm text-muted">
                  {v.brand} {v.model}
                </div>
              </Card>
            ))}
            {vehicles.length === 0 && (
              <Card>
                <p className="text-sm text-muted">No vehicles linked yet.</p>
              </Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Live Progress</h2>
          <div className="space-y-4">
            {jobs.map((job) => {
              const step = Math.max(0, TRACKER.indexOf(job.status));
              return (
                <Card key={job.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{job.jobCardNumber}</div>
                      <div className="text-sm text-muted">
                        {job.vehicle.registrationNo} · {job.vehicle.brand} {job.vehicle.model}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-4 flex gap-1">
                    {TRACKER.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                          i <= step ? "bg-brand" : "bg-border"
                        }`}
                        title={s}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-muted">
                    <span>Booking</span>
                    <span>Repair</span>
                    <span>Ready</span>
                  </div>
                  {job.invoice && job.invoice.status !== "PAID" && (
                    <Link
                      href={`/portal/invoices/${job.invoice.id}`}
                      className="mt-3 inline-block text-sm font-medium text-brand"
                    >
                      Pay {formatINR(Number(job.invoice.totalAmount))} via UPI →
                    </Link>
                  )}
                </Card>
              );
            })}
            {jobs.length === 0 && (
              <Card>
                <p className="text-sm text-muted">No active jobs. Book a service to get started.</p>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

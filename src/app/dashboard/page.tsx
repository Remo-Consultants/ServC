"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader, StatusBadge } from "@/components/workshop-ui";
import {
  Wrench,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Users,
  Package,
} from "lucide-react";

type DashboardData = {
  kpis: {
    openJobs: number;
    readyJobs: number;
    todayBookings: number;
    monthRevenue: number;
    outstanding: number;
    customersCount: number;
    lowStockCount: number;
  };
  statusBreakdown: { status: string; _count: number }[];
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    status: string;
    customer: { name: string };
  }[];
  technicians: { id: string; name: string; activeJobs: number }[];
  gstSummary: {
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("/api/analytics/dashboard").then((res) => {
      if (res.success && res.data) setData(res.data);
      else setError(res.error || "Failed to load");
    });
  }, []);

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!data) {
    return <p className="animate-pulse-soft text-muted">Loading dashboard…</p>;
  }

  const kpis = [
    { label: "Open Jobs", value: data.kpis.openJobs, icon: Wrench, href: "/dashboard/jobs" },
    { label: "Ready for Delivery", value: data.kpis.readyJobs, icon: Wrench, href: "/dashboard/jobs" },
    { label: "Today's Bookings", value: data.kpis.todayBookings, icon: Calendar, href: "/dashboard/bookings" },
    { label: "Month Revenue", value: formatINR(data.kpis.monthRevenue), icon: IndianRupee, href: "/dashboard/payments" },
    { label: "Outstanding", value: formatINR(data.kpis.outstanding), icon: IndianRupee, href: "/dashboard/invoices" },
    { label: "Customers", value: data.kpis.customersCount, icon: Users, href: "/dashboard/customers" },
    { label: "Low Stock SKUs", value: data.kpis.lowStockCount, icon: Package, href: "/dashboard/inventory" },
  ];

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live view of branch activity, GST collections, and bay workload"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.label} href={k.href}>
              <Card className="transition hover:border-brand/40 hover:shadow-md animate-fade-up">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {k.label}
                    </p>
                    <p className="mt-2 font-display text-2xl font-bold">{k.value}</p>
                  </div>
                  <div className="rounded-lg bg-brand/10 p-2 text-brand">
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Recent Invoices</h2>
          <div className="mt-4 divide-y divide-border">
            {data.recentInvoices.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">No invoices yet</p>
            )}
            {data.recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted">{inv.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatINR(Number(inv.totalAmount))}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">GST This Month</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Taxable Value" value={formatINR(data.gstSummary.taxable)} />
            <Row label="CGST" value={formatINR(data.gstSummary.cgst)} />
            <Row label="SGST" value={formatINR(data.gstSummary.sgst)} />
            <Row label="IGST" value={formatINR(data.gstSummary.igst)} />
            <div className="border-t border-border pt-3">
              <Row label="Total Invoiced" value={formatINR(data.gstSummary.total)} bold />
            </div>
          </div>
          <Link
            href="/dashboard/reports"
            className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
          >
            View GSTR-1 report →
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">Job Status Mix</h2>
          <div className="mt-4 space-y-2">
            {data.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <StatusBadge status={s.status} />
                <span className="font-semibold">{s._count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">Technician Workload</h2>
          <div className="mt-4 space-y-3">
            {data.technicians.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span>{t.name}</span>
                <span className="rounded-md bg-surface px-2 py-0.5 font-medium">
                  {t.activeJobs} active
                </span>
              </div>
            ))}
            {data.technicians.length === 0 && (
              <p className="text-sm text-muted">No technicians configured</p>
            )}
          </div>
        </Card>
      </div>

      {data.kpis.lowStockCount > 0 && (
        <Card className="mt-6 flex items-center gap-3 border-amber-200 bg-amber-50">
          <AlertTriangle className="text-warning" size={20} />
          <p className="text-sm">
            <strong>{data.kpis.lowStockCount}</strong> parts are at or below reorder level.{" "}
            <Link href="/dashboard/inventory" className="font-medium text-brand underline">
              Review inventory
            </Link>
          </p>
        </Card>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

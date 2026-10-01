"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/workshop-ui";
import {
  Wrench,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Users,
  Package,
  ArrowUpRight,
  CircleCheck,
  TrendingUp,
  Wallet,
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
    monthOpex: number;
    monthNet: number;
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
  salesTrend: { month: string; key: string; sales: number; expenses: number; net: number }[];
  expenseBreakdown: { category: string; amount: number }[];
};

const EXPENSE_LABELS: Record<string, string> = {
  RENT: "Rent",
  SALARIES: "Salaries",
  UTILITIES: "Utilities",
  CONSUMABLES: "Consumables",
  MARKETING: "Marketing",
  MAINTENANCE: "Maintenance",
  PARTS_PROCUREMENT: "Parts procurement",
  OTHER: "Other",
};

const EXPENSE_COLORS = ["#0b3d2e", "#145c45", "#e8a317", "#c4880f", "#5a6b64", "#1e7a4a", "#8b7355"];

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  QUALITY_CHECK: "Quality check",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
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
    return (
      <div className="rounded-2xl border border-danger/20 bg-red-50 px-5 py-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  const primary = [
    {
      label: "Open jobs",
      value: data.kpis.openJobs,
      hint: "On the floor now",
      icon: Wrench,
      href: "/dashboard/jobs",
      tone: "brand" as const,
    },
    {
      label: "Ready for delivery",
      value: data.kpis.readyJobs,
      hint: "Waiting for handover",
      icon: CircleCheck,
      href: "/dashboard/jobs",
      tone: "accent" as const,
    },
    {
      label: "Today's bookings",
      value: data.kpis.todayBookings,
      hint: "Appointments scheduled",
      icon: Calendar,
      href: "/dashboard/bookings",
      tone: "brand" as const,
    },
    {
      label: "Month revenue",
      value: formatINR(data.kpis.monthRevenue),
      hint: "Successful collections",
      icon: IndianRupee,
      href: "/dashboard/payments",
      tone: "accent" as const,
    },
  ];

  const secondary = [
    {
      label: "Month OpEx",
      value: formatINR(data.kpis.monthOpex),
      href: "/dashboard/reports",
      icon: Wallet,
    },
    {
      label: "Month net",
      value: formatINR(data.kpis.monthNet),
      href: "/dashboard/reports",
      icon: TrendingUp,
    },
    {
      label: "Outstanding",
      value: formatINR(data.kpis.outstanding),
      href: "/dashboard/invoices",
      icon: IndianRupee,
    },
    {
      label: "Customers",
      value: data.kpis.customersCount,
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      label: "Low stock",
      value: data.kpis.lowStockCount,
      href: "/dashboard/inventory",
      icon: Package,
      alert: data.kpis.lowStockCount > 0,
    },
  ];

  const statusTotal = Math.max(
    1,
    data.statusBreakdown.reduce((s, x) => s + x._count, 0)
  );
  const maxTechJobs = Math.max(1, ...data.technicians.map((t) => t.activeJobs), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-[1.75rem]">
            Today at a glance
          </h2>
          <p className="mt-1 text-sm text-muted">
            Bay load, collections, and GST for your branch
          </p>
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-light"
        >
          Open job cards <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map((k, i) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="dash-kpi group animate-fade-up"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {k.label}
                  </p>
                  <p className="mt-2 font-display text-[1.65rem] font-bold leading-none tracking-tight text-ink">
                    {k.value}
                  </p>
                  <p className="mt-2 text-xs text-muted">{k.hint}</p>
                </div>
                <div
                  className={
                    k.tone === "accent"
                      ? "rounded-xl bg-accent/20 p-2.5 text-accent-dark"
                      : "rounded-xl bg-brand/10 p-2.5 text-brand"
                  }
                >
                  <Icon size={18} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {secondary.map((k, i) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="flex items-center justify-between rounded-2xl border border-border/80 bg-white/80 px-4 py-3.5 transition hover:border-brand/30 animate-fade-up"
              style={{ animationDelay: `${180 + i * 40}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    k.alert ? "bg-amber-50 text-warning" : "bg-surface text-brand"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs text-muted">{k.label}</p>
                  <p className="font-display text-lg font-semibold text-ink">{k.value}</p>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-muted" />
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="dash-panel lg:col-span-3 animate-fade-up">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Sales vs expenses</h3>
              <p className="mt-1 text-xs text-muted">Last 6 months · collections and OpEx</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" /> Sales
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> Expenses
              </span>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b3d2e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0b3d2e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8a317" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e8a317" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5e0db" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5a6b64" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#5a6b64" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatINR(Number(value ?? 0)),
                    name === "sales" ? "Sales" : name === "expenses" ? "Expenses" : String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #d5e0db",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0b3d2e"
                  strokeWidth={2.25}
                  fill="url(#salesFill)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#e8a317"
                  strokeWidth={2.25}
                  fill="url(#expenseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dash-panel lg:col-span-2 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h3 className="font-display text-lg font-semibold text-ink">OpEx this month</h3>
          <p className="mt-1 text-xs text-muted">By category · including parts POs</p>
          <div className="mt-4 h-52 w-full">
            {data.expenseBreakdown.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">
                No expenses recorded
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.expenseBreakdown.map((e) => ({
                    ...e,
                    label: EXPENSE_LABELS[e.category] || e.category,
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5e0db" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#5a6b64" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={92}
                    tick={{ fontSize: 10, fill: "#5a6b64" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatINR(Number(value ?? 0)), "Amount"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #d5e0db",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={14}>
                    {data.expenseBreakdown.map((_, i) => (
                      <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            Total OpEx{" "}
            <span className="font-semibold text-ink">{formatINR(data.kpis.monthOpex)}</span>
          </p>
        </section>
      </div>

      {data.kpis.lowStockCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3.5 animate-fade-up">
          <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={18} />
          <p className="text-sm text-ink/90">
            <span className="font-semibold">{data.kpis.lowStockCount} SKUs</span> are at or
            below reorder level.{" "}
            <Link href="/dashboard/inventory" className="font-medium text-brand underline-offset-2 hover:underline">
              Review inventory
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="dash-panel lg:col-span-3 animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">Recent invoices</h3>
            <Link href="/dashboard/invoices" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/80">
            {data.recentInvoices.length === 0 && (
              <p className="py-10 text-center text-sm text-muted">No invoices yet</p>
            )}
            {data.recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{inv.invoiceNumber}</p>
                  <p className="truncate text-xs text-muted">{inv.customer.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-ink">
                    {formatINR(Number(inv.totalAmount))}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-panel lg:col-span-2 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <h3 className="font-display text-lg font-semibold text-ink">GST this month</h3>
          <p className="mt-1 text-xs text-muted">Intra / inter-state tax collected</p>
          <div className="mt-5 space-y-3 text-sm">
            <GstRow label="Taxable value" value={formatINR(data.gstSummary.taxable)} />
            <GstRow label="CGST" value={formatINR(data.gstSummary.cgst)} />
            <GstRow label="SGST" value={formatINR(data.gstSummary.sgst)} />
            <GstRow label="IGST" value={formatINR(data.gstSummary.igst)} />
            <div className="border-t border-border pt-3">
              <GstRow label="Total invoiced" value={formatINR(data.gstSummary.total)} bold />
            </div>
          </div>
          <Link
            href="/dashboard/reports"
            className="mt-5 inline-flex text-sm font-medium text-brand hover:underline"
          >
            Open GSTR-1 report →
          </Link>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="dash-panel animate-fade-up">
          <h3 className="font-display text-lg font-semibold text-ink">Job status mix</h3>
          <div className="mt-5 space-y-3.5">
            {data.statusBreakdown.length === 0 && (
              <p className="text-sm text-muted">No active job cards</p>
            )}
            {data.statusBreakdown.map((s) => {
              const pct = Math.round((s._count / statusTotal) * 100);
              return (
                <div key={s.status}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <StatusBadge status={s.status} />
                    <span className="tabular-nums text-muted">
                      {s._count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="sr-only">{STATUS_LABEL[s.status] || s.status}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dash-panel animate-fade-up" style={{ animationDelay: "50ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">Technician workload</h3>
            <Link href="/dashboard/jobs" className="text-xs font-medium text-brand hover:underline">
              Assign jobs
            </Link>
          </div>
          <div className="space-y-4">
            {data.technicians.length === 0 && (
              <p className="text-sm text-muted">No technicians configured</p>
            )}
            {data.technicians.map((t) => {
              const pct = Math.round((t.activeJobs / maxTechJobs) * 100);
              return (
                <div key={t.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{t.name}</span>
                    <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-brand">
                      {t.activeJobs} active
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${Math.max(pct, t.activeJobs ? 12 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function GstRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-semibold text-ink" : "text-ink/90"}`}>
      <span className={bold ? "text-ink" : "text-muted"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse-soft">
      <div className="h-8 w-48 rounded-lg bg-border/60" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/70" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/70" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="h-64 rounded-2xl bg-white/70 lg:col-span-3" />
        <div className="h-64 rounded-2xl bg-white/70 lg:col-span-2" />
      </div>
    </div>
  );
}

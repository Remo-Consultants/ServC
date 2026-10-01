"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  FileText,
  IndianRupee,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { clearSession, getStoredUser, SessionUser } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/jobs", label: "Job Cards", icon: Wrench },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/payments", label: "Payments", icon: IndianRupee },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
];

function pageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Operations";
  const match = NAV.find(
    (n) => n.href !== "/dashboard" && (pathname === n.href || pathname.startsWith(n.href + "/"))
  );
  return match?.label || "Workshop";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u || u.role === "CUSTOMER") {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  function logout() {
    clearSession();
    fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="animate-pulse-soft text-sm text-muted">Loading workspace…</div>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex min-h-screen bg-[#eef3f0]">
      <aside
        className={cn(
          "dash-sidebar fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col text-white transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative z-10 flex items-center justify-between px-5 py-6">
          <Link href="/dashboard" className="group" onClick={() => setOpen(false)}>
            <div className="font-display text-2xl font-bold tracking-tight">ServC</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-accent/90">
              Auto India
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Workspace
          </p>
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-accent font-semibold text-ink shadow-sm"
                    : "text-white/75 hover:bg-white/8 hover:text-white"
                )}
              >
                <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/45">
              {user.role.replace(/_/g, " ")}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-[#071a14]/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#d5e0db]/80 bg-[#eef3f0]/85 px-4 py-3.5 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-ink hover:bg-white lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                Namaste, {firstName}
              </p>
              <h1 className="truncate font-display text-lg font-semibold text-ink">
                {pageTitle(pathname)}
              </h1>
            </div>
            <Link
              href="/"
              className="hidden rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-brand sm:inline-flex"
            >
              Brand site
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

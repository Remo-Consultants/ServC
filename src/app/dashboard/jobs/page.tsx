"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Badge, Button, Card, PageHeader, StatusBadge } from "@/components/workshop-ui";

type Job = {
  id: string;
  jobCardNumber: string;
  status: string;
  complaint?: string;
  customer: { name: string; phone: string };
  vehicle: { registrationNo: string; brand: string; model: string };
  technician?: { name: string };
  bay?: { name: string };
  estimates: { status: string; totalAmount: string }[];
  invoice?: { invoiceNumber: string; status: string };
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const url = filter
      ? `/api/repair-orders?status=${filter}`
      : "/api/repair-orders";
    api<Job[]>(url).then((res) => {
      if (res.success && res.data) setJobs(res.data);
    });
  }, [filter]);

  return (
    <div>
      <PageHeader
        title="Job Cards"
        subtitle="Digital repair orders — Requested → Ready → Delivered"
        actions={
          <div className="flex flex-wrap gap-2">
            {["", "CONFIRMED", "IN_PROGRESS", "QUALITY_CHECK", "READY"].map((s) => (
              <Button
                key={s || "all"}
                variant={filter === s ? "primary" : "ghost"}
                onClick={() => setFilter(s)}
              >
                {s ? s.replace(/_/g, " ") : "All"}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
            <Card className="transition hover:border-brand/40 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-semibold">
                      {job.jobCardNumber}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {job.vehicle.registrationNo} · {job.vehicle.brand}{" "}
                    {job.vehicle.model}
                  </p>
                  <p className="mt-1 text-sm">
                    {job.customer.name} · {job.customer.phone}
                  </p>
                  {job.complaint && (
                    <p className="mt-2 text-sm text-ink/80">{job.complaint}</p>
                  )}
                </div>
                <div className="text-right text-xs text-muted space-y-1">
                  {job.technician && <div>Tech: {job.technician.name}</div>}
                  {job.bay && <div>Bay: {job.bay.name}</div>}
                  {job.estimates[0] && (
                    <Badge tone="info">Est. {job.estimates[0].status}</Badge>
                  )}
                  {job.invoice && (
                    <div>
                      <StatusBadge status={job.invoice.status} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {jobs.length === 0 && (
          <Card>
            <p className="py-8 text-center text-muted">No job cards found</p>
          </Card>
        )}
      </div>
    </div>
  );
}

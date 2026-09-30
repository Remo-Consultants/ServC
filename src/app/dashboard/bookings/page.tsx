"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Button, Card, PageHeader, StatusBadge } from "@/components/workshop-ui";

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  source: string;
  scheduledAt: string;
  serviceType: string;
  description?: string;
  customer: { name: string; phone: string };
  vehicle: { registrationNo: string; brand: string; model: string };
  branch: { name: string };
  repairOrder?: { id: string; jobCardNumber: string };
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await api<Booking[]>("/api/bookings");
    if (res.success && res.data) setBookings(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Omnichannel appointments with collision prevention"
      />
      {msg && <p className="mb-4 text-sm text-success">{msg}</p>}

      <div className="grid gap-3">
        {bookings.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{b.bookingNumber}</span>
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-muted">{b.source}</span>
                </div>
                <p className="mt-1 text-sm">
                  {b.vehicle.registrationNo} · {b.vehicle.brand} {b.vehicle.model}
                </p>
                <p className="text-sm text-muted">
                  {b.customer.name} · {formatDateTime(b.scheduledAt)} · {b.branch.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-brand">
                  {b.serviceType}
                </p>
              </div>
              <div>
                {b.repairOrder ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      (window.location.href = `/dashboard/jobs/${b.repairOrder!.id}`)
                    }
                  >
                    {b.repairOrder.jobCardNumber}
                  </Button>
                ) : (
                  <CheckInButton
                    bookingId={b.id}
                    onDone={() => {
                      setMsg("Checked in — job card created");
                      load();
                    }}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CheckInButton({
  bookingId,
  onDone,
}: {
  bookingId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await api(`/api/bookings/${bookingId}/check-in`, { method: "POST" });
    setLoading(false);
    if (res.success) onDone();
    else alert(res.error || "Check-in failed");
  }

  return (
    <Button disabled={loading} onClick={run}>
      {loading ? "…" : "Check In → Job Card"}
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader, Badge } from "@/components/workshop-ui";

type Vehicle = {
  id: string;
  registrationNo: string;
  brand: string;
  model: string;
  variant?: string;
  year?: number;
  fuelType: string;
  currentMileage: number;
  insuranceExpiry?: string;
  pucExpiry?: string;
  customer: { name: string; phone: string };
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    api<Vehicle[]>("/api/vehicles").then((res) => {
      if (res.success && res.data) setVehicles(res.data);
    });
  }, []);

  function expiryTone(date?: string) {
    if (!date) return "neutral" as const;
    const days = (new Date(date).getTime() - Date.now()) / 86400000;
    if (days < 0) return "danger" as const;
    if (days < 30) return "warning" as const;
    return "success" as const;
  }

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Indian registration validation · PUC & Insurance tracking · Vahan-ready fields"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <div className="font-display text-lg font-semibold">{v.registrationNo}</div>
            <p className="text-sm text-muted">
              {v.brand} {v.model} {v.variant || ""} · {v.year || "—"} · {v.fuelType}
            </p>
            <p className="mt-2 text-sm">{v.customer.name}</p>
            <p className="text-xs text-muted">{v.currentMileage.toLocaleString("en-IN")} km</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={expiryTone(v.insuranceExpiry)}>
                Ins: {formatDate(v.insuranceExpiry)}
              </Badge>
              <Badge tone={expiryTone(v.pucExpiry)}>
                PUC: {formatDate(v.pucExpiry)}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

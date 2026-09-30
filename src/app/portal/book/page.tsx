"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser } from "@/lib/client-api";
import { Button, Card, Input, Label, Select } from "@/components/workshop-ui";

type Vehicle = { id: string; registrationNo: string; brand: string; model: string };
type Branch = { id: string; name: string };

export default function BookServicePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [branchId, setBranchId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [serviceType, setServiceType] = useState("PERIODIC");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace("/login");
      return;
    }
    api<Vehicle[]>("/api/vehicles").then((r) => {
      if (r.data) {
        setVehicles(r.data);
        if (r.data[0]) setVehicleId(r.data[0].id);
      }
    });
    // Use seeded branch — customers need a branch. Fetch via a simple approach from me/company
    // For demo, we'll get branch from first booking-capable endpoint by reading company from auth me
    api<{ branch?: { id: string }; company?: { id: string } }>("/api/auth/me").then(async (r) => {
      if (r.data?.branch?.id) setBranchId(r.data.branch.id);
      else {
        // fallback: customer users may not have branch — use bookings page company default via env seed
        // Store default branch id from seed in a public endpoint would be cleaner; for now hardcode after seed
        setBranchId("SEED_BRANCH");
      }
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    // Resolve branch: if SEED_BRANCH, try to get from vehicles' company via creating with any known approach
    let resolvedBranch = branchId;
    if (branchId === "SEED_BRANCH") {
      // Fetch dashboard won't work for customer. Create booking API needs branchId.
      // We'll look up via a public branches list for the customer's company.
      const branches = await api<{ id: string; name: string }[]>("/api/branches");
      if (branches.data?.[0]) resolvedBranch = branches.data[0].id;
      else {
        setError("No branch available");
        return;
      }
    }

    const res = await api("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        vehicleId,
        branchId: resolvedBranch,
        scheduledAt,
        serviceType,
        description,
        source: "ONLINE",
      }),
    });

    if (res.success) {
      setMsg("Booking requested! Confirmation sent on WhatsApp.");
      setTimeout(() => router.push("/portal"), 1500);
    } else setError(res.error || "Booking failed");
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 font-display text-2xl font-bold">Book a Service</h1>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Vehicle</Label>
              <Select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNo} — {v.brand} {v.model}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Service Type</Label>
              <Select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="PERIODIC">Periodic Maintenance</option>
                <option value="REPAIR">General Repair</option>
                <option value="BODY">Body / Dent</option>
                <option value="DETAILING">Detailing</option>
                <option value="ACCIDENT">Accident Repair</option>
              </Select>
            </div>
            <div>
              <Label>Preferred Date & Time</Label>
              <Input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes / Complaint</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Strange noise from front left…"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            {msg && <p className="text-sm text-success">{msg}</p>}
            <Button type="submit" className="w-full">
              Confirm Booking
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { Button, Card, StatusBadge } from "@/components/workshop-ui";

type Estimate = {
  estimateNumber: string;
  version: number;
  status: string;
  totalAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  lineItems: {
    id: string;
    type: string;
    description: string;
    quantity: string;
    unitPrice: string;
    hsnSacCode?: string;
    isApproved: boolean;
  }[];
  customer: { name: string };
  repairOrder: {
    vehicle: { registrationNo: string; brand: string; model: string };
    company: { name: string };
  };
};

export default function EstimateApprovalPage() {
  const params = useParams();
  const token = params.token as string;
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Estimate>(`/api/estimates/approve/${token}`).then((res) => {
      if (res.success && res.data) {
        setEstimate(res.data);
        setSelected(res.data.lineItems.map((l) => l.id));
      } else setError(res.error || "Not found");
    });
  }, [token]);

  async function act(action: "approve" | "reject") {
    const res = await api(`/api/estimates/approve/${token}`, {
      method: "POST",
      body: JSON.stringify({ action, approvedLineIds: selected }),
    });
    if (res.success) setDone(action === "approve" ? "Approved" : "Rejected");
    else setError(res.error || "Failed");
  }

  if (error && !estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md text-center text-danger">{error}</Card>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading estimate…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="font-display text-2xl font-bold text-brand">
            {estimate.repairOrder.company.name}
          </div>
          <p className="text-sm text-muted">Service Estimate Approval</p>
        </div>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">
                {estimate.estimateNumber} v{estimate.version}
              </div>
              <div className="text-sm text-muted">
                {estimate.repairOrder.vehicle.registrationNo} ·{" "}
                {estimate.repairOrder.vehicle.brand}{" "}
                {estimate.repairOrder.vehicle.model}
              </div>
            </div>
            <StatusBadge status={done || estimate.status} />
          </div>

          <div className="mt-5 space-y-3">
            {estimate.lineItems.map((li) => (
              <label
                key={li.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(li.id)}
                  disabled={!!done || ["APPROVED", "REJECTED"].includes(estimate.status)}
                  onChange={(e) => {
                    setSelected(
                      e.target.checked
                        ? [...selected, li.id]
                        : selected.filter((id) => id !== li.id)
                    );
                  }}
                />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{li.description}</div>
                  <div className="text-xs text-muted">
                    {li.type} · HSN/SAC {li.hsnSacCode || "—"} · Qty {li.quantity}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {formatINR(Number(li.unitPrice) * Number(li.quantity))}
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>CGST</span>
              <span>{formatINR(Number(estimate.cgstAmount))}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>SGST</span>
              <span>{formatINR(Number(estimate.sgstAmount))}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatINR(Number(estimate.totalAmount))}</span>
            </div>
          </div>

          {!done && !["APPROVED", "REJECTED", "SUPERSEDED"].includes(estimate.status) && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="danger" onClick={() => act("reject")}>
                Reject
              </Button>
              <Button onClick={() => act("approve")} disabled={selected.length === 0}>
                Approve Selected
              </Button>
            </div>
          )}

          {done && (
            <p className="mt-4 text-center text-sm text-success">
              Estimate {done.toLowerCase()}. Our team will proceed accordingly.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

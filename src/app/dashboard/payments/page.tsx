"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader, StatusBadge } from "@/components/workshop-ui";

type Invoice = {
  id: string;
  invoiceNumber: string;
  payments: {
    id: string;
    paymentNumber: string;
    method: string;
    status: string;
    amount: string;
    upiTxnId?: string;
  }[];
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<
    { id: string; paymentNumber: string; method: string; status: string; amount: string; upiTxnId?: string; invoiceNumber: string }[]
  >([]);

  useEffect(() => {
    api<Invoice[]>("/api/invoices").then((res) => {
      if (res.success && res.data) {
        const flat = res.data.flatMap((inv) =>
          (inv.payments || []).map((p) => ({
            ...p,
            invoiceNumber: inv.invoiceNumber,
          }))
        );
        setPayments(flat);
      }
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="UPI-first · Razorpay / Cashfree / Paytm ready · Partial payments supported"
      />
      <div className="grid gap-3">
        {payments.length === 0 && (
          <Card>
            <p className="py-8 text-center text-muted">
              No payments yet. Generate an invoice from a job card to create a UPI intent.
            </p>
          </Card>
        )}
        {payments.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{p.paymentNumber}</div>
              <div className="text-xs text-muted">
                {p.invoiceNumber} · {p.method}
                {p.upiTxnId ? ` · ${p.upiTxnId}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatINR(Number(p.amount))}</div>
              <StatusBadge status={p.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

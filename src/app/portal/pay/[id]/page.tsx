"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { Button, Card, StatusBadge } from "@/components/workshop-ui";

type Payment = {
  id: string;
  paymentNumber: string;
  status: string;
  amount: string;
  method: string;
  qrPayload?: string;
  upiVpa?: string;
  invoice?: {
    invoiceNumber: string;
    totalAmount: string;
    company: { name: string };
  };
};

export default function PayPage() {
  const params = useParams();
  const id = params.id as string;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Payment>(`/api/payments/${id}`).then((res) => {
      if (res.success && res.data) setPayment(res.data);
    });
  }, [id]);

  async function confirm() {
    const res = await api(`/api/payments/${id}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (res.success) {
      setMsg("Payment successful! Receipt sent on WhatsApp.");
      const refreshed = await api<Payment>(`/api/payments/${id}`);
      if (refreshed.data) setPayment(refreshed.data);
    } else setMsg(res.error || "Payment failed");
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading payment…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="font-display text-2xl font-bold text-brand">
            {payment.invoice?.company.name || "ServC"}
          </div>
          <p className="text-sm text-muted">UPI Payment</p>
        </div>

        <Card className="text-center">
          <StatusBadge status={payment.status} />
          <p className="mt-4 text-sm text-muted">{payment.invoice?.invoiceNumber}</p>
          <p className="font-display text-4xl font-bold text-ink">
            {formatINR(Number(payment.amount))}
          </p>
          <p className="mt-1 text-xs text-muted">Pay to {payment.upiVpa}</p>

          {payment.qrPayload && payment.status === "PENDING" && (
            <div className="mx-auto mt-6 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-brand/30 bg-brand/5 p-4">
              <div className="text-xs text-muted">
                <div className="mb-2 font-semibold text-brand">UPI QR Ready</div>
                <div className="break-all font-mono text-[9px] leading-relaxed">
                  {payment.qrPayload.slice(0, 80)}…
                </div>
                <div className="mt-2">GPay · PhonePe · Paytm</div>
              </div>
            </div>
          )}

          {payment.status === "PENDING" && (
            <Button className="mt-6 w-full" onClick={confirm}>
              Simulate UPI Success (Demo)
            </Button>
          )}

          {msg && <p className="mt-4 text-sm text-success">{msg}</p>}
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatINR, formatDate } from "@/lib/utils";
import { Card, PageHeader, StatusBadge } from "@/components/workshop-ui";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  supplyType: string;
  totalAmount: string;
  amountDue: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  customerGstin?: string;
  customer: { name: string; phone: string; gstin?: string };
  repairOrder?: { jobCardNumber: string };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    api<Invoice[]>("/api/invoices").then((res) => {
      if (res.success && res.data) setInvoices(res.data);
    });
  }, []);

  return (
    <div>
      <PageHeader
        title="GST Invoices"
        subtitle="Tax invoices with HSN/SAC · CGST/SGST/IGST · Customer GSTIN for ITC"
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Supply</th>
              <th className="px-4 py-3">Tax</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{inv.invoiceNumber}</div>
                  <div className="text-xs text-muted">{formatDate(inv.invoiceDate)}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{inv.customer.name}</div>
                  <div className="font-mono text-xs text-muted">
                    {inv.customerGstin || inv.customer.gstin || "B2C"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{inv.supplyType}</td>
                <td className="px-4 py-3 text-xs">
                  <div>C {formatINR(Number(inv.cgstAmount))}</div>
                  <div>S {formatINR(Number(inv.sgstAmount))}</div>
                  <div>I {formatINR(Number(inv.igstAmount))}</div>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatINR(Number(inv.totalAmount))}
                  {Number(inv.amountDue) > 0 && (
                    <div className="text-xs font-normal text-warning">
                      Due {formatINR(Number(inv.amountDue))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

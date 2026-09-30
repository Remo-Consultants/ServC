"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader } from "@/components/workshop-ui";

type GstReport = {
  period: { from: string; to: string };
  b2b: { summary: Summary };
  b2c: { summary: Summary };
  hsnSummary: {
    hsnSac: string;
    qty: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
  }[];
};

type Summary = {
  count: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export default function ReportsPage() {
  const [report, setReport] = useState<GstReport | null>(null);

  useEffect(() => {
    api<GstReport>("/api/analytics/gst").then((res) => {
      if (res.success && res.data) setReport(res.data);
    });
  }, []);

  if (!report) return <p className="text-muted">Loading GST report…</p>;

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="GSTR-1 style B2B / B2C split and HSN/SAC summary for filing"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="B2B (with GSTIN)" s={report.b2b.summary} />
        <SummaryCard title="B2C" s={report.b2c.summary} />
      </div>

      <Card className="mt-6 overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3 font-display font-semibold">
          HSN / SAC Summary
        </div>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">HSN/SAC</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Taxable</th>
              <th className="px-4 py-3">CGST</th>
              <th className="px-4 py-3">SGST</th>
              <th className="px-4 py-3">IGST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {report.hsnSummary.map((h) => (
              <tr key={h.hsnSac}>
                <td className="px-4 py-3 font-mono">{h.hsnSac}</td>
                <td className="px-4 py-3">{h.qty}</td>
                <td className="px-4 py-3">{h.rate}%</td>
                <td className="px-4 py-3">{formatINR(h.taxable)}</td>
                <td className="px-4 py-3">{formatINR(h.cgst)}</td>
                <td className="px-4 py-3">{formatINR(h.sgst)}</td>
                <td className="px-4 py-3">{formatINR(h.igst)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SummaryCard({ title, s }: { title: string; s: Summary }) {
  return (
    <Card>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted">{s.count} invoices</p>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Taxable</span>
          <span>{formatINR(s.taxable)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">CGST</span>
          <span>{formatINR(s.cgst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">SGST</span>
          <span>{formatINR(s.sgst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">IGST</span>
          <span>{formatINR(s.igst)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatINR(s.total)}</span>
        </div>
      </div>
    </Card>
  );
}

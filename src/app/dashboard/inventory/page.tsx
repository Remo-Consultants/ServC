"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import { Badge, Card, PageHeader } from "@/components/workshop-ui";

type Part = {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  source: string;
  hsnCode?: string;
  sellingPrice: string;
  reorderLevel: number;
  stockItems: { quantity: number; reserved: number; branch: { name: string } }[];
};

export default function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [lowOnly, setLowOnly] = useState(false);

  useEffect(() => {
    const url = lowOnly ? "/api/inventory/parts?lowStock=true" : "/api/inventory/parts";
    api<Part[]>(url).then((res) => {
      if (res.success && res.data) setParts(res.data);
    });
  }, [lowOnly]);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="OEM · Aftermarket · Local Market parts with HSN codes"
        actions={
          <button
            className={`rounded-lg px-3 py-2 text-sm ${lowOnly ? "bg-brand text-white" : "border border-border"}`}
            onClick={() => setLowOnly(!lowOnly)}
          >
            {lowOnly ? "Showing low stock" : "Show low stock only"}
          </button>
        }
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Part</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">HSN</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parts.map((p) => {
              const qty = p.stockItems.reduce((s, i) => s + i.quantity - i.reserved, 0);
              const low = qty <= p.reorderLevel;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted">{p.brand}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.source === "OEM" ? "info" : "neutral"}>{p.source}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.hsnCode || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={low ? "font-semibold text-danger" : ""}>{qty}</span>
                    <span className="text-xs text-muted"> / reorder {p.reorderLevel}</span>
                  </td>
                  <td className="px-4 py-3">{formatINR(Number(p.sellingPrice))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

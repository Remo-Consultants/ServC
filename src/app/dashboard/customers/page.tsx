"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { formatINR } from "@/lib/utils";
import {
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
  StatusBadge,
} from "@/components/workshop-ui";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gstin?: string;
  city?: string;
  lifetimeValue: string;
  vehicles: { id: string; registrationNo: string; brand: string; model: string }[];
  _count: { repairOrders: number; invoices: number };
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    city: "",
    state: "Maharashtra",
    stateCode: "27",
    source: "WALK_IN",
  });
  const [msg, setMsg] = useState("");

  async function load(search = q) {
    const res = await api<Customer[]>(`/api/customers?q=${encodeURIComponent(search)}`);
    if (res.success && res.data) setCustomers(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await api("/api/customers", {
      method: "POST",
      body: JSON.stringify(form),
    });
    if (!res.success) {
      setMsg(res.error || "Failed");
      return;
    }
    setShowForm(false);
    setForm({
      name: "",
      phone: "",
      email: "",
      gstin: "",
      city: "",
      state: "Maharashtra",
      stateCode: "27",
      source: "WALK_IN",
    });
    setMsg("Customer created");
    load();
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="CRM with GSTIN, WhatsApp preferences, and lifetime value"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ New Customer"}
          </Button>
        }
      />

      {msg && <p className="mb-4 text-sm text-success">{msg}</p>}

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={createCustomer} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Mobile *</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>GSTIN (for ITC)</Label>
              <Input
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="27AAAAA0000A1Z5"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Source</Label>
              <Select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <option value="WALK_IN">Walk-in</option>
                <option value="ONLINE">Online</option>
                <option value="REFERRAL">Referral</option>
                <option value="WHATSAPP">WhatsApp</option>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Save Customer</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search name, phone, GSTIN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vehicles</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">LTV</th>
              <th className="px-4 py-3">GSTIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted">{c.phone}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.vehicles.map((v) => (
                    <div key={v.id}>
                      {v.registrationNo} · {v.brand} {v.model}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">{c._count.repairOrders}</td>
                <td className="px-4 py-3 font-medium">
                  {formatINR(Number(c.lifetimeValue))}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.gstin || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

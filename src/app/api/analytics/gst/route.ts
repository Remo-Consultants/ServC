import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, handleApiError } from "@/lib/api";

/** GST report for GSTR-1 style export */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.ACCOUNTANT,
    ]);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const to = searchParams.get("to") || new Date().toISOString();

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: auth.companyId!,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
        invoiceDate: { gte: new Date(from), lte: new Date(to) },
      },
      include: {
        customer: { select: { name: true, gstin: true, state: true, stateCode: true } },
        lineItems: true,
      },
      orderBy: { invoiceDate: "asc" },
    });

    const b2b = invoices.filter((i) => i.customerGstin);
    const b2c = invoices.filter((i) => !i.customerGstin);

    const summarize = (list: typeof invoices) =>
      list.reduce(
        (a, i) => ({
          count: a.count + 1,
          taxable: a.taxable + Number(i.taxableAmount),
          cgst: a.cgst + Number(i.cgstAmount),
          sgst: a.sgst + Number(i.sgstAmount),
          igst: a.igst + Number(i.igstAmount),
          total: a.total + Number(i.totalAmount),
        }),
        { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
      );

    return ok({
      period: { from, to },
      b2b: { summary: summarize(b2b), invoices: b2b },
      b2c: { summary: summarize(b2c), invoices: b2c },
      hsnSummary: buildHsnSummary(invoices),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

function buildHsnSummary(
  invoices: { lineItems: { hsnSacCode: string | null; taxableAmount: unknown; cgstAmount: unknown; sgstAmount: unknown; igstAmount: unknown; quantity: unknown; gstRate: unknown }[] }[]
) {
  const map = new Map<string, { qty: number; taxable: number; cgst: number; sgst: number; igst: number; rate: number }>();
  for (const inv of invoices) {
    for (const li of inv.lineItems) {
      const code = li.hsnSacCode || "N/A";
      const cur = map.get(code) || { qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, rate: Number(li.gstRate) };
      cur.qty += Number(li.quantity);
      cur.taxable += Number(li.taxableAmount);
      cur.cgst += Number(li.cgstAmount);
      cur.sgst += Number(li.sgstAmount);
      cur.igst += Number(li.igstAmount);
      map.set(code, cur);
    }
  }
  return Array.from(map.entries()).map(([hsnSac, v]) => ({ hsnSac, ...v }));
}

import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";
import { confirmPayment } from "@/lib/payments";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatINR } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: { include: { lineItems: true, customer: true, company: true } },
        customer: true,
      },
    });
    if (!payment) return fail("Payment not found", 404);
    return ok(payment);
  } catch (err) {
    return handleApiError(err);
  }
}

/** Confirm UPI / gateway payment (demo: instant confirm) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.payment.findUnique({
      where: { id },
      include: { customer: true, invoice: true },
    });
    if (!existing) return fail("Payment not found", 404);
    if (existing.status === "SUCCESS") return ok(existing);

    const payment = await confirmPayment(id, body.gatewayPaymentId);

    if (existing.customer.whatsappOptIn && existing.invoice) {
      await sendWhatsApp({
        phone: existing.customer.phone,
        template: "payment_receipt",
        params: {
          amount: formatINR(Number(existing.amount)).replace("₹", ""),
          invoiceNumber: existing.invoice.invoiceNumber,
          receiptLink: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoices/${existing.invoiceId}`,
        },
      });
    }

    return ok(payment);
  } catch (err) {
    return handleApiError(err);
  }
}

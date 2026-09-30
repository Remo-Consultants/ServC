import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError, generateNumber } from "@/lib/api";
import { calculateGst } from "@/lib/gst";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatINR } from "@/lib/utils";
import { createUpiPaymentIntent } from "@/lib/payments";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.ACCOUNTANT,
      Role.CUSTOMER,
    ]);

    const where: Record<string, unknown> = {};
    if (auth.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findFirst({ where: { userId: auth.userId } });
      if (!customer) return ok([]);
      where.customerId = customer.id;
    } else {
      where.companyId = auth.companyId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, gstin: true } },
        repairOrder: { select: { jobCardNumber: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return ok(invoices);
  } catch (err) {
    return handleApiError(err);
  }
}

/** Convert approved repair order → GST invoice */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.ACCOUNTANT,
    ]);

    const { repairOrderId } = await req.json();
    if (!repairOrderId) return fail("repairOrderId required");

    const order = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
        company: true,
        lineItems: { where: { isApproved: true } },
        invoice: true,
      },
    });

    if (!order) return fail("Repair order not found", 404);
    if (order.invoice) return fail("Invoice already exists for this job card", 409);
    if (!order.lineItems.length) return fail("No approved line items to invoice");

    const sellerState = order.branch.stateCode || order.company.stateCode || "27";
    const buyerState = order.customer.stateCode || sellerState;

    const gst = calculateGst(
      order.lineItems.map((li) => ({
        type: li.type as "LABOR" | "PART" | "CONSUMABLE" | "OTHER",
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        discountPct: Number(li.discountPct),
        gstRate: Number(li.gstRate),
        hsnSacCode: li.hsnSacCode || undefined,
      })),
      sellerState,
      buyerState
    );

    const invoiceNumber = await generateNumber(order.companyId, order.company.invoicePrefix, () =>
      prisma.invoice.count({ where: { companyId: order.companyId } })
    );

    const invoice = await prisma.invoice.create({
      data: {
        companyId: order.companyId,
        branchId: order.branchId,
        customerId: order.customerId,
        repairOrderId: order.id,
        invoiceNumber,
        status: "ISSUED",
        placeOfSupply: order.customer.state || order.branch.state,
        supplyType: gst.supplyType,
        customerGstin: order.customer.gstin,
        sellerGstin: order.branch.gstin || order.company.gstin,
        subtotal: gst.subtotal,
        discountAmount: gst.discountAmount,
        taxableAmount: gst.taxableAmount,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        roundOff: gst.roundOff,
        totalAmount: gst.totalAmount,
        amountDue: gst.totalAmount,
        lineItems: {
          create: gst.lines.map((l) => ({
            type: l.type,
            description: l.description,
            hsnSacCode: l.hsnSacCode,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPct: l.discountPct || 0,
            taxableAmount: l.taxableAmount,
            gstRate: l.gstRate,
            cgstAmount: l.cgstAmount,
            sgstAmount: l.sgstAmount,
            igstAmount: l.igstAmount,
            totalAmount: l.totalAmount,
          })),
        },
      },
      include: { lineItems: true, customer: true },
    });

    await prisma.repairOrder.update({
      where: { id: order.id },
      data: { status: "READY" },
    });

    // Create UPI payment intent
    const paymentIntent = await createUpiPaymentIntent({
      companyId: order.companyId,
      customerId: order.customerId,
      invoiceId: invoice.id,
      amount: gst.totalAmount,
      customerName: order.customer.name,
    });

    const payLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay/${paymentIntent.payment.id}`;

    if (order.customer.whatsappOptIn) {
      await sendWhatsApp({
        phone: order.customer.phone,
        template: "invoice_ready",
        params: {
          invoiceNumber,
          amount: formatINR(gst.totalAmount).replace("₹", ""),
          payLink,
        },
      });
    }

    return ok({ invoice, payment: paymentIntent }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { randomBytes } from "crypto";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError, generateNumber } from "@/lib/api";
import { calculateGst } from "@/lib/gst";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatRegistration } from "@/lib/vehicle";
import { formatINR } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
    ]);

    const body = await req.json();
    const { repairOrderId, lineItems, notes, sendToCustomer } = body;

    if (!repairOrderId || !lineItems?.length) {
      return fail("repairOrderId and lineItems are required");
    }

    const order = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
        company: true,
        estimates: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (!order) return fail("Repair order not found", 404);

    const sellerState = order.branch.stateCode || order.company.stateCode || "27";
    const buyerState = order.customer.stateCode || sellerState;

    const gstInput = lineItems.map(
      (li: {
        type: "LABOR" | "PART" | "CONSUMABLE" | "OTHER";
        description: string;
        quantity: number;
        unitPrice: number;
        discountPct?: number;
        gstRate?: number;
        hsnSacCode?: string;
        partId?: string;
        laborServiceId?: string;
      }) => ({
        type: li.type,
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        discountPct: Number(li.discountPct || 0),
        gstRate: Number(li.gstRate ?? 18),
        hsnSacCode: li.hsnSacCode,
      })
    );

    const gst = calculateGst(gstInput, sellerState, buyerState);
    const version = (order.estimates[0]?.version || 0) + 1;

    // Supersede previous estimate
    if (order.estimates[0]) {
      await prisma.estimate.update({
        where: { id: order.estimates[0].id },
        data: { status: "SUPERSEDED" },
      });
    }

    const estimateNumber =
      order.estimates[0]?.estimateNumber ||
      (await generateNumber(order.companyId, order.company.estimatePrefix, () =>
        prisma.estimate.count({ where: { companyId: order.companyId } })
      ));

    const approvalToken = randomBytes(24).toString("hex");

    const estimate = await prisma.estimate.create({
      data: {
        companyId: order.companyId,
        customerId: order.customerId,
        repairOrderId,
        estimateNumber,
        version,
        status: sendToCustomer ? "SENT" : "DRAFT",
        subtotal: gst.subtotal,
        discountAmount: gst.discountAmount,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        totalAmount: gst.totalAmount,
        notes: notes || null,
        approvalToken,
        sentAt: sendToCustomer ? new Date() : null,
        lineItems: {
          create: lineItems.map(
            (
              li: {
                type: "LABOR" | "PART" | "CONSUMABLE" | "OTHER";
                description: string;
                quantity: number;
                unitPrice: number;
                discountPct?: number;
                gstRate?: number;
                hsnSacCode?: string;
                partId?: string;
                laborServiceId?: string;
              },
              i: number
            ) => ({
              repairOrderId,
              type: li.type,
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              discountPct: li.discountPct || 0,
              gstRate: li.gstRate ?? 18,
              hsnSacCode: li.hsnSacCode || gst.lines[i].hsnSacCode,
              partId: li.partId || null,
              laborServiceId: li.laborServiceId || null,
              isApproved: false,
            })
          ),
        },
      },
      include: { lineItems: true },
    });

    if (sendToCustomer && order.customer.whatsappOptIn) {
      const link = `${process.env.NEXT_PUBLIC_APP_URL}/portal/estimates/${approvalToken}`;
      await sendWhatsApp({
        phone: order.customer.phone,
        template: "estimate_approval",
        params: {
          estimateNumber: `${estimateNumber}-v${version}`,
          vehicle: formatRegistration(order.vehicle.registrationNo),
          amount: formatINR(gst.totalAmount).replace("₹", ""),
          link,
        },
      });
    }

    return ok({ estimate, approvalLink: `/portal/estimates/${approvalToken}` }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

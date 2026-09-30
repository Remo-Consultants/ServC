import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

/** Public estimate approval via WhatsApp token — no auth required */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const estimate = await prisma.estimate.findUnique({
      where: { approvalToken: token },
      include: {
        lineItems: true,
        customer: { select: { name: true, phone: true } },
        repairOrder: {
          include: {
            vehicle: true,
            company: { select: { name: true, logoUrl: true } },
          },
        },
      },
    });
    if (!estimate) return fail("Estimate not found or link expired", 404);
    return ok(estimate);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { action, approvedLineIds } = await req.json();

    const estimate = await prisma.estimate.findUnique({
      where: { approvalToken: token },
      include: { lineItems: true, repairOrder: true },
    });
    if (!estimate) return fail("Estimate not found", 404);
    if (["APPROVED", "REJECTED", "SUPERSEDED"].includes(estimate.status)) {
      return fail(`Estimate already ${estimate.status.toLowerCase()}`, 409);
    }

    if (action === "reject") {
      await prisma.estimate.update({
        where: { id: estimate.id },
        data: { status: "REJECTED", rejectedAt: new Date() },
      });
      return ok({ status: "REJECTED" });
    }

    if (action === "approve") {
      const ids: string[] = approvedLineIds?.length
        ? approvedLineIds
        : estimate.lineItems.map((l) => l.id);

      await prisma.jobLineItem.updateMany({
        where: { id: { in: ids }, estimateId: estimate.id },
        data: { isApproved: true },
      });

      const allApproved = ids.length >= estimate.lineItems.length;
      await prisma.estimate.update({
        where: { id: estimate.id },
        data: {
          status: allApproved ? "APPROVED" : "PARTIALLY_APPROVED",
          approvedAt: new Date(),
        },
      });

      await prisma.repairOrder.update({
        where: { id: estimate.repairOrderId },
        data: { status: "IN_PROGRESS" },
      });

      return ok({ status: allApproved ? "APPROVED" : "PARTIALLY_APPROVED" });
    }

    return fail("action must be approve or reject");
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { Role, type RepairOrderStatus } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatRegistration } from "@/lib/vehicle";

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check",
  READY: "Ready for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(_req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.TECHNICIAN,
      Role.CUSTOMER,
    ]);

    const { id } = await params;
    const order = await prisma.repairOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
        bay: true,
        technician: { select: { id: true, name: true, phone: true } },
        advisor: { select: { id: true, name: true } },
        inspection: { include: { items: { include: { media: true } } } },
        estimates: { include: { lineItems: true }, orderBy: { version: "desc" } },
        lineItems: { include: { part: true, laborService: true } },
        media: { orderBy: { createdAt: "desc" } },
        invoice: { include: { lineItems: true, payments: true } },
        booking: true,
      },
    });

    if (!order) return fail("Repair order not found", 404);
    return ok(order);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.TECHNICIAN,
    ]);

    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.status) {
      data.status = body.status as RepairOrderStatus;
      if (body.status === "IN_PROGRESS") data.startedAt = new Date();
      if (body.status === "READY" || body.status === "QUALITY_CHECK") {
        data.completedAt = new Date();
      }
      if (body.status === "DELIVERED") data.deliveredAt = new Date();
    }
    if (body.technicianId !== undefined) data.technicianId = body.technicianId;
    if (body.bayId !== undefined) data.bayId = body.bayId;
    if (body.odometerOut !== undefined) data.odometerOut = body.odometerOut;
    if (body.fuelLevelOut !== undefined) data.fuelLevelOut = body.fuelLevelOut;
    if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes;
    if (body.complaint !== undefined) data.complaint = body.complaint;

    const order = await prisma.repairOrder.update({
      where: { id },
      data,
      include: { customer: true, vehicle: true },
    });

    if (body.status && order.customer.whatsappOptIn) {
      await sendWhatsApp({
        phone: order.customer.phone,
        template: "job_status_update",
        params: {
          vehicle: formatRegistration(order.vehicle.registrationNo),
          jobCard: order.jobCardNumber,
          status: STATUS_LABELS[body.status] || body.status,
          note: "",
        },
      });

      await prisma.vehicleActivity.create({
        data: {
          vehicleId: order.vehicleId,
          type: "STATUS_UPDATE",
          title: `Status → ${STATUS_LABELS[body.status] || body.status}`,
          entityType: "RepairOrder",
          entityId: order.id,
        },
      });
    }

    return ok(order);
  } catch (err) {
    return handleApiError(err);
  }
}

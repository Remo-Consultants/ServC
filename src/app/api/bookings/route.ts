import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError, generateNumber } from "@/lib/api";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatDateTime } from "@/lib/utils";
import { formatRegistration } from "@/lib/vehicle";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.CUSTOMER,
    ]);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (auth.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findFirst({ where: { userId: auth.userId } });
      if (!customer) return ok([]);
      where.customerId = customer.id;
    } else {
      where.companyId = auth.companyId;
      if (auth.branchId && auth.role === Role.BRANCH_MANAGER) {
        where.branchId = auth.branchId;
      }
    }

    if (status) where.status = status;
    if (from || to) {
      where.scheduledAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: true,
        branch: { select: { id: true, name: true } },
        repairOrder: { select: { id: true, jobCardNumber: true, status: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 100,
    });

    return ok(bookings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.CUSTOMER,
    ]);

    const body = await req.json();
    let { customerId, vehicleId, branchId, companyId } = body;

    if (auth.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findFirst({
        where: { userId: auth.userId },
        include: { vehicles: true },
      });
      if (!customer) return fail("Customer profile not found");
      customerId = customer.id;
      companyId = customer.companyId;
      if (!vehicleId) return fail("vehicleId required");
      const owns = customer.vehicles.some((v) => v.id === vehicleId);
      if (!owns) return fail("Vehicle not found for this customer", 403);
    } else {
      companyId = auth.companyId;
      branchId = branchId || auth.branchId;
    }

    if (!customerId || !vehicleId || !branchId || !body.scheduledAt) {
      return fail("customerId, vehicleId, branchId, and scheduledAt are required");
    }

    // Collision check — same branch within ±30 min of estimated duration
    const scheduledAt = new Date(body.scheduledAt);
    const windowStart = new Date(scheduledAt.getTime() - 30 * 60000);
    const windowEnd = new Date(scheduledAt.getTime() + (body.estimatedDuration || 60) * 60000);

    const conflict = await prisma.booking.findFirst({
      where: {
        branchId,
        status: { in: ["REQUESTED", "CONFIRMED"] },
        scheduledAt: { gte: windowStart, lte: windowEnd },
        vehicleId, // same vehicle double-booked
      },
    });
    if (conflict) {
      return fail("Scheduling conflict: vehicle already has a booking in this time window", 409);
    }

    const bookingNumber = await generateNumber(companyId, "BK", () =>
      prisma.booking.count({ where: { companyId } })
    );

    const booking = await prisma.booking.create({
      data: {
        companyId,
        branchId,
        customerId,
        vehicleId,
        bookingNumber,
        status: auth.role === Role.CUSTOMER ? "REQUESTED" : "CONFIRMED",
        source: body.source || (auth.role === Role.CUSTOMER ? "ONLINE" : "WALK_IN"),
        scheduledAt,
        estimatedDuration: body.estimatedDuration || 60,
        serviceType: body.serviceType || "PERIODIC",
        description: body.description || null,
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
    });

    await prisma.vehicleActivity.create({
      data: {
        vehicleId,
        type: "BOOKING",
        title: `Booking ${bookingNumber}`,
        description: `${body.serviceType || "PERIODIC"} — ${formatDateTime(scheduledAt)}`,
        entityType: "Booking",
        entityId: booking.id,
      },
    });

    if (booking.customer.whatsappOptIn) {
      await sendWhatsApp({
        phone: booking.customer.phone,
        template: "booking_confirmation",
        params: {
          name: booking.customer.name,
          bookingNumber,
          vehicle: formatRegistration(booking.vehicle.registrationNo),
          datetime: formatDateTime(scheduledAt),
          branch: booking.branch.name,
        },
      });
    }

    return ok(booking, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError, generateNumber } from "@/lib/api";
import { sendWhatsApp } from "@/lib/whatsapp";
import { formatRegistration } from "@/lib/vehicle";

const DEFAULT_CHECKLIST = [
  { category: "Engine", itemName: "Engine oil level" },
  { category: "Engine", itemName: "Coolant level" },
  { category: "Engine", itemName: "Air filter condition" },
  { category: "Engine", itemName: "Battery condition" },
  { category: "Brakes", itemName: "Brake pad thickness" },
  { category: "Brakes", itemName: "Brake fluid level" },
  { category: "Brakes", itemName: "Handbrake operation" },
  { category: "Tyres", itemName: "Front tyre tread" },
  { category: "Tyres", itemName: "Rear tyre tread" },
  { category: "Tyres", itemName: "Tyre pressure" },
  { category: "Tyres", itemName: "Spare wheel" },
  { category: "Electrical", itemName: "Headlights / Indicators" },
  { category: "Electrical", itemName: "Horn" },
  { category: "Electrical", itemName: "Wipers" },
  { category: "Body", itemName: "Exterior damage check" },
  { category: "Body", itemName: "Underbody inspection" },
  { category: "Interior", itemName: "AC / Climate control" },
  { category: "Interior", itemName: "Seat belts" },
];

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.TECHNICIAN,
      Role.CUSTOMER,
    ]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: Record<string, unknown> = {};

    if (auth.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findFirst({ where: { userId: auth.userId } });
      if (!customer) return ok([]);
      where.customerId = customer.id;
    } else if (auth.role === Role.TECHNICIAN) {
      where.technicianId = auth.userId;
    } else {
      where.companyId = auth.companyId;
      if (auth.branchId) where.branchId = auth.branchId;
    }

    if (status) where.status = status;

    const orders = await prisma.repairOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: true,
        technician: { select: { id: true, name: true } },
        advisor: { select: { id: true, name: true } },
        bay: true,
        inspection: { include: { items: true } },
        estimates: { orderBy: { version: "desc" }, take: 1 },
        invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
        _count: { select: { lineItems: true, media: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return ok(orders);
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
    ]);

    const body = await req.json();
    const companyId = auth.companyId!;
    const branchId = body.branchId || auth.branchId;
    if (!body.customerId || !body.vehicleId || !branchId) {
      return fail("customerId, vehicleId, and branchId are required");
    }

    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const jobCardNumber = await generateNumber(companyId, company.jobCardPrefix, () =>
      prisma.repairOrder.count({ where: { companyId } })
    );

    const order = await prisma.repairOrder.create({
      data: {
        companyId,
        branchId,
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        bookingId: body.bookingId || null,
        bayId: body.bayId || null,
        advisorId: auth.userId,
        technicianId: body.technicianId || null,
        jobCardNumber,
        status: "CONFIRMED",
        complaint: body.complaint || null,
        odometerIn: body.odometerIn || null,
        fuelLevelIn: body.fuelLevelIn ?? null,
        customerNotes: body.customerNotes || null,
        promisedAt: body.promisedAt ? new Date(body.promisedAt) : null,
        inspection: {
          create: {
            inspectorId: auth.userId,
            fuelLevel: body.fuelLevelIn ?? null,
            items: {
              create: DEFAULT_CHECKLIST.map((c) => ({
                category: c.category,
                itemName: c.itemName,
                status: "NA",
              })),
            },
          },
        },
      },
      include: {
        customer: true,
        vehicle: true,
        inspection: { include: { items: true } },
      },
    });

    if (body.bookingId) {
      await prisma.booking.update({
        where: { id: body.bookingId },
        data: { status: "CHECKED_IN", checkedInAt: new Date() },
      });
    }

    if (body.odometerIn) {
      await prisma.vehicle.update({
        where: { id: body.vehicleId },
        data: { currentMileage: body.odometerIn },
      });
    }

    await prisma.vehicleActivity.create({
      data: {
        vehicleId: body.vehicleId,
        type: "JOB_CARD",
        title: `Job Card ${jobCardNumber}`,
        description: body.complaint || "Vehicle checked in",
        entityType: "RepairOrder",
        entityId: order.id,
      },
    });

    if (order.customer.whatsappOptIn) {
      await sendWhatsApp({
        phone: order.customer.phone,
        template: "job_status_update",
        params: {
          vehicle: formatRegistration(order.vehicle.registrationNo),
          jobCard: jobCardNumber,
          status: "Checked In",
          note: "Digital inspection in progress.",
        },
      });
    }

    return ok(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

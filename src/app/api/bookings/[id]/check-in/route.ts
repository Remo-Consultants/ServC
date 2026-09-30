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

export async function POST(
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
    ]);

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, vehicle: true, repairOrder: true },
    });
    if (!booking) return fail("Booking not found", 404);
    if (booking.repairOrder) return fail("Already checked in", 409);

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: booking.companyId },
    });
    const jobCardNumber = await generateNumber(booking.companyId, company.jobCardPrefix, () =>
      prisma.repairOrder.count({ where: { companyId: booking.companyId } })
    );

    const order = await prisma.repairOrder.create({
      data: {
        companyId: booking.companyId,
        branchId: booking.branchId,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        bookingId: booking.id,
        advisorId: auth.userId,
        jobCardNumber,
        status: "CONFIRMED",
        complaint: body.complaint || booking.description || booking.serviceType,
        odometerIn: body.odometerIn || booking.vehicle.currentMileage,
        fuelLevelIn: body.fuelLevelIn ?? 50,
        inspection: {
          create: {
            inspectorId: auth.userId,
            fuelLevel: body.fuelLevelIn ?? 50,
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
      include: { inspection: true },
    });

    await prisma.booking.update({
      where: { id },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });

    if (booking.customer.whatsappOptIn) {
      await sendWhatsApp({
        phone: booking.customer.phone,
        template: "job_status_update",
        params: {
          vehicle: formatRegistration(booking.vehicle.registrationNo),
          jobCard: jobCardNumber,
          status: "Checked In",
          note: "Digital inspection starting.",
        },
      });
    }

    return ok(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";
import {
  isValidIndianRegistration,
  normalizeRegistration,
  formatRegistration,
} from "@/lib/vehicle";

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
    const customerId = searchParams.get("customerId");
    const reg = searchParams.get("reg");

    const where: Record<string, unknown> = { isActive: true };

    if (auth.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findFirst({
        where: { userId: auth.userId },
      });
      if (!customer) return ok([]);
      where.customerId = customer.id;
    } else {
      where.companyId = auth.companyId;
      if (customerId) where.customerId = customerId;
    }

    if (reg) {
      where.registrationNo = { contains: normalizeRegistration(reg) };
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return ok(vehicles);
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
    if (!isValidIndianRegistration(body.registrationNo)) {
      return fail("Invalid Indian vehicle registration number (e.g. MH 12 AB 1234)");
    }

    const registrationNo = normalizeRegistration(body.registrationNo);
    let customerId = body.customerId;
    let companyId = auth.companyId;

    if (auth.role === Role.CUSTOMER) {
      const customer = await prisma.customer.findFirst({ where: { userId: auth.userId } });
      if (!customer) return fail("Customer profile not found", 404);
      customerId = customer.id;
      companyId = customer.companyId;
    }

    if (!customerId || !body.brand || !body.model) {
      return fail("customerId, brand, and model are required");
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: companyId!,
        customerId,
        registrationNo,
        brand: body.brand,
        model: body.model,
        variant: body.variant || null,
        year: body.year || null,
        color: body.color || null,
        vin: body.vin || null,
        fuelType: body.fuelType || "PETROL",
        transmission: body.transmission || null,
        currentMileage: body.currentMileage || 0,
        insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
        pucExpiry: body.pucExpiry ? new Date(body.pucExpiry) : null,
        notes: body.notes || null,
      },
    });

    await prisma.vehicleActivity.create({
      data: {
        vehicleId: vehicle.id,
        type: "VEHICLE_ADDED",
        title: "Vehicle registered",
        description: `${formatRegistration(registrationNo)} — ${body.brand} ${body.model}`,
      },
    });

    return ok({ ...vehicle, displayReg: formatRegistration(registrationNo) }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

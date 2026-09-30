import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.SERVICE_ADVISOR,
      Role.ACCOUNTANT,
    ]);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const companyId = auth.companyId!;

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        OR: q
            ? [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
              { gstin: { contains: q } },
            ]
          : undefined,
      },
      include: {
        vehicles: { where: { isActive: true }, take: 5 },
        _count: { select: { repairOrders: true, invoices: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return ok(customers);
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
    const phone = String(body.phone).replace(/\D/g, "").slice(-10);

    if (!body.name || !phone) return fail("Name and phone are required");

    const existing = await prisma.customer.findUnique({
      where: { companyId_phone: { companyId: auth.companyId!, phone } },
    });
    if (existing) return fail("Customer with this phone already exists", 409);

    const customer = await prisma.customer.create({
      data: {
        companyId: auth.companyId!,
        name: body.name,
        phone,
        email: body.email || null,
        gstin: body.gstin || null,
        addressLine1: body.addressLine1 || null,
        city: body.city || null,
        state: body.state || null,
        stateCode: body.stateCode || null,
        pincode: body.pincode || null,
        source: body.source || "WALK_IN",
        whatsappOptIn: body.whatsappOptIn !== false,
        preferredLang: body.preferredLang || "en",
        notes: body.notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: auth.companyId,
        userId: auth.userId,
        action: "CUSTOMER_CREATE",
        entityType: "Customer",
        entityId: customer.id,
      },
    });

    return ok(customer, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

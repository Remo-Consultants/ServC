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
      Role.INVENTORY_MANAGER,
      Role.SERVICE_ADVISOR,
    ]);

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const lowStock = searchParams.get("lowStock") === "true";

    const parts = await prisma.part.findMany({
      where: {
        companyId: auth.companyId!,
        isActive: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { sku: { contains: q } },
                { brand: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        stockItems: {
          include: { branch: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    const result = lowStock
      ? parts.filter((p) => {
          const total = p.stockItems.reduce((s, i) => s + i.quantity - i.reserved, 0);
          return total <= p.reorderLevel;
        })
      : parts;

    return ok(result);
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
      Role.INVENTORY_MANAGER,
    ]);

    const body = await req.json();
    if (!body.sku || !body.name) return fail("sku and name required");

    const part = await prisma.part.create({
      data: {
        companyId: auth.companyId!,
        sku: body.sku,
        name: body.name,
        description: body.description,
        brand: body.brand,
        hsnCode: body.hsnCode,
        source: body.source || "AFTERMARKET",
        unit: body.unit || "PCS",
        gstRate: body.gstRate ?? 18,
        mrp: body.mrp ?? 0,
        costPrice: body.costPrice ?? 0,
        sellingPrice: body.sellingPrice ?? 0,
        reorderLevel: body.reorderLevel ?? 5,
        compatibleVehicles: body.compatibleVehicles,
      },
    });

    // Initialize stock at branch if provided
    if (body.branchId && body.initialQty != null) {
      await prisma.stockItem.create({
        data: {
          branchId: body.branchId,
          partId: part.id,
          quantity: body.initialQty,
          location: body.location,
        },
      });
    }

    return ok(part, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

/** List branches for the authenticated user's company (staff or customer) */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return fail("Unauthorized", 401);

    let companyId = auth.companyId;
    if (!companyId && auth.role === "CUSTOMER") {
      const customer = await prisma.customer.findFirst({
        where: { userId: auth.userId },
      });
      companyId = customer?.companyId || null;
    }

    if (!companyId) {
      // Return first active company's branches for demo walk-in customers
      const company = await prisma.company.findFirst({ where: { isActive: true } });
      companyId = company?.id || null;
    }

    if (!companyId) return ok([]);

    const branches = await prisma.branch.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        phone: true,
      },
    });

    return ok(branches);
  } catch (err) {
    return handleApiError(err);
  }
}

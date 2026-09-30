import { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthFromRequest(req);
    if (!session) return fail("Not authenticated", 401);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: { select: { id: true, name: true, gstin: true } },
        branch: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true } },
      },
    });

    if (!user) return fail("User not found", 404);
    return ok(user);
  } catch (err) {
    return handleApiError(err);
  }
}

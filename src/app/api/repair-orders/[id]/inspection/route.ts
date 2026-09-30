import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

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

    const inspection = await prisma.inspection.findUnique({
      where: { repairOrderId: id },
    });
    if (!inspection) return fail("Inspection not found. Create a repair order first.", 404);

    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        await prisma.inspectionItem.update({
          where: { id: item.id },
          data: {
            status: item.status,
            notes: item.notes ?? undefined,
            photoUrl: item.photoUrl ?? undefined,
          },
        });
      }
    }

    const updated = await prisma.inspection.update({
      where: { id: inspection.id },
      data: {
        damageDiagram:
          body.damageDiagram == null
            ? undefined
            : typeof body.damageDiagram === "string"
              ? body.damageDiagram
              : JSON.stringify(body.damageDiagram),
        fuelLevel: body.fuelLevel ?? undefined,
        overallNotes: body.overallNotes ?? undefined,
        sectionNotes:
          body.sectionNotes == null
            ? undefined
            : typeof body.sectionNotes === "string"
              ? body.sectionNotes
              : JSON.stringify(body.sectionNotes),
        customerSignUrl: body.customerSignUrl ?? undefined,
        completedAt: body.complete ? new Date() : undefined,
        inspectorId: auth.userId,
      },
      include: { items: { include: { media: true } } },
    });

    if (body.complete) {
      await prisma.repairOrder.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

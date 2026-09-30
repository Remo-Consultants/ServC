import { NextRequest } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleApiError } from "@/lib/api";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/3gpp",
]);

function mediaTypeFromMime(mime: string): "IMAGE" | "VIDEO" | null {
  if (IMAGE_TYPES.has(mime)) return "IMAGE";
  if (VIDEO_TYPES.has(mime)) return "VIDEO";
  return null;
}

export async function GET(
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
      Role.CUSTOMER,
    ]);

    const { id } = await params;
    const category = req.nextUrl.searchParams.get("category");
    const itemId = req.nextUrl.searchParams.get("inspectionItemId");

    const media = await prisma.jobMedia.findMany({
      where: {
        repairOrderId: id,
        ...(category ? { category } : {}),
        ...(itemId ? { inspectionItemId: itemId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(media);
  } catch (err) {
    return handleApiError(err);
  }
}

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
      Role.TECHNICIAN,
    ]);

    const { id } = await params;
    const order = await prisma.repairOrder.findUnique({ where: { id } });
    if (!order) return fail("Repair order not found", 404);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("file is required", 400);

    const mime = file.type || "application/octet-stream";
    const mediaType = mediaTypeFromMime(mime);
    if (!mediaType) {
      return fail("Only image or video uploads are allowed", 400);
    }

    if (file.size > 40 * 1024 * 1024) {
      return fail("File too large (max 40MB)", 400);
    }

    const category = (form.get("category") as string) || null;
    const inspectionItemId = (form.get("inspectionItemId") as string) || null;
    const caption = (form.get("caption") as string) || null;

    if (inspectionItemId) {
      const item = await prisma.inspectionItem.findFirst({
        where: {
          id: inspectionItemId,
          inspection: { repairOrderId: id },
        },
      });
      if (!item) return fail("Inspection item not found on this job card", 404);
    }

    const ext =
      path.extname(file.name) ||
      (mediaType === "IMAGE" ? ".jpg" : ".mp4");
    const filename = `${randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "jobs", id);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    const url = `/uploads/jobs/${id}/${filename}`;
    const media = await prisma.jobMedia.create({
      data: {
        repairOrderId: id,
        inspectionItemId,
        category,
        url,
        mediaType,
        caption,
        uploadedBy: auth.userId,
      },
    });

    if (inspectionItemId && mediaType === "IMAGE") {
      await prisma.inspectionItem.update({
        where: { id: inspectionItemId },
        data: { photoUrl: url },
      });
    }

    return ok(media, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
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
    const mediaId = req.nextUrl.searchParams.get("mediaId");
    if (!mediaId) return fail("mediaId is required", 400);

    const media = await prisma.jobMedia.findFirst({
      where: { id: mediaId, repairOrderId: id },
    });
    if (!media) return fail("Media not found", 404);

    if (media.url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", media.url);
      await unlink(filePath).catch(() => undefined);
    }

    await prisma.jobMedia.delete({ where: { id: media.id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

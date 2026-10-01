import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp, signToken } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { Role } from "@/lib/roles";

/** POST /api/auth/otp/verify — verify OTP and issue JWT */
export async function POST(req: NextRequest) {
  try {
    const { phone, code, purpose = "LOGIN", name, signup } = await req.json();
    const normalized = String(phone).replace(/\D/g, "").slice(-10);

    if (!normalized || !code) return fail("Phone and OTP code required");

    const valid = await verifyOtp(normalized, String(code), purpose);
    if (!valid) return fail("Invalid or expired OTP", 401);

    let user = await prisma.user.findUnique({ where: { phone: normalized } });

    if (signup && user) {
      return fail("An account with this mobile number already exists. Please use Customer Login.", 409);
    }

    // Auto-create customer portal user on first login / sign up
    if (!user) {
      const displayName =
        typeof name === "string" && name.trim()
          ? name.trim()
          : `Customer ${normalized.slice(-4)}`;

      const company = await prisma.company.findFirst({ where: { isActive: true } });

      user = await prisma.user.create({
        data: {
          phone: normalized,
          name: displayName,
          role: Role.CUSTOMER,
          companyId: company?.id || null,
        },
      });

      if (company) {
        await prisma.customer.upsert({
          where: {
            companyId_phone: { companyId: company.id, phone: normalized },
          },
          create: {
            companyId: company.id,
            userId: user.id,
            name: displayName,
            phone: normalized,
            source: "ONLINE",
            whatsappOptIn: true,
          },
          update: {
            userId: user.id,
            name: displayName,
          },
        });
      }
    } else if (typeof name === "string" && name.trim() && user.name.startsWith("Customer ")) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    if (!user.isActive) return fail("Account is disabled", 403);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      userId: user.id,
      role: user.role as Role,
      companyId: user.companyId,
      branchId: user.branchId,
      phone: user.phone,
      name: user.name,
    };

    const token = signToken(payload);

    const response = ok({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        preferredLang: user.preferredLang,
      },
    });

    response.cookies.set("servc_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}

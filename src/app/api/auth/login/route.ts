import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { Role } from "@/lib/roles";

/** POST /api/auth/login — staff email/password login */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return fail("Email and password required");

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) return fail("Invalid credentials", 401);
    if (!user.isActive) return fail("Account is disabled", 403);

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return fail("Invalid credentials", 401);

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

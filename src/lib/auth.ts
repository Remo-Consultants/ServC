import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/roles";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "servc-dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface AuthPayload {
  userId: string;
  role: Role;
  companyId: string | null;
  branchId: string | null;
  phone: string;
  name: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function generateOtp(): string {
  if (process.env.OTP_MOCK === "true") return "123456";
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(phone: string, purpose = "LOGIN") {
  const code = generateOtp();
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.otpToken.create({
    data: { phone, code, purpose, expiresAt },
  });

  // Mock SMS / WhatsApp delivery in demo mode
  if (process.env.OTP_MOCK === "true") {
    console.log(`[OTP MOCK] ${phone} → ${code} (${purpose})`);
  }
  // Production: integrate MSG91 / Twilio / WhatsApp here

  return { expiresAt, mock: process.env.OTP_MOCK === "true", ...(process.env.OTP_MOCK === "true" ? { code } : {}) };
}

export async function verifyOtp(phone: string, code: string, purpose = "LOGIN") {
  const token = await prisma.otpToken.findFirst({
    where: {
      phone,
      code,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return false;

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
  return true;
}

export async function getAuthFromRequest(req: NextRequest): Promise<AuthPayload | null> {
  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = req.cookies.get("servc_token")?.value;
  const token = bearer || cookieToken;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSession(): Promise<AuthPayload | null> {
  const jar = await cookies();
  const token = jar.get("servc_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Role hierarchy helpers */
export const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.COMPANY_OWNER,
  Role.BRANCH_MANAGER,
  Role.SERVICE_ADVISOR,
  Role.TECHNICIAN,
  Role.INVENTORY_MANAGER,
  Role.ACCOUNTANT,
];

export function hasRole(user: AuthPayload, allowed: Role | Role[]): boolean {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (user.role === Role.SUPER_ADMIN) return true;
  return list.includes(user.role);
}

export function requireRoles(user: AuthPayload | null, allowed: Role[]): asserts user is AuthPayload {
  if (!user || !hasRole(user, allowed)) {
    throw new AuthError("Unauthorized", 401);
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

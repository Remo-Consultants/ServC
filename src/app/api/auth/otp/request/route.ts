import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { sendWhatsApp } from "@/lib/whatsapp";

/** POST /api/auth/otp/request — request OTP for phone login */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, purpose = "LOGIN" } = body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      return fail("Valid 10-digit Indian mobile number required");
    }

    const normalized = phone.replace(/\D/g, "").slice(-10);
    const result = await createAndSendOtp(normalized, purpose);

    await sendWhatsApp({
      phone: normalized,
      template: "otp",
      params: { code: process.env.OTP_MOCK === "true" ? "123456" : "******", minutes: "10" },
    });

    return ok({
      message: "OTP sent successfully",
      phone: normalized,
      expiresAt: result.expiresAt,
      ...(result.mock ? { demoOtp: "123456" } : {}),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

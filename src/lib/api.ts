import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    return fail(err.message, err.status);
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return fail(message, 500);
}

export async function generateNumber(
  companyId: string,
  prefix: string,
  countFn: () => Promise<number>
) {
  const count = await countFn();
  const year = new Date().getFullYear().toString().slice(-2);
  return `${prefix}${year}${String(count + 1).padStart(5, "0")}`;
}

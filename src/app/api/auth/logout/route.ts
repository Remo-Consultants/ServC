import { NextRequest } from "next/server";
import { ok } from "@/lib/api";

export async function POST(_req: NextRequest) {
  const response = ok({ message: "Logged out" });
  response.cookies.set("servc_token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}

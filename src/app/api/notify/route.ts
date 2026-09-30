import { NextResponse } from "next/server";

type NotifyBody = {
  channel?: "email" | "whatsapp";
  to?: string;
  subject?: string;
  message?: string;
  jobCardSummary?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let body: NotifyBody;
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
  const to = (body.to || "").trim();
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "Recipient (to) is required" },
      { status: 400 }
    );
  }

  const deliveryId = `mock_${channel}_${Date.now()}`;
  const payload = {
    ok: true,
    mocked: true,
    channel,
    to,
    deliveryId,
    subject: body.subject ?? "ServC job card update",
    preview: body.message ?? "Your job card details are ready.",
    jobCardSummary: body.jobCardSummary ?? null,
    sentAt: new Date().toISOString(),
  };

  console.log("[ServC mock notify]", JSON.stringify(payload, null, 2));

  return NextResponse.json(payload);
}

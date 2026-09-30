import { prisma } from "./prisma";

type WhatsAppTemplate =
  | "booking_confirmation"
  | "appointment_reminder"
  | "estimate_approval"
  | "job_status_update"
  | "invoice_ready"
  | "payment_receipt"
  | "otp";

interface SendOptions {
  phone: string;
  template: WhatsAppTemplate;
  params: Record<string, string>;
  mediaUrl?: string;
}

/**
 * WhatsApp Business API sender.
 * When WHATSAPP_MOCK=true, logs messages instead of calling Meta Graph API.
 */
export async function sendWhatsApp({ phone, template, params, mediaUrl }: SendOptions) {
  const to = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "").slice(-10)}`;
  const body = renderTemplate(template, params);

  if (process.env.WHATSAPP_MOCK === "true" || !process.env.WHATSAPP_ACCESS_TOKEN) {
    console.log(`[WhatsApp MOCK] → ${to}`);
    console.log(`  Template: ${template}`);
    console.log(`  Message: ${body}`);
    if (mediaUrl) console.log(`  Media: ${mediaUrl}`);
    return { success: true, mock: true, messageId: `mock_${Date.now()}` };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const url = `${process.env.WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace("+", ""),
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send failed:", err);
    return { success: false, error: err };
  }

  const data = await res.json();
  return { success: true, messageId: data.messages?.[0]?.id };
}

function renderTemplate(template: WhatsAppTemplate, p: Record<string, string>): string {
  const map: Record<WhatsAppTemplate, string> = {
    booking_confirmation: `Namaste ${p.name}! ✅ Your service booking *${p.bookingNumber}* for *${p.vehicle}* is confirmed on *${p.datetime}* at ${p.branch}. — ServC Auto India`,
    appointment_reminder: `Reminder: Your vehicle *${p.vehicle}* service is scheduled tomorrow at *${p.datetime}*. Reply YES to confirm. — ServC`,
    estimate_approval: `Estimate *${p.estimateNumber}* for *${p.vehicle}* is ready. Amount: ₹${p.amount}. Review & approve: ${p.link}`,
    job_status_update: `Update: Your *${p.vehicle}* job card *${p.jobCard}* is now *${p.status}*. ${p.note || ""}`,
    invoice_ready: `GST Invoice *${p.invoiceNumber}* for ₹${p.amount} is ready. Pay via UPI: ${p.payLink}`,
    payment_receipt: `Payment of ₹${p.amount} received for invoice *${p.invoiceNumber}*. Thank you! Receipt: ${p.receiptLink}`,
    otp: `Your ServC verification code is *${p.code}*. Valid for ${p.minutes || "10"} minutes. Do not share.`,
  };
  return map[template];
}

export async function logCommunication(
  companyId: string,
  customerId: string,
  channel: string,
  template: string,
  status: string
) {
  await prisma.auditLog.create({
    data: {
      companyId,
      action: `COMM_${channel}_${status}`,
      entityType: "Customer",
      entityId: customerId,
      metadata: JSON.stringify({ template, channel }),
    },
  });
}

import { prisma } from "./prisma";
import { formatINR } from "./utils";

/**
 * Mock UPI / Razorpay payment helpers.
 * In production, replace with real Razorpay Orders API + webhooks.
 */

export async function createUpiPaymentIntent(opts: {
  companyId: string;
  customerId: string;
  invoiceId: string;
  amount: number;
  customerName: string;
  upiId?: string;
}) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: opts.companyId },
  });

  const count = await prisma.payment.count({ where: { companyId: opts.companyId } });
  const paymentNumber = `PAY${new Date().getFullYear().toString().slice(-2)}${String(count + 1).padStart(5, "0")}`;

  // UPI deep-link / QR payload (UPI Intent format)
  const payeeVpa = opts.upiId || `${company.name.toLowerCase().replace(/\s+/g, "")}@oksbi`;
  const qrPayload = [
    "upi://pay?",
    `pa=${encodeURIComponent(payeeVpa)}`,
    `&pn=${encodeURIComponent(company.name)}`,
    `&am=${opts.amount.toFixed(2)}`,
    `&cu=INR`,
    `&tn=${encodeURIComponent(`Invoice payment`)}`,
  ].join("");

  const payment = await prisma.payment.create({
    data: {
      companyId: opts.companyId,
      customerId: opts.customerId,
      invoiceId: opts.invoiceId,
      paymentNumber,
      method: "UPI",
      status: "PENDING",
      amount: opts.amount,
      upiVpa: payeeVpa,
      qrPayload,
      gatewayOrderId: `order_mock_${Date.now()}`,
    },
  });

  return {
    payment,
    qrPayload,
    amountDisplay: formatINR(opts.amount),
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  };
}

export async function confirmPayment(paymentId: string, gatewayPaymentId?: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "SUCCESS",
      paidAt: new Date(),
      gatewayPaymentId: gatewayPaymentId || `pay_mock_${Date.now()}`,
      upiTxnId: `UPI${Date.now()}`,
    },
    include: { invoice: true },
  });

  if (payment.invoiceId && payment.invoice) {
    const amountPaid = Number(payment.invoice.amountPaid) + Number(payment.amount);
    const amountDue = Math.max(0, Number(payment.invoice.totalAmount) - amountPaid);
    const status = amountDue <= 0 ? "PAID" : "PARTIALLY_PAID";

    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { amountPaid, amountDue, status },
    });

    // Update customer LTV
    await prisma.customer.update({
      where: { id: payment.customerId },
      data: { lifetimeValue: { increment: Number(payment.amount) } },
    });
  }

  return payment;
}

import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, handleApiError } from "@/lib/api";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

function lastNMonthKeys(n: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromRequest(req);
    requireRoles(auth, [
      Role.SUPER_ADMIN,
      Role.COMPANY_OWNER,
      Role.BRANCH_MANAGER,
      Role.ACCOUNTANT,
      Role.SERVICE_ADVISOR,
    ]);

    const companyId = auth.companyId!;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      openJobs,
      readyJobs,
      todayBookings,
      monthRevenue,
      outstanding,
      customersCount,
      lowStockCount,
      recentInvoices,
      statusBreakdown,
      technicians,
      paymentsTrend,
      expensesTrend,
      monthExpenses,
      purchaseSpendMonth,
    ] = await Promise.all([
      prisma.repairOrder.count({
        where: {
          companyId,
          status: { in: ["CONFIRMED", "IN_PROGRESS", "QUALITY_CHECK"] },
        },
      }),
      prisma.repairOrder.count({ where: { companyId, status: "READY" } }),
      prisma.booking.count({
        where: {
          companyId,
          scheduledAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.payment.aggregate({
        where: {
          companyId,
          status: "SUCCESS",
          paidAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          status: { in: ["ISSUED", "PARTIALLY_PAID"] },
        },
        _sum: { amountDue: true },
      }),
      prisma.customer.count({ where: { companyId } }),
      prisma.part
        .findMany({
          where: { companyId, isActive: true },
          include: { stockItems: true },
        })
        .then((parts) =>
          parts.filter((p) => {
            const qty = p.stockItems.reduce((s, i) => s + i.quantity, 0);
            return qty <= p.reorderLevel;
          }).length
        ),
      prisma.invoice.findMany({
        where: { companyId },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.repairOrder.groupBy({
        by: ["status"],
        where: { companyId },
        _count: true,
      }),
      prisma.user.findMany({
        where: { companyId, role: Role.TECHNICIAN, isActive: true },
        include: {
          assignedOrders: {
            where: { status: { in: ["IN_PROGRESS", "QUALITY_CHECK"] } },
            select: { id: true },
          },
        },
      }),
      prisma.payment.findMany({
        where: {
          companyId,
          status: "SUCCESS",
          paidAt: { gte: trendStart },
        },
        select: { amount: true, paidAt: true },
      }),
      prisma.operatingExpense.findMany({
        where: {
          companyId,
          expenseDate: { gte: trendStart },
        },
        select: { amount: true, expenseDate: true, category: true },
      }),
      prisma.operatingExpense.findMany({
        where: {
          companyId,
          expenseDate: { gte: monthStart },
        },
        select: { amount: true, category: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: {
          companyId,
          status: { in: ["ORDERED", "PARTIAL", "RECEIVED"] },
          orderedAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const gstInvoices = await prisma.invoice.findMany({
      where: {
        companyId,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
        invoiceDate: { gte: monthStart },
      },
      select: {
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        taxableAmount: true,
        totalAmount: true,
      },
    });

    const gstSummary = gstInvoices.reduce(
      (acc, inv) => ({
        taxable: acc.taxable + Number(inv.taxableAmount),
        cgst: acc.cgst + Number(inv.cgstAmount),
        sgst: acc.sgst + Number(inv.sgstAmount),
        igst: acc.igst + Number(inv.igstAmount),
        total: acc.total + Number(inv.totalAmount),
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );

    const keys = lastNMonthKeys(6);
    const salesByMonth: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
    const expenseByMonth: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));

    for (const p of paymentsTrend) {
      if (!p.paidAt) continue;
      const k = monthKey(new Date(p.paidAt));
      if (k in salesByMonth) salesByMonth[k] += Number(p.amount);
    }
    for (const e of expensesTrend) {
      const k = monthKey(new Date(e.expenseDate));
      if (k in expenseByMonth) expenseByMonth[k] += Number(e.amount);
    }

    const salesTrend = keys.map((k) => ({
      month: monthLabel(k),
      key: k,
      sales: Math.round(salesByMonth[k]),
      expenses: Math.round(expenseByMonth[k]),
      net: Math.round(salesByMonth[k] - expenseByMonth[k]),
    }));

    const expenseCategoryMap: Record<string, number> = {};
    for (const e of monthExpenses) {
      expenseCategoryMap[e.category] =
        (expenseCategoryMap[e.category] || 0) + Number(e.amount);
    }
    const partsProcurement = Number(purchaseSpendMonth._sum.totalAmount || 0);
    if (partsProcurement > 0) {
      expenseCategoryMap.PARTS_PROCUREMENT =
        (expenseCategoryMap.PARTS_PROCUREMENT || 0) + partsProcurement;
    }

    const expenseBreakdown = Object.entries(expenseCategoryMap)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount),
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthOpex =
      monthExpenses.reduce((s, e) => s + Number(e.amount), 0) + partsProcurement;

    return ok({
      kpis: {
        openJobs,
        readyJobs,
        todayBookings,
        monthRevenue: Number(monthRevenue._sum.amount || 0),
        outstanding: Number(outstanding._sum.amountDue || 0),
        customersCount,
        lowStockCount,
        monthOpex: Math.round(monthOpex),
        monthNet: Math.round(Number(monthRevenue._sum.amount || 0) - monthOpex),
      },
      statusBreakdown,
      recentInvoices,
      technicians: technicians.map((t) => ({
        id: t.id,
        name: t.name,
        activeJobs: t.assignedOrders.length,
      })),
      gstSummary,
      salesTrend,
      expenseBreakdown,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

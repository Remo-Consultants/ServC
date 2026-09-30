import { NextRequest } from "next/server";
import { Role } from "@/lib/roles";
import { getAuthFromRequest, requireRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, handleApiError } from "@/lib/api";

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
          scheduledAt: {
            gte: dayStart,
            lt: dayEnd,
          },
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
      prisma.part.findMany({
        where: { companyId, isActive: true },
        include: { stockItems: true },
      }).then((parts) =>
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
    ]);

    // GST summary for current month
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

    return ok({
      kpis: {
        openJobs,
        readyJobs,
        todayBookings,
        monthRevenue: Number(monthRevenue._sum.amount || 0),
        outstanding: Number(outstanding._sum.amountDue || 0),
        customersCount,
        lowStockCount,
      },
      statusBreakdown,
      recentInvoices,
      technicians: technicians.map((t) => ({
        id: t.id,
        name: t.name,
        activeJobs: t.assignedOrders.length,
      })),
      gstSummary,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

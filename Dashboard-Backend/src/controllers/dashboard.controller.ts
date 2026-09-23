import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendError, sendPaginated } from "../utils/response";
import { parsePagination } from "../utils/pagination";

function parseDateRange(query: any) {
  const { from, to } = query;
  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from && typeof from === "string") where.date.gte = new Date(from);
    if (to && typeof to === "string") where.date.lte = new Date(to);
  }
  return where;
}

// ─── GET OVERVIEW ─────────────────────────────────────────
export const getOverview = async (req: AuthRequest, res: Response) => {
  try {
    const where = parseDateRange(req.query);
    
    // Determine the previous period
    const { from, to } = req.query as { from?: string; to?: string };
    const previousWhere: any = {};
    
    if (from || to) {
      const fromDate = from ? new Date(from) : new Date(0);
      const toDate = to ? new Date(to) : new Date();
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      
      const prevTo = new Date(fromDate.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - diffTime);
      
      previousWhere.date = { gte: prevFrom, lte: prevTo };
    }

    const expenseWhere = where.date ? { expenseDate: where.date } : {};
    const prevExpenseWhere = previousWhere.date ? { expenseDate: previousWhere.date } : {};

    const [credits, debits, prevCredits, prevDebits, fixed, operational, prevFixed, prevOperational] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...where, type: "CREDIT" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...where, type: "DEBIT" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...previousWhere, type: "CREDIT" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...previousWhere, type: "DEBIT" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...expenseWhere, category: { in: ["Salaries", "Professional Fees"] }, status: "PAID" } as any, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...expenseWhere, category: { in: ["Technology", "Utilities"] }, status: "PAID" } as any, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...prevExpenseWhere, category: { in: ["Salaries", "Professional Fees"] }, status: "PAID" } as any, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...prevExpenseWhere, category: { in: ["Technology", "Utilities"] }, status: "PAID" } as any, _sum: { amount: true } }),
    ]);

    const totalCredits = Number(credits?._sum?.amount || 0);
    const totalDebits = Number(debits?._sum?.amount || 0);
    const prevTotalCredits = Number(prevCredits?._sum?.amount || 0);
    const prevTotalDebits = Number(prevDebits?._sum?.amount || 0);

    const fixedCosts = Number(fixed?._sum?.amount || 0);
    const operationalCosts = Number(operational?._sum?.amount || 0);
    const prevFixedCosts = Number(prevFixed?._sum?.amount || 0);
    const prevOperationalCosts = Number(prevOperational?._sum?.amount || 0);
    
    const totalExpenditure = fixedCosts + operationalCosts;
    const prevTotalExpenditure = prevFixedCosts + prevOperationalCosts;

    const netProfit = totalCredits - totalDebits;
    const prevNetProfit = prevTotalCredits - prevTotalDebits;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
    };

    // Calculate percentage changes
    // If the user hasn't supplied custom dates, this strictly acts as "Compared to last month"
    const balanceChange = calculateChange(netProfit, prevNetProfit);
    const revenueChange = calculateChange(totalCredits, prevTotalCredits);
    const expenseChange = calculateChange(totalDebits, prevTotalDebits);
    const fixedCostsChange = calculateChange(fixedCosts, prevFixedCosts);
    const operationalCostsChange = calculateChange(operationalCosts, prevOperationalCosts);
    const expenditureChange = calculateChange(totalExpenditure, prevTotalExpenditure);
    const profitChange = balanceChange;

    return sendSuccess(res, {
      accountBalance: netProfit,
      balanceChange: balanceChange,
      totalRevenue: totalCredits,
      revenueChange: revenueChange,
      totalExpenses: totalDebits,
      expenseChange: expenseChange,
      fixedCosts,
      fixedCostsChange,
      operationalCosts,
      operationalCostsChange,
      totalExpenditure,
      expenditureChange,
      netProfit: netProfit,
      profitChange: profitChange,
    });
  } catch (error) {
    return sendError(res, "Failed to get overview");
  }
};

// ─── GET ACCOUNT BALANCE ─────────────────────────────────
export const getAccountBalance = async (req: AuthRequest, res: Response) => {
  try {
    const where = parseDateRange(req.query);

    const [credits, debits] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...where, type: "CREDIT" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...where, type: "DEBIT" }, _sum: { amount: true } }),
    ]);

    const balance = Number(credits._sum.amount || 0) - Number(debits._sum.amount || 0);
    return sendSuccess(res, { balance });
  } catch (error) {
    return sendError(res, "Failed to get account balance");
  }
};

// ─── GET FINANCIAL SUMMARY ───────────────────────────────
export const getSummary = async (req: AuthRequest, res: Response) => {
  // Can be an alias for overview or customized
  return getOverview(req, res);
};

// ─── GET CONTRIBUTIONS SUMMARY ───────────────────────────
export const getContributionsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.contributionDate = {};
      if (from && typeof from === "string") dateFilter.contributionDate.gte = new Date(from);
      if (to && typeof to === "string") dateFilter.contributionDate.lte = new Date(to);
    }

    const contributions = await prisma.contribution.groupBy({
      by: ["contributorName"],
      where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      _sum: { amount: true },
    });

    // Also fetch the color for each contributor
    const distinctContributors = await prisma.contribution.findMany({
      select: { contributorName: true, color: true },
      where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      distinct: ["contributorName"],
    });

    const colors = ["#ef4444", "#3b82f6"]; // Red and Blue
    const formatted = contributions.map((c, index) => {
      const dbCont = distinctContributors.find(d => d.contributorName === c.contributorName);
      return {
        contributorName: c.contributorName,
        totalAmount: Number(c._sum.amount || 0),
        color: dbCont?.color || colors[index % colors.length],
      };
    });

    return sendSuccess(res, formatted);
  } catch (error) {
    return sendError(res, "Failed to get contributions summary");
  }
};

// ─── GET STATS CARDS ─────────────────────────────────────
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const [clientCount, invoiceCount, pendingInvoiceCount, expenseCount] = await Promise.all([
      prisma.client.count({ where: { isActive: true } }),
      prisma.invoice.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.invoice.count({ where: { status: "PENDING" } }),
      prisma.expense.count({ where: { status: { not: "REJECTED" } } }),
    ]);

    return sendSuccess(res, {
      clients: clientCount,
      invoices: invoiceCount,
      pendingDues: pendingInvoiceCount,
      expenses: expenseCount,
    });
  } catch (error) {
    return sendError(res, "Failed to get stats");
  }
};

// ─── GET CHART DATA ──────────────────────────────────────
export const getChartData = async (req: AuthRequest, res: Response) => {
  try {
    // A simplistic implementation: just return all filtered transactions for the frontend to group,
    // OR we can group them here. For a dynamic dashboard over large data, we use raw SQL or group it here.
    const where = parseDateRange(req.query);
    const expenseWhere = where.date ? { expenseDate: where.date } : {};
    
    const [transactions, expenses] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: { type: true, amount: true, date: true },
        orderBy: { date: "asc" }
      }),
      prisma.expense.findMany({
        where: { 
          ...expenseWhere, 
          status: "PAID",
          category: { in: ["Salaries", "Professional Fees", "Technology", "Utilities"] }
        },
        select: { amount: true, category: true, expenseDate: true },
        orderBy: { expenseDate: "asc" }
      })
    ]);

    const dataByDate: Record<string, { date: string; revenue: number; expenses: number }> = {};

    transactions.forEach(t => {
      const d = t.date.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dataByDate[d]) {
        dataByDate[d] = { date: d, revenue: 0, expenses: 0 };
      }
      if (t.type === "CREDIT") dataByDate[d].revenue += Number(t.amount);
      if (t.type === "DEBIT") dataByDate[d].expenses += Number(t.amount);
    });

    // Bar chart of expenses by date
    const barChartData: Record<string, { date: string; expenses: number }> = {};
    expenses.forEach(e => {
      const d = e.expenseDate.toISOString().slice(0, 10);
      if (!barChartData[d]) barChartData[d] = { date: d, expenses: 0 };
      barChartData[d].expenses += Number(e.amount);
    });

    // Pie chart for categories distribution
    const pieDataMap: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category ? e.category.toLowerCase() : "other";
      pieDataMap[cat] = (pieDataMap[cat] || 0) + Number(e.amount);
    });
    
    // Calculate total for percentages
    const pieTotal = Object.values(pieDataMap).reduce((sum, val) => sum + val, 0);
    const pieChart = Object.keys(pieDataMap).map(k => ({ 
      name: k, 
      value: pieDataMap[k],
      percentage: pieTotal > 0 ? Number(((pieDataMap[k] / pieTotal) * 100).toFixed(1)) : 0
    }));

    return sendSuccess(res, {
      transactionsData: Object.values(dataByDate),
      barChartData: Object.values(barChartData),
      pieChartData: pieChart
    });
  } catch (error) {
    return sendError(res, "Failed to get chart data");
  }
};

// ─── GET PENDING INVOICES (Table) ────────────────────────
export const getPendingInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, pageSize } = parsePagination(req.query);
    
    // Anything not PAID or CANCELLED
    const where: any = { status: { in: ["PENDING", "PARTIAL", "OVERDUE", "DRAFT"] } };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { dueDate: "asc" },
        skip,
        take,
        include: {
          clients: { include: { client: { select: { publicId: true, name: true } } } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return sendPaginated(res, invoices, total, page, pageSize);
  } catch (error) {
    return sendError(res, "Failed to fetch pending invoices");
  }
};

// ─── GET RECENT TRANSACTIONS (Table) ─────────────────────
export const getRecentTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, pageSize } = parsePagination(req.query);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        skip,
        take,
        include: {
          invoice: { select: { publicId: true, invoiceNumber: true } },
          expense: { select: { publicId: true, title: true } },
          contribution: { select: { publicId: true, contributorName: true } },
          createdBy: {
            select: {
              publicId: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count(),
    ]);

    return sendPaginated(res, transactions, total, page, pageSize);
  } catch (error) {
    return sendError(res, "Failed to fetch recent transactions");
  }
};

import { Response } from "express";
import { InvoiceStatus } from "@prisma/client";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError, sendMessage } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";

// ─── HELPERS ─────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${rand}`;
}

interface ItemInput {
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  discount?: number;
}

function computeItemTotal(item: ItemInput) {
  const qty = item.quantity || 1;
  const price = item.unitPrice || 0;
  const discount = item.discount || 0;
  const taxPercent = item.taxPercent || 0;

  const lineTotal = qty * price - discount;
  const taxAmount = lineTotal * (taxPercent / 100);
  const total = lineTotal + taxAmount;

  return { lineTotal, taxAmount, total };
}

// ─── CREATE INVOICE ──────────────────────────────────────
export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, featureProject, description, currency,
      issuedDate, dueDate, items, clientPublicId,
    } = req.body;

    // Compute totals from items
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const processedItems = (items as ItemInput[]).map((item) => {
      const { taxAmount, total } = computeItemTotal(item);
      subtotal += item.quantity * item.unitPrice;
      totalTax += taxAmount;
      totalDiscount += item.discount || 0;
      return {
        itemName: item.itemName,
        description: item.description || null,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        taxPercent: item.taxPercent || 0,
        discount: item.discount || 0,
        total,
      };
    });

    const totalAmount = subtotal + totalTax - totalDiscount;
    const invoiceNumber = generateInvoiceNumber();

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          title: title || null,
          featureProject: featureProject || null,
          description: description || null,
          subtotal,
          taxAmount: totalTax,
          discountAmount: totalDiscount,
          totalAmount,
          receivedAmount: 0,
          balanceDue: totalAmount,
          currency: currency || "INR",
          issuedDate: new Date(issuedDate),
          dueDate: new Date(dueDate),
          createdByPublicId: req.publicId,
          items: { create: processedItems },
        },
        include: { items: true },
      });

      // Link single client if provided
      if (clientPublicId) {
        const client = await tx.client.findUnique({
          where: { publicId: clientPublicId },
        });
        if (client) {
          await tx.clientInvoice.create({
            data: { clientId: client.id, invoiceId: inv.id },
          });
        }
      }

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "CREATE",
          entityType: "INVOICE",
          entityId: inv.publicId,
        },
      });

      return inv;
    });

    const full = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { items: true, clients: { include: { client: true } } },
    });

    return sendCreated(res, full, "Invoice created successfully");
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);
    return sendError(res, "Failed to create invoice");
  }
};

// ─── GET ALL INVOICES (paginated) ────────────────────────
export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(
      req.query,
      ["createdAt", "dueDate", "issuedDate", "totalAmount", "invoiceNumber"],
    );

    const where: any = {};
    if (status && typeof status === "string") where.status = status;
    if (search && typeof search === "string") {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { title: { contains: search } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          clients: { include: { client: { select: { publicId: true, name: true } } } },
          _count: { select: { items: true, payments: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return sendPaginated(res, invoices, total, page, pageSize);
  } catch (error) {
    console.error("GET INVOICES ERROR:", error);
    return sendError(res, "Failed to fetch invoices");
  }
};

// ─── GET INVOICE BY ID ───────────────────────────────────
export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { publicId },
      include: {
        items: true,
        clients: { include: { client: true } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    if (!invoice) return sendError(res, "Invoice not found", 404);
    return sendSuccess(res, invoice);
  } catch (error) {
    console.error("GET INVOICE ERROR:", error);
    return sendError(res, "Failed to fetch invoice");
  }
};

// ─── UPDATE INVOICE ──────────────────────────────────────
export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const {
      title, featureProject, description, currency,
      issuedDate, dueDate, status, items, clientPublicId,
    } = req.body;

    const existing = await prisma.invoice.findUnique({
      where: { publicId },
      include: { items: true },
    });
    if (!existing) return sendError(res, "Invoice not found", 404);

    const updated = await prisma.$transaction(async (tx) => {
      let updateData: any = {
        title, featureProject, description, currency, status,
      };

      if (issuedDate) updateData.issuedDate = new Date(issuedDate);
      if (dueDate) updateData.dueDate = new Date(dueDate);

      // Recalculate if items provided
      if (items && Array.isArray(items) && items.length > 0) {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        const processedItems = (items as ItemInput[]).map((item) => {
          const { taxAmount, total } = computeItemTotal(item);
          subtotal += item.quantity * item.unitPrice;
          totalTax += taxAmount;
          totalDiscount += item.discount || 0;
          return {
            itemName: item.itemName,
            description: item.description || null,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            taxPercent: item.taxPercent || 0,
            discount: item.discount || 0,
            total,
          };
        });

        const totalAmount = subtotal + totalTax - totalDiscount;
        const receivedAmount = Number(existing.receivedAmount);
        const balanceDue = totalAmount - receivedAmount;

        updateData = {
          ...updateData,
          subtotal, taxAmount: totalTax, discountAmount: totalDiscount,
          totalAmount, balanceDue,
        };

        await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        await tx.invoiceItem.createMany({
          data: processedItems.map((item) => ({ ...item, invoiceId: existing.id })),
        });
      }

      // Update single client link
      if (clientPublicId !== undefined) {
        await tx.clientInvoice.deleteMany({ where: { invoiceId: existing.id } });
        if (clientPublicId) {
          const client = await tx.client.findUnique({ where: { publicId: clientPublicId } });
          if (client) {
            await tx.clientInvoice.create({
              data: { clientId: client.id, invoiceId: existing.id },
            });
          }
        }
      }

      const inv = await tx.invoice.update({
        where: { publicId },
        data: updateData,
        include: { items: true, clients: { include: { client: true } } },
      });

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "UPDATE",
          entityType: "INVOICE",
          entityId: publicId,
        },
      });

      return inv;
    });

    return sendSuccess(res, updated, "Invoice updated successfully");
  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);
    return sendError(res, "Failed to update invoice");
  }
};

// ─── DELETE INVOICE (soft-delete → CANCELLED) ────────────
export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const existing = await prisma.invoice.findUnique({ where: { publicId } });
    if (!existing) return sendError(res, "Invoice not found", 404);

    if (existing.status === "PAID") {
      return sendError(res, "Cannot delete a paid invoice", 400);
    }

    await prisma.invoice.update({
      where: { publicId },
      data: { status: "CANCELLED" },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "DELETE",
        entityType: "INVOICE",
        entityId: publicId,
      },
    });

    return sendMessage(res, "Invoice cancelled successfully");
  } catch (error) {
    console.error("DELETE INVOICE ERROR:", error);
    return sendError(res, "Failed to delete invoice");
  }
};

// ─── RECORD PAYMENT (with validation) ────────────────────
export const recordPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const { amount, paymentMethod, referenceNo, notes, paidAt } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { publicId } });
    if (!invoice) return sendError(res, "Invoice not found", 404);

    // Validate invoice status
    if (invoice.status === "CANCELLED") {
      return sendError(res, "Cannot record payment on a cancelled invoice", 400);
    }
    if (invoice.status === "PAID") {
      return sendError(res, "Invoice is already fully paid", 400);
    }

    const paymentAmount = Number(amount);
    const balanceDue = Number(invoice.balanceDue);

    // Validate payment amount
    if (paymentAmount > balanceDue) {
      return sendError(
        res,
        `Payment amount (${paymentAmount}) exceeds balance due (${balanceDue})`,
        400
      );
    }

    const currentReceived = Number(invoice.receivedAmount);
    const total = Number(invoice.totalAmount);
    const newReceived = currentReceived + paymentAmount;
    const newBalance = total - newReceived;

    let newStatus: InvoiceStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = "PAID";
    } else if (newReceived > 0) {
      newStatus = "PARTIAL";
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentMethod,
          referenceNo: referenceNo || null,
          notes: notes || null,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      });

      await tx.invoice.update({
        where: { publicId },
        data: {
          receivedAmount: newReceived,
          balanceDue: newBalance < 0 ? 0 : newBalance,
          status: newStatus,
          paidAt: newStatus === "PAID" ? new Date() : undefined,
        },
      });

      // Transaction ledger entry
      await tx.transaction.create({
        data: {
          type: "CREDIT",
          category: "INVOICE_PAYMENT",
          amount: paymentAmount,
          currency: invoice.currency,
          date: paidAt ? new Date(paidAt) : new Date(),
          description: `Payment for invoice ${invoice.invoiceNumber}`,
          referenceNo: referenceNo || null,
          invoiceId: invoice.id,
          invoicePaymentId: payment.id,
          createdByPublicId: req.publicId,
        },
      });

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "MARK_PAID",
          entityType: "INVOICE_PAYMENT",
          entityId: payment.publicId,
        },
      });

      return payment;
    });

    return sendCreated(res, result, "Payment recorded successfully");
  } catch (error) {
    console.error("RECORD PAYMENT ERROR:", error);
    return sendError(res, "Failed to record payment");
  }
};

// ─── GET INVOICE PAYMENTS ────────────────────────────────
export const getInvoicePayments = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const invoice = await prisma.invoice.findUnique({ where: { publicId } });
    if (!invoice) return sendError(res, "Invoice not found", 404);

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId: invoice.id },
      orderBy: { paidAt: "desc" },
    });

    return sendSuccess(res, payments);
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);
    return sendError(res, "Failed to fetch payments");
  }
};

import { z } from "zod";

const invoiceItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be >= 0"),
  taxPercent: z.number().min(0).max(100).optional().default(0),
  discount: z.number().min(0, "Discount must be >= 0").optional().default(0),
});

export const createInvoiceSchema = z
  .object({
    title: z.string().optional(),
    featureProject: z.string().optional(),
    description: z.string().optional(),
    currency: z.string().optional().default("INR"),
    issuedDate: z.string().min(1, "Issued date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    clientPublicId: z.string().optional(),
    items: z
      .array(invoiceItemSchema)
      .min(1, "At least one invoice item is required"),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.issuedDate), {
    message: "Due date must be on or after issued date",
    path: ["dueDate"],
  });

export const updateInvoiceSchema = z.object({
  title: z.string().optional(),
  featureProject: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  issuedDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z
    .enum(["DRAFT", "PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"])
    .optional(),
  clientPublicId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
});

const validPaymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "UPI",
  "WALLET",
  "CHEQUE",
  "OTHER",
] as const;

export const recordPaymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(validPaymentMethods),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

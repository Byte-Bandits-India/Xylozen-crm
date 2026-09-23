import { z } from "zod";

export const createExpenseSchema = z.object({
  expenseType: z.enum(["FIXED", "OPERATIONAL"]),
  title: z.string().min(1, "Title is required"),
  category: z.enum(["salaries", "professional", "technology", "utilities"]),
  description: z.string().optional(),
  comments: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  expenseDate: z.string().min(1, "Expense date is required"),
  dueDate: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]).optional().default("PENDING"),
  recurring: z.boolean().optional().default(false),
  frequency: z.enum(["monthly", "yearly"]).optional(),
  vendorName: z.string().optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "UPI"]).optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  paidByPublicId: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

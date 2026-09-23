import { z } from 'zod'
import dayjs from 'dayjs'

export const expenseSchema = z.object({
  title: z.string().min(1, 'Expense name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  date: z.custom<dayjs.Dayjs>((val) => dayjs.isDayjs(val), 'Invalid date'),
  dueDate: z.custom<dayjs.Dayjs>((val) => val === undefined || dayjs.isDayjs(val), 'Invalid date').optional(),
  status: z.enum(['pending', 'paid']).optional(),
  recurring: z.boolean().optional(),
  frequency: z.enum(['monthly', 'yearly']).optional(),
  vendor: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank', 'upi']).optional(),
  description: z.string().optional(),
  paidBy: z.string().optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

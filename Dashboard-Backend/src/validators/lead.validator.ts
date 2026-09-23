import { z } from "zod";

export const createLeadSchema = z.object({
  companyName: z.string().optional().default(""),
  industry: z.string().optional().default("Technology"),
  email: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  clientName: z.string().optional().default(""),
  service: z.string().optional().default("Web Development"),
  description: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["enquired", "converted", "not-converted"]).optional().default("enquired"),
  assignedUserId: z.string().optional().nullable().or(z.literal("")),
});

export const updateLeadSchema = createLeadSchema.partial();

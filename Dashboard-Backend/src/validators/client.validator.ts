import { z } from "zod";

export const createClientSchema = z.object({
  clientType: z.enum(["individual", "company"]).optional(),
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email").nullish().or(z.literal("")),
  phone: z.string().nullish(),
  whatsapp: z.string().nullish(),
  companyName: z.string().nullish(),
  avatar: z.string().nullish(),
  status: z.string().nullish(),
  billingAddressLine1: z.string().nullish(),
  billingAddressLine2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  postalCode: z.string().nullish(),
  timezone: z.string().nullish(),
  source: z.string().nullish(),
  sourceDetails: z.record(z.string(), z.string()).nullish(),
  industry: z.string().nullish(),
  website: z.string().nullish(),
  taxId: z.string().nullish(),
  currency: z.string().nullish(),
  preferredChannels: z.array(z.string()).nullish(),
  language: z.string().nullish(),
  notes: z.string().nullish(),
});

export const updateClientSchema = createClientSchema.partial();

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  companyName: z.string().nullish(),
  logoUrl: z.string().nullish(),
  status: z.enum(["backlog", "in_progress", "paused", "done"]).optional(),
  summaryTitle: z.string().nullish(),
  summaryText: z.string().nullish(),
  memberIds: z.array(z.string()).optional(),
  startDate: z.string().nullish(),
  progress: z.number().int().min(0).max(100).optional(),
  payment: z.number().min(0).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

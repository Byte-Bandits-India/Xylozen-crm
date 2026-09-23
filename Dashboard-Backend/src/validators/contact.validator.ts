import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  message: z.string().min(1, "Message is required"),
  consent: z.boolean().optional(),
  source: z.string().min(1, "Source is required"),
});

export const updateContactSchema = createContactSchema.partial();

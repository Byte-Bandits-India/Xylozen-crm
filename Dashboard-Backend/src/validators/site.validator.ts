import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  userName: z.string().min(1, "User name is required"),
  url: z.string().min(1, "URL is required").optional().or(z.literal("")),
  password: z.string().min(1, "Password is required"),
});

export const updateSiteSchema = createSiteSchema.partial();

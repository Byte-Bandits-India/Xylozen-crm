import { z } from "zod";

export const createContributionSchema = z.object({
  contributorName: z.string().min(1, "Contributor name is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  contributionDate: z.string().min(1, "Contribution date is required"),
  notes: z.string().optional(),
  color: z.string().optional(),
});

export const updateContributionSchema = createContributionSchema.partial();

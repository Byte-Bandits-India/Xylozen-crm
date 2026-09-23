import { z } from "zod";

const affiliationEnum = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum(["internal", "external"]).optional().default("internal")
);

const phoneSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val === "" || /^\d{10}$/.test(val), {
    message: "Phone number must be exactly 10 digits",
  })
  .optional();

const passwordSchema = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val === "" || val.length >= 6, {
    message: "Password must be at least 6 characters",
  })
  .optional();

export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: phoneSchema,
  username: z.string().min(3, "Username must be at least 3 characters").optional().or(z.literal("")),
  password: passwordSchema,
  role: z.enum(["ADMIN", "MANAGER", "INTERNAL_USER", "EXTERNAL_USER", "SUPER_ADMIN", "USER"]),
  functionalRole: z.string().optional().nullable(),
  affiliation: affiliationEnum,
  managerPublicId: z.string().optional().nullable(),
  accessiblePages: z.array(z.string()).optional().nullable(),
}).refine(
  (data) => data.email || data.phone || data.username,
  { message: "At least one of email, phone, or username is required" }
);

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "INTERNAL_USER", "EXTERNAL_USER", "SUPER_ADMIN", "USER"]),
});

export const updateUserDetailsSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val === "" || /^\d{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits",
    })
    .optional()
    .nullable(),
  functionalRole: z.string().optional().nullable(),
  affiliation: z.preprocess(
    (val) => (typeof val === "string" ? val.toLowerCase() : val),
    z.enum(["internal", "external"]).optional()
  ),
  managerPublicId: z.string().optional().nullable(),
  accessiblePages: z.array(z.string()).optional().nullable(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "LOCKED"]).optional(),
});

export const createFunctionalRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});

import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
});

export const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6).max(6),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const sendLoginOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyLoginOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6).max(6),
  remember: z.boolean().optional(),
});

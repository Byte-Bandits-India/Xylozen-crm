import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import { generateOTP, hashToken } from "../utils/otp";
import { sendOTPEmail } from "../utils/mailer";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import crypto from "crypto";
import { AuthRequest } from "../middlewares/auth.middleware";
import axios from "axios";

// ─── Helper: fetch user role from DB ───────────────────────────────────
async function getUserRole(publicId: string): Promise<string | null> {
  const accountRole = await prisma.accountRole.findFirst({
    where: { accountPublicId: publicId },
    include: { role: true },
  });
  return accountRole?.role.name ?? null;
}

// ─── LOGIN ─────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, remember } = req.body;
    const identifier = email || phone;

    if (!identifier) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    const account = await prisma.account.findFirst({
      where: {
        OR: [
          { email: identifier },
          { profile: { phone: identifier } }
        ]
      },
      include: { credential: true },
    });

    if (!account) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!account.credential) {
      return res.status(400).json({ message: "This account uses Google Sign-In or does not have a password set." });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account not active" });
    }

    const valid = await bcrypt.compare(
      password,
      account.credential.passwordHash
    );

    if (!valid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(account.publicId);
    const refreshToken = generateRefreshToken(account.publicId);

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (remember ? 7 : 1));

    await prisma.session.create({
      data: {
        accountPublicId: account.publicId,
        refreshTokenHash: refreshHash,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        deviceName: req.headers["sec-ch-ua"]?.toString() || "Unknown Device",
        expiresAt,
      },
    });

    await prisma.authAuditLog.create({
      data: {
        accountPublicId: account.publicId,
        action: "LOGIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
      },
    });

    const role = await getUserRole(account.publicId);

    return res.json({
      accessToken,
      refreshToken,
      role,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Internal server error during login. Please try again." });
  }
};

// ─── VERIFY EMAIL ──────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const account = await prisma.account.findUnique({ where: { email } });

  if (!account) return res.status(400).json({ message: "Invalid email" });

  const hashedOtp = hashToken(otp);

  const record = await prisma.emailVerification.findFirst({
    where: {
      accountPublicId: account.publicId,
      tokenHash: hashedOtp,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  await prisma.account.update({
    where: { publicId: account.publicId },
    data: {
      isEmailVerified: true,
      status: "ACTIVE",
    },
  });
  await prisma.authAuditLog.create({
    data: {
      accountPublicId: account.publicId,
      action: "UPDATE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] as string,
    },
  });

  res.json({ message: "Account verified successfully" });
};

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const account = await prisma.account.findUnique({ where: { email } });

  if (!account) {
    return res.status(400).json({ message: "Enter correct email address" });
  }

  const otp = generateOTP();
  const hashed = hashToken(otp);

  await prisma.emailVerification.create({
    data: {
      accountPublicId: account.publicId,
      email,
      tokenHash: hashed,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendOTPEmail(email, otp);

  res.json({ message: "OTP sent" });
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const account = await prisma.account.findUnique({ where: { email } });
  if (!account) return res.status(400).json({ message: "Invalid email" });

  const hashedOtp = hashToken(otp);

  const record = await prisma.emailVerification.findFirst({
    where: {
      accountPublicId: account.publicId,
      tokenHash: hashedOtp,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  await prisma.authAuditLog.create({
    data: {
      accountPublicId: account.publicId,
      action: "PASSWORD_CHANGE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] as string,
    },
  });

  if (!record)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  const newHashed = await bcrypt.hash(newPassword, 10);

  await prisma.credential.update({
    where: { accountPublicId: account.publicId },
    data: {
      passwordHash: newHashed,
      passwordChangedAt: new Date(),
    },
  });

  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  res.json({ message: "Password updated successfully" });
};

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const hashed = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: hashed,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const accessToken = generateAccessToken(session.accountPublicId);

  res.json({ accessToken });
};

// ─── LOGOUT ────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const hashed = crypto.createHash("sha256").update(refreshToken).digest("hex");

      const session = await prisma.session.findFirst({
        where: { refreshTokenHash: hashed },
      });

      if (session) {
        await prisma.session.updateMany({
          where: { refreshTokenHash: hashed },
          data: { revokedAt: new Date() },
        });

        await prisma.authAuditLog.create({
          data: {
            accountPublicId: session.accountPublicId,
            action: "LOGOUT",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string,
          },
        });
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.json({ message: "Logged out successfully" });
  }
};

// ─── GOOGLE AUTH (LOGIN ONLY — NO SIGNUP) ──────────────────────────────
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    const googleRes = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    const { email, sub } = googleRes.data;

    // Only allow login for existing accounts
    const account = await prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return res.status(403).json({
        message: "Account not found. Contact your administrator to create an account.",
      });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account not active" });
    }

    // Link Google provider if not already linked
    const existingProvider = await prisma.authProvider.findFirst({
      where: {
        accountPublicId: account.publicId,
        provider: "GOOGLE",
      },
    });

    if (!existingProvider) {
      await prisma.authProvider.create({
        data: {
          accountPublicId: account.publicId,
          provider: "GOOGLE",
          providerUserId: sub,
        },
      });
    }

    const accessToken = generateAccessToken(account.publicId);
    const refreshToken = generateRefreshToken(account.publicId);

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        accountPublicId: account.publicId,
        refreshTokenHash: refreshHash,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
        deviceName: req.headers["sec-ch-ua"]?.toString() || "Unknown Device",
        expiresAt,
      },
    });

    const role = await getUserRole(account.publicId);

    await prisma.authAuditLog.create({
      data: {
        accountPublicId: account.publicId,
        action: "LOGIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
      },
    });

    res.json({ accessToken, refreshToken, role });
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// ─── GET ME (with roles & permissions) ─────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const account = await prisma.account.findUnique({
      where: { publicId: req.publicId },
      include: {
        profile: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedAccount = {
      id: account.id.toString(),
      publicId: account.publicId,
      email: account.email,
      username: account.username,
      status: account.status,
      isEmailVerified: account.isEmailVerified,
      lastLoginAt: account.lastLoginAt,
      createdAt: account.createdAt,
      profile: account.profile
        ? {
            ...account.profile,
            id: account.profile.id.toString(),
          }
        : null,
      roles: account.roles.map((r) => r.role.name),
      permissions: Array.from(
        new Set(
          account.roles.flatMap((r) =>
            r.role.permissions.map((p) => p.permission.code)
          )
        )
      ),
    };

    return res.json(formattedAccount);
  } catch (error) {
    console.error("GET_ME ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch user details" });
  }
};

// ─── SEND LOGIN OTP ────────────────────────────────────────────────────
export const sendLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const account = await prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account not active" });
    }

    const otp = generateOTP();

    await prisma.emailVerification.create({
      data: {
        accountPublicId: account.publicId,
        email,
        tokenHash: hashToken(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOTPEmail(email, otp);

    return res.json({ message: "OTP sent" });
  } catch (error) {
    console.error("SEND LOGIN OTP ERROR:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── VERIFY LOGIN OTP ──────────────────────────────────────────────────
export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp, remember } = req.body;

    const account = await prisma.account.findUnique({ where: { email } });
    if (!account) return res.status(400).json({ message: "Invalid email" });

    const record = await prisma.emailVerification.findFirst({
      where: {
        accountPublicId: account.publicId,
        tokenHash: hashToken(otp),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const accessToken = generateAccessToken(account.publicId);
    const refreshToken = generateRefreshToken(account.publicId);

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (remember ? 7 : 1));

    await prisma.session.create({
      data: {
        accountPublicId: account.publicId,
        refreshTokenHash: refreshHash,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        deviceName: "OTP Login",
        expiresAt,
      },
    });

    await prisma.authAuditLog.create({
      data: {
        accountPublicId: account.publicId,
        action: "LOGIN",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
      },
    });

    const role = await getUserRole(account.publicId);

    return res.json({ accessToken, refreshToken, role });
  } catch (error) {
    console.error("VERIFY LOGIN OTP ERROR:", error);
    return res.status(500).json({ message: "Failed to verify login OTP" });
  }
};
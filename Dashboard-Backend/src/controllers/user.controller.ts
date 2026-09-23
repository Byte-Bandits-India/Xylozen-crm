import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendError, sendMessage } from "../utils/response";

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.account.findUnique({
      where: { publicId: req.publicId },
      include: {
        profile: true,
        manager: {
          include: { profile: true },
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        providers: {
          select: { provider: true }
        }
      }
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const managerName = user.manager
      ? (user.manager.profile
          ? `${user.manager.profile.firstName} ${user.manager.profile.lastName}`.trim()
          : user.manager.username)
      : null;

    // Format the response to extract role names, accessible pages, and manager info
    const formattedUser = {
      id: user.id.toString(),
      publicId: user.publicId,
      email: user.email,
      username: user.username,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      managerPublicId: user.managerPublicId,
      managerName,
      accessiblePages: user.accessiblePages,
      profile: user.profile ? {
        ...user.profile,
        id: user.profile.id.toString(),
      } : null,
      roles: user.roles.map(r => r.role.name),
      permissions: Array.from(new Set(
        user.roles.flatMap(r => r.role.permissions.map(p => p.permission.code))
      )),
      providers: user.providers.map(p => p.provider)
    };

    return sendSuccess(res, formattedUser, "User profile retrieved successfully");
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return sendError(res, "Failed to get user profile");
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, gender, profileImage } =
      req.body;

    const profile = await prisma.userProfile.upsert({
      where: { accountPublicId: req.publicId },
      update: {
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        profileImage,
      },
      create: {
        accountPublicId: req.publicId!,
        firstName: firstName || "",
        lastName: lastName || "",
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        profileImage: profileImage || null,
      },
    });

    await prisma.activityAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "UPDATE",
        entityType: "USER",
        entityId: req.publicId!,
        newData: {
          ...profile,
          id: profile.id.toString(),
          dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
        },
      },
    });

    return sendSuccess(res, profile, "Profile updated successfully");
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return sendError(res, "Failed to update profile");
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.publicId) {
      return sendError(res, "Unauthorized", 401);
    }

    const account = await prisma.account.findUnique({
      where: { publicId: req.publicId },
    });

    const deletedSuffix = `_deleted_${Date.now()}`;
    await prisma.account.update({
      where: { publicId: req.publicId },
      data: {
        email: account ? `${account.email}${deletedSuffix}` : undefined,
        username: account ? `${account.username}${deletedSuffix}` : undefined,
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    await prisma.authAuditLog.create({
      data: {
        accountPublicId: req.publicId,
        action: "ACCOUNT_DELETED",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
      },
    });

    return sendMessage(res, "Account deleted successfully");
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);
    return sendError(res, "Failed to delete account");
  }
};

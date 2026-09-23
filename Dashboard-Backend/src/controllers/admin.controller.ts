import { Response } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendError, sendCreated, sendMessage, sendPaginated } from "../utils/response";
import { sendCredentialsEmail } from "../utils/mailer";
import { parsePagination } from "../utils/pagination";

/**
 * Create a new user account (Admin only)
 * Generates a random password and sends credentials via email
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      username,
      role,
      password,
      functionalRole,
      affiliation,
      managerPublicId,
      accessiblePages,
    } = req.body;

    // Determine normalized affiliation
    let userAffiliation = affiliation || "internal";
    if (role === "EXTERNAL_USER") userAffiliation = "external";
    if (role === "INTERNAL_USER") userAffiliation = "internal";

    // Check for existing account by email or username
    if (email) {
      const existingEmail = await prisma.account.findUnique({
        where: { email },
      });
      if (existingEmail) {
        if (existingEmail.status === "DELETED" || existingEmail.deletedAt !== null) {
          const deletedSuffix = `_deleted_${Date.now()}`;
          await prisma.account.update({
            where: { id: existingEmail.id },
            data: {
              email: `${existingEmail.email}${deletedSuffix}`,
              username: `${existingEmail.username}${deletedSuffix}`,
            },
          });
        } else {
          return sendError(res, "Email already exists", 400);
        }
      }
    }

    const accountUsername = username || email;
    if (!accountUsername) {
      return sendError(res, "Username or email is required", 400);
    }

    const existingUsername = await prisma.account.findUnique({
      where: { username: accountUsername },
    });
    if (existingUsername) {
      if (existingUsername.status === "DELETED" || existingUsername.deletedAt !== null) {
        const deletedSuffix = `_deleted_${Date.now()}`;
        await prisma.account.update({
          where: { id: existingUsername.id },
          data: {
            username: `${existingUsername.username}${deletedSuffix}`,
          },
        });
      } else {
        return sendError(res, "Username already exists", 400);
      }
    }

    // Use provided password or generate random password
    const rawPassword = password || crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const account = await prisma.$transaction(async (tx) => {
      const newAccount = await tx.account.create({
        data: {
          publicId: crypto.randomUUID(),
          email: email || `${accountUsername}@placeholder.local`,
          username: accountUsername,
          status: "ACTIVE",
          isEmailVerified: !!email,
          managerPublicId: managerPublicId || null,
          accessiblePages: accessiblePages && Array.isArray(accessiblePages) ? accessiblePages : undefined,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
          profile: {
            create: {
              firstName,
              lastName,
              phone: phone || null,
              functionalRole: functionalRole || null,
              affiliation: userAffiliation,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Assign the specified role
      const targetRole = await tx.role.findUnique({
        where: { name: role },
      });

      if (!targetRole) {
        throw new Error(`Role ${role} not found`);
      }

      await tx.accountRole.create({
        data: {
          accountPublicId: newAccount.publicId,
          roleId: targetRole.id,
        },
      });

      // Audit log
      await tx.authAuditLog.create({
        data: {
          accountPublicId: newAccount.publicId,
          action: "SIGNUP",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] as string,
        },
      });

      return newAccount;
    });

    // Send credentials via email if email is provided
    if (email) {
      await sendCredentialsEmail(email, accountUsername, rawPassword);
    }

    return sendCreated(
      res,
      {
        publicId: account.publicId,
        email: account.email,
        username: account.username,
        role,
        firstName,
        lastName,
        functionalRole: account.profile?.functionalRole || null,
        affiliation: userAffiliation,
        managerPublicId: account.managerPublicId || null,
        accessiblePages: account.accessiblePages || null,
        ...(email ? {} : { temporaryPassword: rawPassword }),
      },
      "User created successfully"
    );
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return sendError(res, "Failed to create user");
  }
};

/**
 * List all users with their roles, managers, and accessible pages (Admin only)
 */
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page, pageSize, skip } = parsePagination(req.query);

    const [users, total] = await Promise.all([
      prisma.account.findMany({
        where: { status: { not: "DELETED" } },
        include: {
          profile: true,
          manager: {
            include: { profile: true },
          },
          roles: {
            include: { role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.account.count({
        where: { status: { not: "DELETED" } },
      }),
    ]);

    const formatted = users.map((u) => {
      const managerName = u.manager
        ? (u.manager.profile
            ? `${u.manager.profile.firstName} ${u.manager.profile.lastName}`.trim()
            : u.manager.username)
        : null;

      return {
        publicId: u.publicId,
        email: u.email,
        username: u.username,
        status: u.status,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
        managerPublicId: u.managerPublicId,
        managerName,
        accessiblePages: u.accessiblePages,
        profile: u.profile
          ? {
              firstName: u.profile.firstName,
              lastName: u.profile.lastName,
              phone: u.profile.phone,
              profileImage: u.profile.profileImage,
              functionalRole: u.profile.functionalRole || null,
              affiliation: u.profile.affiliation || "internal",
            }
          : null,
        functionalRole: u.profile?.functionalRole || null,
        affiliation: u.profile?.affiliation || "internal",
        roles: u.roles.map((r) => r.role.name),
      };
    });

    return sendPaginated(res, formatted, total, page, pageSize);
  } catch (error) {
    console.error("LIST USERS ERROR:", error);
    return sendError(res, "Failed to list users");
  }
};

/**
 * Get user by publicId (Admin only)
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const user = await prisma.account.findUnique({
      where: { publicId },
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
                  include: { permission: true },
                },
              },
            },
          },
        },
        providers: { select: { provider: true } },
      },
    });

    if (!user || user.status === "DELETED") {
      return sendError(res, "User not found", 404);
    }

    const managerName = user.manager
      ? (user.manager.profile
          ? `${user.manager.profile.firstName} ${user.manager.profile.lastName}`.trim()
          : user.manager.username)
      : null;

    const formatted = {
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
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            profileImage: user.profile.profileImage,
            dateOfBirth: user.profile.dateOfBirth,
            gender: user.profile.gender,
            functionalRole: user.profile.functionalRole || null,
            affiliation: user.profile.affiliation || "internal",
          }
        : null,
      functionalRole: user.profile?.functionalRole || null,
      affiliation: user.profile?.affiliation || "internal",
      roles: user.roles.map((r) => r.role.name),
      permissions: Array.from(
        new Set(
          user.roles.flatMap((r) =>
            r.role.permissions.map((p) => p.permission.code)
          )
        )
      ),
      providers: user.providers.map((p) => p.provider),
    };

    return sendSuccess(res, formatted, "User retrieved successfully");
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);
    return sendError(res, "Failed to get user");
  }
};

/**
 * Update a user's role (Admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const { role: newRoleName } = req.body;

    const user = await prisma.account.findUnique({
      where: { publicId },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user || user.status === "DELETED") {
      return sendError(res, "User not found", 404);
    }

    // Prevent changing own role
    if (publicId === req.publicId) {
      return sendError(res, "Cannot change your own role", 400);
    }

    const newRole = await prisma.role.findUnique({
      where: { name: newRoleName },
    });

    if (!newRole) {
      return sendError(res, "Role not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      // Remove all current roles
      await tx.accountRole.deleteMany({
        where: { accountPublicId: publicId },
      });

      // Assign the new role
      await tx.accountRole.create({
        data: {
          accountPublicId: publicId,
          roleId: newRole.id,
        },
      });

      // Audit log
      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "UPDATE",
          entityType: "USER",
          entityId: publicId,
          oldData: { roles: user.roles.map((r) => r.role.name) },
          newData: { roles: [newRoleName] },
        },
      });
    });

    return sendSuccess(res, { publicId, role: newRoleName }, "Role updated successfully");
  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);
    return sendError(res, "Failed to update user role");
  }
};

/**
 * Soft-delete a user account (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const user = await prisma.account.findUnique({
      where: { publicId },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user || user.status === "DELETED") {
      return sendError(res, "User not found", 404);
    }

    // Prevent self-deletion via admin route
    if (publicId === req.publicId) {
      return sendError(res, "Cannot delete your own account", 400);
    }

    const deletedSuffix = `_deleted_${Date.now()}`;
    await prisma.account.update({
      where: { publicId },
      data: {
        email: `${user.email}${deletedSuffix}`,
        username: `${user.username}${deletedSuffix}`,
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    await prisma.authAuditLog.create({
      data: {
        accountPublicId: publicId,
        action: "ACCOUNT_DELETED",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string,
      },
    });

    return sendMessage(res, "User deleted successfully");
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return sendError(res, "Failed to delete user");
  }
};

/**
 * Update user details (functionalRole, affiliation, managerPublicId, accessiblePages, profile fields) (Admin only)
 */
export const updateUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    const {
      firstName,
      lastName,
      phone,
      functionalRole,
      affiliation,
      managerPublicId,
      accessiblePages,
      status,
    } = req.body;

    const existing = await prisma.account.findUnique({
      where: { publicId },
      include: { profile: true },
    });

    if (!existing || existing.status === "DELETED") {
      return sendError(res, "User not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      const accountUpdates: any = {};
      if (status !== undefined) accountUpdates.status = status;
      if (managerPublicId !== undefined) accountUpdates.managerPublicId = managerPublicId || null;
      if (accessiblePages !== undefined) accountUpdates.accessiblePages = accessiblePages && Array.isArray(accessiblePages) ? accessiblePages : null;

      if (Object.keys(accountUpdates).length > 0) {
        await tx.account.update({
          where: { publicId },
          data: accountUpdates,
        });
      }

      if (existing.profile) {
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (functionalRole !== undefined) updateData.functionalRole = functionalRole;
        if (affiliation !== undefined) updateData.affiliation = affiliation;

        if (Object.keys(updateData).length > 0) {
          await tx.userProfile.update({
            where: { accountPublicId: publicId },
            data: updateData,
          });
        }
      } else if (firstName || lastName || functionalRole || affiliation) {
        await tx.userProfile.create({
          data: {
            accountPublicId: publicId,
            firstName: firstName || "",
            lastName: lastName || "",
            phone: phone || null,
            functionalRole: functionalRole || null,
            affiliation: affiliation || "internal",
          },
        });
      }

      await tx.activityAuditLog.create({
        data: {
          accountPublicId: req.publicId,
          action: "UPDATE",
          entityType: "USER",
          entityId: publicId,
          newData: {
            firstName,
            lastName,
            functionalRole,
            affiliation,
            managerPublicId,
            accessiblePages,
            status,
          },
        },
      });
    });

    const updated = await prisma.account.findUnique({
      where: { publicId },
      include: {
        profile: true,
        manager: { include: { profile: true } },
        roles: { include: { role: true } },
      },
    });

    const managerName = updated?.manager
      ? (updated.manager.profile
          ? `${updated.manager.profile.firstName} ${updated.manager.profile.lastName}`.trim()
          : updated.manager.username)
      : null;

    return sendSuccess(
      res,
      {
        publicId: updated!.publicId,
        email: updated!.email,
        username: updated!.username,
        status: updated!.status,
        functionalRole: updated!.profile?.functionalRole || null,
        affiliation: updated!.profile?.affiliation || "internal",
        managerPublicId: updated!.managerPublicId,
        managerName,
        accessiblePages: updated!.accessiblePages,
        profile: updated!.profile,
        roles: updated!.roles.map((r) => r.role.name),
      },
      "User updated successfully"
    );
  } catch (error) {
    console.error("UPDATE USER DETAILS ERROR:", error);
    return sendError(res, "Failed to update user details");
  }
};

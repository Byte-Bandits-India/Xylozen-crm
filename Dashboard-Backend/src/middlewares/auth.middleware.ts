import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";

export interface AuthRequest extends Request {
  publicId?: string;
  email?: string;
  affiliation?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    if (!decoded.publicId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const account = await prisma.account.findUnique({
      where: { publicId: decoded.publicId },
      include: {
        profile: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!account || account.status !== "ACTIVE") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.publicId = account.publicId;
    req.email = account.email;
    req.affiliation = account.profile?.affiliation || "internal";
    req.roles = account.roles.map((r) => r.role.name);
    req.role = req.roles[0]; // Primary role (backward compat)
    req.permissions = Array.from(
      new Set(
        account.roles.flatMap((r) =>
          r.role.permissions.map((p) => p.permission.code)
        )
      )
    );

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Role-based authorization middleware.
 * Checks if the user has at least one of the allowed roles.
 * Supports role hierarchy: SUPER_ADMIN > ADMIN > USER
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRoles = req.roles || (req.role ? [req.role] : []);

    // SUPER_ADMIN implicitly has access to everything
    if (userRoles.includes("SUPER_ADMIN") || userRoles.includes("ADMIN")) {
      return next();
    }

    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

/**
 * Optional authentication middleware:
 * Populates req.publicId, roles, permissions if token exists and valid,
 * but allows request to proceed if no token is present.
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded && decoded.publicId) {
      const account = await prisma.account.findUnique({
        where: { publicId: decoded.publicId },
        include: {
          profile: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (account && account.status === "ACTIVE") {
        req.publicId = account.publicId;
        req.email = account.email;
        req.affiliation = account.profile?.affiliation || "internal";
        req.roles = account.roles.map((r) => r.role.name);
        req.role = req.roles[0];
        req.permissions = Array.from(
          new Set(
            account.roles.flatMap((r) =>
              r.role.permissions.map((p) => p.permission.code)
            )
          )
        );
      }
    }
    next();
  } catch (err) {
    next();
  }
};

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
  accessiblePages?: unknown;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  let token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token && typeof req.query.token === "string") {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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
    req.accessiblePages = account.accessiblePages;
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
 * Page-permission authorization. Admins always pass; other users need
 * "edit" access to the page (accessiblePages entries like "clients:edit",
 * "clients" (legacy = edit) or "*"). Later entries win, as in the frontend.
 */
export const requirePageEdit = (pageKeys: string | string[]) => {
  const keys = Array.isArray(pageKeys) ? pageKeys : [pageKeys];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = req.roles || [];
    if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) return next();

    const raw = req.accessiblePages;
    const hasEdit = (pageKey: string) => {
      let level = "none";
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (typeof item !== "string") continue;
          if (item === "*" || item === pageKey) level = "edit";
          else if (item.startsWith(`${pageKey}:`)) level = item.split(":")[1];
        }
      }
      return level === "edit";
    };
    if (keys.some(hasEdit)) return next();
    return res.status(403).json({ message: "Forbidden: you do not have edit access to this page" });
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

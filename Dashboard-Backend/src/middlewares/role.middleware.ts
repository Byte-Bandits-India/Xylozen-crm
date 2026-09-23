import { Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "./auth.middleware";

export const authorizeRoles = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const publicId = req.publicId; 

      if (!publicId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRoles = await prisma.accountRole.findMany({
        where: { accountPublicId: publicId },
        include: { role: true },
      });

      const hasRole = userRoles.some((r) =>
        roles.includes(r.role.name)
      );

      if (!hasRole) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Role validation failed" });
    }
  };
};
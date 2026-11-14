import { Router, Response, NextFunction } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/client.controller";
import { getSheetLink, saveSheetLink, syncSheetLinkNow, deleteSheetLink } from "../controllers/clientSheet.controller";
import {
  getClientProjects,
  createClientProject,
  updateClientProject,
  deleteClientProject,
} from "../controllers/clientProject.controller";
import { authMiddleware, requirePageEdit, AuthRequest } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createClientSchema, updateClientSchema, createProjectSchema, updateProjectSchema } from "../validators/client.validator";

const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const roles = req.roles || (req.role ? [req.role] : []);
  if (!roles.includes("SUPER_ADMIN")) {
    return res.status(403).json({ message: "Forbidden: only a super admin can manage the sheet link" });
  }
  next();
};

const router = Router();

router.get("/sheet-link", authMiddleware, requireSuperAdmin, getSheetLink);
router.put("/sheet-link", authMiddleware, requireSuperAdmin, saveSheetLink);
router.post("/sheet-link/sync", authMiddleware, requireSuperAdmin, syncSheetLinkNow);
router.delete("/sheet-link", authMiddleware, requireSuperAdmin, deleteSheetLink);
router.post("/", authMiddleware, requirePageEdit("clients"), validate(createClientSchema), createClient);
router.get("/", authMiddleware, getClients);
router.get("/:publicId", authMiddleware, getClientById);
router.put("/:publicId", authMiddleware, requirePageEdit("clients"), validate(updateClientSchema), updateClient);
router.delete("/:publicId", authMiddleware, requirePageEdit("clients"), deleteClient);

router.get("/:publicId/projects", authMiddleware, getClientProjects);
router.post("/:publicId/projects", authMiddleware, requirePageEdit("clients"), validate(createProjectSchema), createClientProject);
router.put("/:publicId/projects/:projectId", authMiddleware, requirePageEdit("clients"), validate(updateProjectSchema), updateClientProject);
router.delete("/:publicId/projects/:projectId", authMiddleware, requirePageEdit("clients"), deleteClientProject);

export default router;

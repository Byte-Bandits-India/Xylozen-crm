import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/client.controller";
import {
  getClientProjects,
  createClientProject,
  updateClientProject,
  deleteClientProject,
} from "../controllers/clientProject.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createClientSchema, updateClientSchema, createProjectSchema, updateProjectSchema } from "../validators/client.validator";

const router = Router();

router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(createClientSchema), createClient);
router.get("/", authMiddleware, getClients);
router.get("/:publicId", authMiddleware, getClientById);
router.put("/:publicId", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(updateClientSchema), updateClient);
router.delete("/:publicId", authMiddleware, authorize(["SUPER_ADMIN"]), deleteClient);

router.get("/:publicId/projects", authMiddleware, getClientProjects);
router.post("/:publicId/projects", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(createProjectSchema), createClientProject);
router.put("/:publicId/projects/:projectId", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(updateProjectSchema), updateClientProject);
router.delete("/:publicId/projects/:projectId", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), deleteClientProject);

export default router;

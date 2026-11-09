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
import { authMiddleware, requirePageEdit } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createClientSchema, updateClientSchema, createProjectSchema, updateProjectSchema } from "../validators/client.validator";

const router = Router();

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

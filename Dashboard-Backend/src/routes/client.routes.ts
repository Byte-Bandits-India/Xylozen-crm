import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/client.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import { createClientSchema, updateClientSchema } from "../validators/client.validator";

const router = Router();

router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(createClientSchema), createClient);
router.get("/", authMiddleware, getClients);
router.get("/:publicId", authMiddleware, getClientById);
router.put("/:publicId", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(updateClientSchema), updateClient);
router.delete("/:publicId", authMiddleware, authorize(["SUPER_ADMIN"]), deleteClient);

export default router;

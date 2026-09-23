import { Router } from "express";
import {
  createUser,
  listUsers,
  getUserById,
  updateUserRole,
  updateUserDetails,
  deleteUser,
} from "../controllers/admin.controller";
import {
  getFunctionalRoles,
  createFunctionalRole,
  deleteFunctionalRole,
} from "../controllers/functionalRole.controller";
import { authMiddleware, authorize, optionalAuth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import {
  createUserSchema,
  updateUserRoleSchema,
  updateUserDetailsSchema,
  createFunctionalRoleSchema,
} from "../validators/admin.validator";

const router = Router();

// Functional Roles: GET can be accessed by any user (for dropdowns)
router.get("/functional-roles", optionalAuth, getFunctionalRoles);

// Admin-only operations
router.use(authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]));

// Functional roles management
router.post("/functional-roles", validate(createFunctionalRoleSchema), createFunctionalRole);
router.delete("/functional-roles/:publicId", deleteFunctionalRole);

// User management
router.post("/users", validate(createUserSchema), createUser);
router.get("/users", listUsers);
router.get("/users/:publicId", getUserById);
router.patch("/users/:publicId", validate(updateUserDetailsSchema), updateUserDetails);
router.patch("/users/:publicId/role", validate(updateUserRoleSchema), updateUserRole);
router.delete("/users/:publicId", deleteUser);

export default router;

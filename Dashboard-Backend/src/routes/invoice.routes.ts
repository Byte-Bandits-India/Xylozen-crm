import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  getInvoicePayments,
} from "../controllers/invoice.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
} from "../validators/invoice.validator";

const router = Router();

router.post("/", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(createInvoiceSchema), createInvoice);
router.get("/", authMiddleware, getInvoices);
router.get("/:publicId", authMiddleware, getInvoiceById);
router.put("/:publicId", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(updateInvoiceSchema), updateInvoice);
router.delete("/:publicId", authMiddleware, authorize(["SUPER_ADMIN"]), deleteInvoice);
router.post("/:publicId/payments", authMiddleware, authorize(["SUPER_ADMIN", "ADMIN"]), validate(recordPaymentSchema), recordPayment);
router.get("/:publicId/payments", authMiddleware, getInvoicePayments);

export default router;

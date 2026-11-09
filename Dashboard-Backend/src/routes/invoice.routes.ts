import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getNextInvoiceNumberHandler,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  getInvoicePayments,
} from "../controllers/invoice.controller";
import { authMiddleware, requirePageEdit } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.middleware";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
} from "../validators/invoice.validator";

const router = Router();

router.post("/", authMiddleware, requirePageEdit("invoices"), validate(createInvoiceSchema), createInvoice);
router.get("/next-number", authMiddleware, getNextInvoiceNumberHandler);
router.get("/", authMiddleware, getInvoices);
router.get("/:publicId", authMiddleware, getInvoiceById);
router.put("/:publicId", authMiddleware, requirePageEdit("invoices"), validate(updateInvoiceSchema), updateInvoice);
router.delete("/:publicId", authMiddleware, requirePageEdit("invoices"), deleteInvoice);
router.post("/:publicId/payments", authMiddleware, requirePageEdit("invoices"), validate(recordPaymentSchema), recordPayment);
router.get("/:publicId/payments", authMiddleware, getInvoicePayments);

export default router;

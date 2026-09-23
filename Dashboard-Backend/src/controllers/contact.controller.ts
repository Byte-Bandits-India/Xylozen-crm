import { Request, Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendCreated, sendPaginated, sendError } from "../utils/response";
import { parsePagination, parseSorting } from "../utils/pagination";
import * as XLSX from "xlsx";

// ─── CREATE CONTACT ─────────────────────────────────────
// Public endpoint for submitting contact forms
export const createContact = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, website, message, consent, source } = req.body;

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        website: website || null,
        message,
        consent: consent !== undefined ? consent : false,
        source: source || null,
      },
    });

    return sendCreated(res, contact, "Contact message submitted successfully");
  } catch (error) {
    console.error("CREATE CONTACT ERROR:", error);
    return sendError(res, "Failed to submit contact message");
  }
};

// ─── GET ALL CONTACTS ───────────────────────────────────
// Authenticated endpoint for viewing submitted contact messages
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const { skip, take, page, pageSize } = parsePagination(req.query);
    const { orderBy } = parseSorting(req.query, ["name", "email", "createdAt"]);

    const where: any = {};
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.contact.count({ where }),
    ]);

    // Map `publicId` to `id` for frontend usage consistency if needed, and exclude consent field
    const mappedContacts = contacts.map(({ consent, ...contact }) => ({
      ...contact,
      id: contact.publicId, // consistent with other models in the system
    }));

    return sendPaginated(res, mappedContacts, total, page, pageSize);
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error);
    return sendError(res, "Failed to fetch contact messages");
  }
};

// ─── DELETE CONTACT ─────────────────────────────────────
// Authenticated endpoint for deleting a contact message
export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;

    const existing = await prisma.contact.findUnique({
      where: { publicId },
    });

    if (!existing) {
      return sendError(res, "Contact message not found", 404);
    }

    await prisma.contact.delete({
      where: { publicId },
    });

    return sendSuccess(res, null, "Contact message deleted successfully");
  } catch (error) {
    console.error("DELETE CONTACT ERROR:", error);
    return sendError(res, "Failed to delete contact message");
  }
};

// ─── EXPORT CONTACTS TO EXCEL ───────────────────────────
// Authenticated endpoint for downloading contacts as excel
export const exportContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { message: { contains: search } },
      ];
    }

    // Fetch all matching contacts (without pagination)
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Map contacts to fields for Excel columns
    const mappedContacts = contacts.map((contact) => ({
      Name: contact.name,
      Email: contact.email,
      Phone: contact.phone || "",
      Website: contact.website || "",
      Message: contact.message,
      Source: contact.source || "",
      "Submitted At": new Date(contact.createdAt).toLocaleString(),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(mappedContacts);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contact Messages");

    // Write to a buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers for file download
    res.setHeader("Content-Disposition", 'attachment; filename="contact_messages.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("EXPORT CONTACTS ERROR:", error);
    return sendError(res, "Failed to export contact messages");
  }
};



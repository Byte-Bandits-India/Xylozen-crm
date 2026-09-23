import { Response } from "express";
import { serialize } from "./serialize";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: any;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function sendSuccess(
  res: Response,
  data: any,
  message?: string,
  statusCode = 200
) {
  const body: ApiResponse = {
    success: true,
    message: message || "Success",
    data: serialize(data),
  };
  return res.status(statusCode).json(body);
}

export function sendCreated(res: Response, data: any, message?: string) {
  return sendSuccess(res, data, message || "Created successfully", 201);
}

export function sendPaginated(
  res: Response,
  data: any[],
  total: number,
  page: number,
  pageSize: number
) {
  const body: ApiResponse = {
    success: true,
    data: serialize(data),
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
  return res.json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: any
) {
  const body: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(body);
}

export function sendMessage(res: Response, message: string, statusCode = 200) {
  return res.status(statusCode).json({ success: true, message });
}

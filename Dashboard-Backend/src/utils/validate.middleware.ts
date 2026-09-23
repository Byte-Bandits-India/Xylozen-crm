import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "./response";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const getIssues = (error as any).issues || (error as any).errors || [];
        const errors = getIssues.reduce((acc: any, curr: any) => {
          const path = curr.path ? curr.path.join(".") : "unknown";
          acc[path] = curr.message;
          return acc;
        }, {});

        return sendError(res, "Validation failed", 400, errors);
      }
      return sendError(res, "Internal validation error", 500);
    }
  };

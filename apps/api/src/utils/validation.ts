import { type Request, type RequestHandler, type Response } from "express";
import { z } from "zod";

type ValidationErrorDetail = {
  field: string;
  message: string;
};

type ValidationError = Error & {
  status: number;
  details: ValidationErrorDetail[];
};

type ValidationSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

function createValidationError(issues: ValidationErrorDetail[]): ValidationError {
  const validationError = new Error("Invalid request data") as ValidationError;

  validationError.status = 400;
  validationError.details = issues;

  return validationError;
}

function mapIssues(source: "body" | "params" | "query", error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? `${source}.${issue.path.join(".")}` : source,
    message: issue.message,
  }));
}

function parseSection<TSchema extends z.ZodTypeAny>(
  source: "body" | "params" | "query",
  schema: TSchema | undefined,
  value: unknown,
) {
  if (!schema) {
    return value;
  }

  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  throw createValidationError(mapIssues(source, result.error));
}

export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      req.body = parseSection("body", schemas.body, req.body);
      req.params = parseSection("params", schemas.params, req.params) as Request["params"];
      req.query = parseSection("query", schemas.query, req.query) as Request["query"];

      next();
    } catch (err) {
      sendRouteError(res, err, 400, "Validation failed");
    }
  };
}

export function sendRouteError(
  res: Response,
  err: unknown,
  fallbackStatus: number,
  logLabel = "Route error",
) {
  console.error(`${logLabel}:`, err);

  if (err instanceof Error) {
    const errorWithStatus = err as Error & {
      status?: number;
      details?: ValidationErrorDetail[];
    };

    return res.status(errorWithStatus.status || fallbackStatus).json({
      error: errorWithStatus.message,
      ...(errorWithStatus.details ? { details: errorWithStatus.details } : {}),
    });
  }

  return res.status(fallbackStatus).json({ error: "Unexpected error" });
}
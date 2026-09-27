/** Consistent API errors: every failure responds with { error, code, details? }. */

export class ApiError extends Error {
  constructor(status, message, code = "ERROR", details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message = "Invalid request.", details) => new ApiError(400, message, "BAD_REQUEST", details);
export const unauthorized = (message = "Authentication required.") => new ApiError(401, message, "UNAUTHORIZED");
export const forbidden = (message = "You do not have access to this resource.") => new ApiError(403, message, "FORBIDDEN");
export const notFound = (message = "Resource not found.") => new ApiError(404, message, "NOT_FOUND");
export const conflict = (message = "Resource already exists.", details) => new ApiError(409, message, "CONFLICT", details);
export const tooMany = (message = "Too many requests. Please try again later.") => new ApiError(429, message, "RATE_LIMITED");
export const serviceUnavailable = (message = "Service temporarily unavailable.") => new ApiError(503, message, "SERVICE_UNAVAILABLE");

/** Wrap an async route handler so rejections reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function notFoundHandler(req, res, next) {
  next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const code = err?.code || "INTERNAL_ERROR";
  const message = status >= 500 && !err?.expose ? "Something went wrong on our end." : err.message;

  if (status >= 500 && req.app.get("log")) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    error: message,
    code,
    ...(err?.details ? { details: err.details } : {}),
  });
}

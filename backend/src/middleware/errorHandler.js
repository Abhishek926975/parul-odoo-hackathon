import { ApiError } from "../utils/apiError.js";

export function notFound(request, _response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || (error.name === "UnauthorizedError" ? 401 : 500);
  const payload = {
    success: false,
    error: error.message || "Internal server error",
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production") {
    payload.stack = error.stack;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json(payload);
}

import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";

const readToken = (request) => {
  const authHeader = request.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return request.cookies?.token || null;
};

export function requireAuth(request, _response, next) {
  const token = readToken(request);

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function optionalAuth(request, _response, next) {
  const token = readToken(request);

  if (!token) {
    return next();
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    request.user = null;
  }

  return next();
}

export const authenticate = requireAuth;

export const requireRole = (roles) => (request, _response, next) => {
  if (!request.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!roles.includes(request.user.role)) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};

import crypto from "crypto";
import { query } from "../db/connection.js";
import { ApiError } from "./apiError.js";

export async function ensureTripAccess(tripId, userId) {
  const result = await query("SELECT * FROM trips WHERE id = $1 AND user_id = $2", [
    tripId,
    userId,
  ]);

  if (!result.rows[0]) {
    throw new ApiError(404, "Trip not found");
  }

  return result.rows[0];
}

export const pagination = (request, defaultLimit = 20) => {
  const limit = Math.min(Number(request.query.limit || defaultLimit), 100);
  const offset = Math.max(Number(request.query.offset || 0), 0);
  return { limit, offset };
};

export function publicSlug(name) {
  const base = String(name || "trip")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

  return `${base || "trip"}-${crypto.randomUUID().slice(0, 8)}`;
}

export const normalizeTags = (tags) => {
  if (!tags) return null;
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

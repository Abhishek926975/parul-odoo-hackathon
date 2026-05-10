import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess } from "../utils/dbHelpers.js";

export const listSections = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    `SELECT itinerary_sections.*, trip_stops.city_name
     FROM itinerary_sections
     LEFT JOIN trip_stops ON trip_stops.id = itinerary_sections.stop_id
     WHERE itinerary_sections.trip_id = $1
     ORDER BY itinerary_sections.date_from ASC, itinerary_sections.created_at ASC`,
    [request.params.tripId],
  );

  response.json({ success: true, data: { sections: result.rows } });
});

export const createSection = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const stopId = request.body.stop_id || request.body.stopId || null;
  const sectionType = request.body.section_type || request.body.sectionType || "other";
  const dateFrom = request.body.date_from || request.body.dateFrom;
  const dateTo = request.body.date_to || request.body.dateTo || dateFrom;
  const budgetEstimate = request.body.budget_estimate ?? request.body.budgetEstimate ?? null;
  const { title, description } = request.body;

  if (!title || !dateFrom) throw new ApiError(400, "title and date_from are required");

  const result = await query(
    `INSERT INTO itinerary_sections (
      trip_id, stop_id, title, description, section_type, date_from, date_to, budget_estimate
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [request.params.tripId, stopId, title, description || null, sectionType, dateFrom, dateTo, budgetEstimate],
  );

  response.status(201).json({ success: true, data: { section: result.rows[0] } });
});

export const updateSection = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const fieldMap = [
    ["stop_id", request.body.stop_id || request.body.stopId],
    ["title", request.body.title],
    ["description", request.body.description],
    ["section_type", request.body.section_type || request.body.sectionType],
    ["date_from", request.body.date_from || request.body.dateFrom],
    ["date_to", request.body.date_to || request.body.dateTo],
    ["budget_estimate", request.body.budget_estimate ?? request.body.budgetEstimate],
  ].filter(([, value]) => value !== undefined);

  if (!fieldMap.length) throw new ApiError(400, "At least one field is required");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.params.sectionId, request.params.tripId);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE itinerary_sections SET ${setClause}
     WHERE id = $${values.length - 1} AND trip_id = $${values.length}
     RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw new ApiError(404, "Section not found");

  response.json({ success: true, data: { section: result.rows[0] } });
});

export const deleteSection = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    "DELETE FROM itinerary_sections WHERE id = $1 AND trip_id = $2 RETURNING id",
    [request.params.sectionId, request.params.tripId],
  );
  if (!result.rows[0]) throw new ApiError(404, "Section not found");

  response.json({ success: true, data: { message: "Section deleted" } });
});

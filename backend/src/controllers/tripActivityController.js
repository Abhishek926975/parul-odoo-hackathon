import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess } from "../utils/dbHelpers.js";

export const listTripActivities = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    `SELECT trip_activities.*, activities.name, activities.description, activities.city,
            activities.country, activities.category, activities.estimated_cost,
            activities.duration_hours, activities.image_url
     FROM trip_activities
     JOIN activities ON activities.id = trip_activities.activity_id
     WHERE trip_activities.trip_id = $1
     ORDER BY scheduled_date NULLS LAST, trip_activities.created_at DESC`,
    [request.params.tripId],
  );

  response.json({ success: true, data: { tripActivities: result.rows, activities: result.rows } });
});

export const addTripActivity = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const activityId = request.body.activity_id || request.body.activityId;

  if (!activityId) throw new ApiError(400, "activity_id is required");

  const result = await query(
    `INSERT INTO trip_activities (trip_id, stop_id, activity_id, scheduled_date, actual_cost, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      request.params.tripId,
      request.body.stop_id || request.body.stopId || null,
      activityId,
      request.body.scheduled_date || request.body.scheduledDate || null,
      request.body.actual_cost ?? request.body.actualCost ?? null,
      request.body.notes || null,
    ],
  );

  response.status(201).json({ success: true, data: { tripActivity: result.rows[0] } });
});

export const updateTripActivity = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const fieldMap = [
    ["stop_id", request.body.stop_id || request.body.stopId],
    ["scheduled_date", request.body.scheduled_date || request.body.scheduledDate],
    ["actual_cost", request.body.actual_cost ?? request.body.actualCost],
    ["notes", request.body.notes],
  ].filter(([, value]) => value !== undefined);

  if (!fieldMap.length) throw new ApiError(400, "At least one field is required");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.params.id, request.params.tripId);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE trip_activities SET ${setClause}
     WHERE id = $${values.length - 1} AND trip_id = $${values.length}
     RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw new ApiError(404, "Trip activity not found");

  response.json({ success: true, data: { tripActivity: result.rows[0] } });
});

export const removeTripActivity = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query("DELETE FROM trip_activities WHERE id = $1 AND trip_id = $2 RETURNING id", [
    request.params.id,
    request.params.tripId,
  ]);
  if (!result.rows[0]) throw new ApiError(404, "Trip activity not found");

  response.json({ success: true, data: { message: "Trip activity removed" } });
});

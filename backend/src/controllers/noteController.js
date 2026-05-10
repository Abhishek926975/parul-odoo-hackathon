import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess } from "../utils/dbHelpers.js";

export const listNotes = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    `SELECT trip_notes.*, trip_stops.city_name
     FROM trip_notes
     LEFT JOIN trip_stops ON trip_stops.id = trip_notes.stop_id
     WHERE trip_notes.trip_id = $1
     ORDER BY trip_notes.created_at DESC`,
    [request.params.tripId],
  );

  response.json({ success: true, data: { notes: result.rows } });
});

export const createNote = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const stopId = request.body.stop_id || request.body.stopId || null;
  const noteDate = request.body.note_date || request.body.noteDate || null;
  const { title, content } = request.body;

  if (!content) throw new ApiError(400, "content is required");

  const result = await query(
    `INSERT INTO trip_notes (trip_id, stop_id, user_id, title, content, note_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [request.params.tripId, stopId, request.user.id, title || null, content, noteDate],
  );

  response.status(201).json({ success: true, data: { note: result.rows[0] } });
});

export const updateNote = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const fieldMap = [
    ["stop_id", request.body.stop_id || request.body.stopId],
    ["title", request.body.title],
    ["content", request.body.content],
    ["note_date", request.body.note_date || request.body.noteDate],
  ].filter(([, value]) => value !== undefined);

  if (!fieldMap.length) throw new ApiError(400, "At least one field is required");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.params.noteId, request.params.tripId, request.user.id);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE trip_notes SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length - 2} AND trip_id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw new ApiError(404, "Note not found");

  response.json({ success: true, data: { note: result.rows[0] } });
});

export const deleteNote = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    "DELETE FROM trip_notes WHERE id = $1 AND trip_id = $2 AND user_id = $3 RETURNING id",
    [request.params.noteId, request.params.tripId, request.user.id],
  );
  if (!result.rows[0]) throw new ApiError(404, "Note not found");

  response.json({ success: true, data: { message: "Note deleted" } });
});

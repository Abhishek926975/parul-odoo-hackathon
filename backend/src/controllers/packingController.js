import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess } from "../utils/dbHelpers.js";

export const listPacking = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    "SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY category ASC, created_at DESC",
    [request.params.tripId],
  );

  response.json({ success: true, data: { items: result.rows, packing: result.rows } });
});

export const createPackingItem = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const { name, category = "other" } = request.body;
  if (!name) throw new ApiError(400, "name is required");

  const result = await query(
    `INSERT INTO packing_items (trip_id, user_id, name, category)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [request.params.tripId, request.user.id, name, category],
  );

  response.status(201).json({ success: true, data: { item: result.rows[0] } });
});

export const togglePackingItem = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    `UPDATE packing_items SET is_packed = COALESCE($1, NOT is_packed)
     WHERE id = $2 AND trip_id = $3
     RETURNING *`,
    [request.body.is_packed ?? request.body.isPacked ?? null, request.params.itemId, request.params.tripId],
  );
  if (!result.rows[0]) throw new ApiError(404, "Packing item not found");

  response.json({ success: true, data: { item: result.rows[0] } });
});

export const deletePackingItem = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query("DELETE FROM packing_items WHERE id = $1 AND trip_id = $2 RETURNING id", [
    request.params.itemId,
    request.params.tripId,
  ]);
  if (!result.rows[0]) throw new ApiError(404, "Packing item not found");

  response.json({ success: true, data: { message: "Packing item deleted" } });
});

export const resetPacking = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  await query("UPDATE packing_items SET is_packed = false WHERE trip_id = $1", [request.params.tripId]);

  response.json({ success: true, data: { message: "Packing checklist reset" } });
});

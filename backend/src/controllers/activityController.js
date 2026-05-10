import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pagination } from "../utils/dbHelpers.js";

export const listActivities = asyncHandler(async (request, response) => {
  const {
    q = "",
    search = "",
    city = "",
    category = "",
    max_cost = "",
    min_duration = "",
    max_duration = "",
  } = request.query;
  const term = search || q;
  const { limit, offset } = pagination(request, 20);
  const result = await query(
    `SELECT * FROM activities
     WHERE ($1 = '' OR name ILIKE $2 OR description ILIKE $2 OR city ILIKE $2)
       AND ($3 = '' OR city ILIKE $4)
       AND ($5 = '' OR category::text = $5)
       AND ($6 = '' OR estimated_cost <= NULLIF($6, '')::numeric)
       AND ($7 = '' OR duration_hours >= NULLIF($7, '')::numeric)
       AND ($8 = '' OR duration_hours <= NULLIF($8, '')::numeric)
     ORDER BY is_featured DESC, created_at DESC`,
    [term, `%${term}%`, city, `%${city}%`, category, max_cost, min_duration, max_duration],
  );

  response.json({ success: true, data: { activities: result.rows.slice(offset, offset + limit), total: result.rowCount } });
});

export const featuredActivities = asyncHandler(async (_request, response) => {
  const result = await query(
    "SELECT * FROM activities WHERE is_featured = true ORDER BY created_at DESC LIMIT 10",
  );
  response.json({ success: true, data: { activities: result.rows } });
});

export const getActivityById = asyncHandler(async (request, response) => {
  const result = await query("SELECT * FROM activities WHERE id = $1", [request.params.id]);
  if (!result.rows[0]) throw new ApiError(404, "Activity not found");

  response.json({ success: true, data: { activity: result.rows[0] } });
});

import { query } from "../db/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pagination } from "../utils/dbHelpers.js";

export const listCities = asyncHandler(async (request, response) => {
  const { q = "", search = "", region = "", sort = "popularity" } = request.query;
  const term = search || q;
  const { limit, offset } = pagination(request, 20);
  const orderBy =
    sort === "cost"
      ? "cost_index ASC, popularity_score DESC"
      : sort === "cost_desc"
        ? "cost_index DESC, popularity_score DESC"
        : "popularity_score DESC, name ASC";
  const result = await query(
    `SELECT *, COUNT(*) OVER()::int AS total_count
     FROM cities
     WHERE ($1 = '' OR name ILIKE $2 OR country ILIKE $2 OR region ILIKE $2)
       AND ($3 = '' OR region ILIKE $4)
     ORDER BY is_featured DESC, ${orderBy}
     LIMIT $5 OFFSET $6`,
    [term, `%${term}%`, region, `%${region}%`, limit, offset],
  );

  const total = result.rows[0]?.total_count || 0;
  response.json({ success: true, data: { cities: result.rows, total } });
});

export const featuredCities = asyncHandler(async (_request, response) => {
  const result = await query(
    "SELECT * FROM cities WHERE is_featured = true ORDER BY popularity_score DESC LIMIT 8",
  );
  response.json({ success: true, data: { cities: result.rows } });
});

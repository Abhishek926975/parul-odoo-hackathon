import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess, publicSlug } from "../utils/dbHelpers.js";

const readDate = (body, snakeName, camelName) => body[snakeName] || body[camelName];

const tripDetail = async (tripId, userId = null, publicOnly = false) => {
  const where = publicOnly ? "public_slug = $1 AND is_public = true" : "id = $1 AND user_id = $2";
  const params = publicOnly ? [tripId] : [tripId, userId];
  const tripResult = await query(`SELECT * FROM trips WHERE ${where}`, params);
  const trip = tripResult.rows[0];

  if (!trip) throw new ApiError(404, "Trip not found");

  const [stops, sections, activities, expenses, packing, notes, owner] = await Promise.all([
    query("SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY order_index ASC, arrival_date ASC", [trip.id]),
    query(
      `SELECT itinerary_sections.*, trip_stops.city_name
       FROM itinerary_sections
       LEFT JOIN trip_stops ON trip_stops.id = itinerary_sections.stop_id
       WHERE itinerary_sections.trip_id = $1
       ORDER BY date_from ASC, created_at ASC`,
      [trip.id],
    ),
    query(
      `SELECT trip_activities.*, activities.name, activities.description, activities.city,
              activities.country, activities.category, activities.estimated_cost,
              activities.duration_hours, activities.image_url
       FROM trip_activities
       JOIN activities ON activities.id = trip_activities.activity_id
       WHERE trip_activities.trip_id = $1
       ORDER BY scheduled_date NULLS LAST, trip_activities.created_at DESC`,
      [trip.id],
    ),
    query("SELECT * FROM expenses WHERE trip_id = $1 ORDER BY expense_date DESC", [trip.id]),
    query("SELECT * FROM packing_items WHERE trip_id = $1 ORDER BY category ASC, created_at DESC", [trip.id]),
    query("SELECT * FROM trip_notes WHERE trip_id = $1 ORDER BY created_at DESC", [trip.id]),
    query("SELECT first_name, last_name, email FROM users WHERE id = $1", [trip.user_id]),
  ]);

  const expensesTotal = expenses.rows.reduce(
    (sum, item) => sum + Number(item.amount || 0) * Number(item.qty || 1),
    0,
  );

  return {
    ...trip,
    owner: owner.rows[0],
    stops: stops.rows,
    sections: sections.rows,
    trip_activities: activities.rows,
    expenses: expenses.rows,
    packing_items: packing.rows,
    notes: notes.rows,
    summary: {
      stops_count: stops.rowCount,
      sections_count: sections.rowCount,
      activities_count: activities.rowCount,
      expenses_total: expensesTotal,
    },
  };
};

export const listTrips = asyncHandler(async (request, response) => {
  const params = [request.user.id];
  let statusClause = "";

  if (request.query.status) {
    params.push(request.query.status);
    statusClause = ` AND trips.status = $${params.length}`;
  }

  const result = await query(
    `SELECT trips.*,
            COUNT(DISTINCT trip_stops.id)::int AS stops_count,
            COALESCE(SUM(DISTINCT expenses.amount * expenses.qty), 0)::numeric AS expenses_total
     FROM trips
     LEFT JOIN trip_stops ON trip_stops.trip_id = trips.id
     LEFT JOIN expenses ON expenses.trip_id = trips.id
     WHERE trips.user_id = $1${statusClause}
     GROUP BY trips.id
     ORDER BY trips.created_at DESC`,
    params,
  );

  response.json({ success: true, data: { trips: result.rows } });
});

export const createTrip = asyncHandler(async (request, response) => {
  const { name, description } = request.body;
  const startDate = readDate(request.body, "start_date", "startDate");
  const endDate = readDate(request.body, "end_date", "endDate");
  const totalBudget = request.body.total_budget ?? request.body.totalBudget ?? null;
  const isPublic = Boolean(request.body.is_public ?? request.body.isPublic);

  if (!name || !startDate || !endDate) {
    throw new ApiError(400, "name, start_date, and end_date are required");
  }

  const result = await query(
    `INSERT INTO trips (
      user_id, name, description, start_date, end_date, total_budget, is_public, public_slug, cover_photo_url
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      request.user.id,
      name,
      description || null,
      startDate,
      endDate,
      totalBudget,
      isPublic,
      isPublic ? publicSlug(name) : null,
      request.body.cover_photo_url || request.body.coverPhotoUrl || null,
    ],
  );

  response.status(201).json({ success: true, data: { trip: result.rows[0] } });
});

export const getTripById = asyncHandler(async (request, response) => {
  const trip = await tripDetail(request.params.id, request.user.id);
  response.json({ success: true, data: { trip } });
});

export const updateTrip = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.id, request.user.id);

  const isPublic = request.body.is_public ?? request.body.isPublic;
  const fieldMap = [
    ["name", request.body.name],
    ["description", request.body.description],
    ["start_date", readDate(request.body, "start_date", "startDate")],
    ["end_date", readDate(request.body, "end_date", "endDate")],
    ["status", request.body.status],
    ["is_public", isPublic],
    ["public_slug", request.body.public_slug || request.body.publicSlug],
    ["total_budget", request.body.total_budget ?? request.body.totalBudget],
    ["cover_photo_url", request.body.cover_photo_url || request.body.coverPhotoUrl],
  ].filter(([, value]) => value !== undefined);

  if (isPublic === true && !fieldMap.some(([field]) => field === "public_slug")) {
    fieldMap.push(["public_slug", publicSlug(request.body.name || "trip")]);
  }

  if (!fieldMap.length) throw new ApiError(400, "At least one field is required to update a trip");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.params.id, request.user.id);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE trips SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING *`,
    values,
  );

  response.json({ success: true, data: { trip: result.rows[0] } });
});

export const deleteTrip = asyncHandler(async (request, response) => {
  const result = await query("DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id", [
    request.params.id,
    request.user.id,
  ]);
  if (!result.rows[0]) throw new ApiError(404, "Trip not found");

  response.json({ success: true, data: { message: "Trip deleted" } });
});

export const getPublicTrip = asyncHandler(async (request, response) => {
  const trip = await tripDetail(request.params.slug, null, true);
  response.json({ success: true, data: { trip } });
});

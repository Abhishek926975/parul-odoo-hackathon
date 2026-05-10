import { query, withTransaction } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess } from "../utils/dbHelpers.js";

export const listStops = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    `SELECT trip_stops.*,
            COUNT(itinerary_sections.id)::int AS sections_count
     FROM trip_stops
     LEFT JOIN itinerary_sections ON itinerary_sections.stop_id = trip_stops.id
     WHERE trip_stops.trip_id = $1
     GROUP BY trip_stops.id
     ORDER BY trip_stops.order_index ASC, trip_stops.arrival_date ASC`,
    [request.params.tripId],
  );

  response.json({ success: true, data: { stops: result.rows } });
});

export const createStop = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const cityName = request.body.city_name || request.body.cityName;
  const { country } = request.body;
  const arrivalDate = request.body.arrival_date || request.body.arrivalDate;
  const departureDate = request.body.departure_date || request.body.departureDate;

  if (!cityName || !arrivalDate || !departureDate) {
    throw new ApiError(400, "city_name, arrival_date, and departure_date are required");
  }

  const orderResult = await query(
    "SELECT COALESCE(MAX(order_index), -1) + 1 AS next_index FROM trip_stops WHERE trip_id = $1",
    [request.params.tripId],
  );
  const result = await query(
    `INSERT INTO trip_stops (trip_id, city_name, country, arrival_date, departure_date, order_index)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      request.params.tripId,
      cityName,
      country || null,
      arrivalDate,
      departureDate,
      orderResult.rows[0].next_index,
    ],
  );

  response.status(201).json({ success: true, data: { stop: result.rows[0] } });
});

export const updateStop = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const fieldMap = [
    ["city_name", request.body.city_name || request.body.cityName],
    ["country", request.body.country],
    ["arrival_date", request.body.arrival_date || request.body.arrivalDate],
    ["departure_date", request.body.departure_date || request.body.departureDate],
    ["order_index", request.body.order_index ?? request.body.orderIndex],
  ].filter(([, value]) => value !== undefined);

  if (!fieldMap.length) throw new ApiError(400, "At least one field is required");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.params.stopId, request.params.tripId);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE trip_stops SET ${setClause}
     WHERE id = $${values.length - 1} AND trip_id = $${values.length}
     RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw new ApiError(404, "Stop not found");

  response.json({ success: true, data: { stop: result.rows[0] } });
});

export const deleteStop = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);

  await withTransaction(async (client) => {
    const deleted = await client.query(
      "DELETE FROM trip_stops WHERE id = $1 AND trip_id = $2 RETURNING id",
      [request.params.stopId, request.params.tripId],
    );
    if (!deleted.rows[0]) throw new ApiError(404, "Stop not found");

    const remaining = await client.query(
      "SELECT id FROM trip_stops WHERE trip_id = $1 ORDER BY order_index ASC, arrival_date ASC",
      [request.params.tripId],
    );
    await Promise.all(
      remaining.rows.map((stop, index) =>
        client.query("UPDATE trip_stops SET order_index = $1 WHERE id = $2", [index, stop.id]),
      ),
    );
  });

  response.json({ success: true, data: { message: "Stop deleted" } });
});

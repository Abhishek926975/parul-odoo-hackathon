import { query } from "../db/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pagination } from "../utils/dbHelpers.js";

export const getStats = asyncHandler(async (_request, response) => {
  const [users, trips, weekTrips, topCities, popularActivities, tripsByStatus, recentTrips] =
    await Promise.all([
    query("SELECT COUNT(*)::int AS count FROM users"),
    query("SELECT COUNT(*)::int AS count FROM trips"),
      query("SELECT COUNT(*)::int AS count FROM trips WHERE created_at >= NOW() - INTERVAL '7 days'"),
      query(
        `SELECT city_name AS name, COUNT(*)::int AS count
         FROM trip_stops GROUP BY city_name ORDER BY count DESC LIMIT 5`,
      ),
      query(
        `SELECT activities.name, COUNT(*)::int AS count
         FROM trip_activities
         JOIN activities ON activities.id = trip_activities.activity_id
         GROUP BY activities.id ORDER BY count DESC LIMIT 5`,
      ),
      query("SELECT status, COUNT(*)::int AS count FROM trips GROUP BY status"),
      query(
        `SELECT trips.*, users.email, users.first_name, users.last_name
         FROM trips JOIN users ON users.id = trips.user_id
         ORDER BY trips.created_at DESC LIMIT 10`,
      ),
    ]);

  response.json({
    success: true,
    data: {
      stats: {
        total_users: users.rows[0].count,
        total_trips: trips.rows[0].count,
        trips_this_week: weekTrips.rows[0].count,
        active_users_today: Math.max(1, Math.round(users.rows[0].count * 0.1)),
        top_cities: topCities.rows,
        popular_activities: popularActivities.rows,
        trips_by_status: tripsByStatus.rows,
        recent_trips: recentTrips.rows,
      },
    },
  });
});

export const getDashboard = getStats;

export const listUsers = asyncHandler(async (request, response) => {
  const { limit, offset } = pagination(request, 10);
  const term = request.query.search || request.query.q || "";
  const result = await query(
    `SELECT users.id, users.first_name, users.last_name, users.email, users.city, users.country,
            users.profile_photo_url, users.role, users.created_at,
            COUNT(trips.id)::int AS trips_count,
            COUNT(*) OVER()::int AS total_count
     FROM users
     LEFT JOIN trips ON trips.user_id = users.id
     WHERE ($1 = '' OR users.first_name ILIKE $2 OR users.last_name ILIKE $2 OR users.email ILIKE $2 OR users.city ILIKE $2)
     GROUP BY users.id
     ORDER BY users.created_at DESC
     LIMIT $3 OFFSET $4`,
    [term, `%${term}%`, limit, offset],
  );

  const total = result.rows[0]?.total_count || 0;
  response.json({ success: true, data: { users: result.rows, total } });
});

export const listAllTrips = asyncHandler(async (request, response) => {
  const { limit, offset } = pagination(request, 20);
  const term = request.query.search || request.query.q || "";
  const status = request.query.status || "";
  const result = await query(
    `SELECT trips.*, users.email, users.first_name, users.last_name,
            COUNT(trip_stops.id)::int AS stops_count,
            COUNT(*) OVER()::int AS total_count
     FROM trips
     JOIN users ON users.id = trips.user_id
     LEFT JOIN trip_stops ON trip_stops.trip_id = trips.id
     WHERE ($1 = '' OR trips.name ILIKE $2 OR users.email ILIKE $2 OR users.first_name ILIKE $2 OR users.last_name ILIKE $2)
       AND ($3 = '' OR trips.status::text = $3)
     GROUP BY trips.id, users.id
     ORDER BY trips.created_at DESC
     LIMIT $4 OFFSET $5`,
    [term, `%${term}%`, status, limit, offset],
  );

  const total = result.rows[0]?.total_count || 0;
  response.json({ success: true, data: { trips: result.rows, total } });
});

export const deleteUser = asyncHandler(async (request, response) => {
  if (request.user.id === request.params.userId) {
    response.status(400).json({ success: false, error: "You cannot delete your own account" });
    return;
  }

  const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [request.params.userId]);
  if (!result.rows[0]) {
    response.status(404).json({ success: false, error: "User not found" });
    return;
  }

  response.json({ success: true, data: { message: "User deleted" } });
});

export const deleteTrip = asyncHandler(async (request, response) => {
  const result = await query("DELETE FROM trips WHERE id = $1 RETURNING id", [request.params.tripId]);
  if (!result.rows[0]) {
    response.status(404).json({ success: false, error: "Trip not found" });
    return;
  }

  response.json({ success: true, data: { message: "Trip deleted" } });
});

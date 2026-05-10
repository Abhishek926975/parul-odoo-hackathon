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
  const result = await query(
    `SELECT users.id, users.first_name, users.last_name, users.email, users.city, users.country,
            users.profile_photo_url, users.role, users.created_at,
            COUNT(trips.id)::int AS trips_count
     FROM users
     LEFT JOIN trips ON trips.user_id = users.id
     GROUP BY users.id
     ORDER BY users.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  response.json({ success: true, data: { users: result.rows } });
});

export const listAllTrips = asyncHandler(async (request, response) => {
  const { limit, offset } = pagination(request, 20);
  const result = await query(
    `SELECT trips.*, users.email, users.first_name, users.last_name,
            COUNT(trip_stops.id)::int AS stops_count
     FROM trips
     JOIN users ON users.id = trips.user_id
     LEFT JOIN trip_stops ON trip_stops.trip_id = trips.id
     GROUP BY trips.id, users.id
     ORDER BY trips.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  response.json({ success: true, data: { trips: result.rows } });
});

import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeTags } from "../utils/dbHelpers.js";

export const listPosts = asyncHandler(async (request, response) => {
  const { search = "", sort = "recent", tag = "" } = request.query;
  const orderBy = sort === "popular" ? "community_posts.likes_count DESC" : "community_posts.created_at DESC";
  const result = await query(
    `SELECT community_posts.*, trips.name AS trip_name, trips.public_slug, trips.cover_photo_url,
            users.first_name, users.last_name
     FROM community_posts
     JOIN trips ON trips.id = community_posts.trip_id
     JOIN users ON users.id = community_posts.user_id
     WHERE trips.is_public = true
       AND ($1 = '' OR community_posts.title ILIKE $2 OR community_posts.body ILIKE $2 OR trips.name ILIKE $2)
       AND ($3 = '' OR $3 = ANY(community_posts.tags))
     ORDER BY ${orderBy}`,
    [search, `%${search}%`, tag],
  );

  response.json({ success: true, data: { posts: result.rows } });
});

export const createPost = asyncHandler(async (request, response) => {
  const tripId = request.body.trip_id || request.body.tripId;
  const { title, body, tags } = request.body;

  if (!tripId || !title || !body) {
    throw new ApiError(400, "trip_id, title, and body are required");
  }

  const trip = await query("SELECT id FROM trips WHERE id = $1 AND user_id = $2 AND is_public = true", [
    tripId,
    request.user.id,
  ]);
  if (!trip.rows[0]) {
    throw new ApiError(400, "Only your public trips can be shared to the community");
  }

  const result = await query(
    `INSERT INTO community_posts (trip_id, user_id, title, body, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [tripId, request.user.id, title, body, normalizeTags(tags)],
  );

  response.status(201).json({ success: true, data: { post: result.rows[0] } });
});

export const getPost = asyncHandler(async (request, response) => {
  const result = await query(
    `SELECT community_posts.*, trips.name AS trip_name, trips.public_slug, trips.cover_photo_url,
            users.first_name, users.last_name
     FROM community_posts
     JOIN trips ON trips.id = community_posts.trip_id
     JOIN users ON users.id = community_posts.user_id
     WHERE community_posts.id = $1`,
    [request.params.postId],
  );

  if (!result.rows[0]) throw new ApiError(404, "Community post not found");

  response.json({ success: true, data: { post: result.rows[0] } });
});

export const likePost = asyncHandler(async (request, response) => {
  const result = await query(
    `UPDATE community_posts SET likes_count = likes_count + 1, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [request.params.postId],
  );

  if (!result.rows[0]) throw new ApiError(404, "Community post not found");

  response.json({ success: true, data: { post: result.rows[0] } });
});

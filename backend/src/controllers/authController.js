import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../utils/validate.js";

const publicUserFields =
  "id, first_name, last_name, email, phone_number, city, country, profile_photo_url, additional_info, role, created_at, updated_at";

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

const setAuthCookie = (response, token) => {
  response.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = asyncHandler(async (request, response) => {
  const firstName = request.body.first_name || request.body.firstName;
  const lastName = request.body.last_name || request.body.lastName;
  const { email, password, phone_number, phoneNumber, city, country, additional_info, additionalInfo } =
    request.body;

  const errors = validate(
    { firstName, lastName, email, password },
    { firstName: "required", lastName: "required", email: "required|email", password: "required|min:6" },
  );
  if (errors) throw new ApiError(400, "Please fix the highlighted fields", errors);

  const normalizedEmail = email.toLowerCase();
  const existingUser = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existingUser.rowCount > 0) throw new ApiError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (
      first_name, last_name, email, password_hash, phone_number, city, country, additional_info
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${publicUserFields}`,
    [
      firstName,
      lastName,
      normalizedEmail,
      passwordHash,
      phone_number || phoneNumber || null,
      city || null,
      country || null,
      additional_info || additionalInfo || null,
    ],
  );

  const user = result.rows[0];
  const token = createToken(user);
  setAuthCookie(response, token);

  response.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (request, response) => {
  const { email, password } = request.body;
  const errors = validate({ email, password }, { email: "required|email", password: "required|min:6" });
  if (errors) throw new ApiError(400, "Please fix the highlighted fields", errors);

  const result = await query(
    `SELECT id, first_name, last_name, email, password_hash, phone_number, city, country,
            profile_photo_url, additional_info, role, created_at, updated_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, "Invalid credentials");
  }

  delete user.password_hash;
  const token = createToken(user);
  setAuthCookie(response, token);

  response.json({ success: true, data: { user, token } });
});

export const logout = asyncHandler(async (_request, response) => {
  response.clearCookie("token");
  response.json({ success: true, data: { message: "Logged out" } });
});

export const me = asyncHandler(async (request, response) => {
  const result = await query(`SELECT ${publicUserFields} FROM users WHERE id = $1`, [request.user.id]);

  if (!result.rows[0]) throw new ApiError(404, "User not found");

  response.json({ success: true, data: { user: result.rows[0] } });
});

export const updateProfile = asyncHandler(async (request, response) => {
  const fieldMap = [
    ["first_name", request.body.first_name || request.body.firstName],
    ["last_name", request.body.last_name || request.body.lastName],
    ["phone_number", request.body.phone_number || request.body.phoneNumber],
    ["city", request.body.city],
    ["country", request.body.country],
    ["additional_info", request.body.additional_info || request.body.additionalInfo],
  ].filter(([, value]) => value !== undefined);

  if (!fieldMap.length) throw new ApiError(400, "At least one profile field is required");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.user.id);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE users SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING ${publicUserFields}`,
    values,
  );

  response.json({ success: true, data: { user: result.rows[0] } });
});

export const uploadPhoto = asyncHandler(async (request, response) => {
  if (!request.file) throw new ApiError(400, "Profile photo is required");

  const photoUrl = `/${request.file.path.replace(/\\/g, "/")}`;
  const result = await query(
    `UPDATE users SET profile_photo_url = $1, updated_at = NOW()
     WHERE id = $2 RETURNING ${publicUserFields}`,
    [photoUrl, request.user.id],
  );

  response.json({ success: true, data: { user: result.rows[0], profile_photo_url: photoUrl } });
});

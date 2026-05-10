import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import activityRoutes from "./routes/activityRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import packingRoutes from "./routes/packingRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import stopRoutes from "./routes/stopRoutes.js";
import tripActivityRoutes from "./routes/tripActivityRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR || "uploads")));

app.get("/health", (_request, response) => {
  response.json({ success: true, data: { status: "ok", service: "traveloop-api" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/trips/:tripId/stops", stopRoutes);
app.use("/api/trips/:tripId/sections", sectionRoutes);
app.use("/api/trips/:tripId/activities", tripActivityRoutes);
app.use("/api/trips/:tripId/packing", packingRoutes);
app.use("/api/trips/:tripId/notes", noteRoutes);
app.use("/api/trips/:tripId/expenses", expenseRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Traveloop API listening on http://localhost:${port}`);
});

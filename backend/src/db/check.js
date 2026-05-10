import dotenv from "dotenv";
import { closePool, query } from "./connection.js";

dotenv.config();

try {
  const result = await query(
    "SELECT current_user, current_database(), inet_server_addr() AS host, inet_server_port() AS port",
  );

  console.log("Database connection OK:");
  console.table(result.rows);
} catch (error) {
  console.error("Database connection failed.");
  console.error(`Message: ${error.message}`);
  console.error("");
  console.error("Fix options:");
  console.error("1. If using local PostgreSQL, update backend/.env DATABASE_URL with your real username/password.");
  console.error("2. If using Docker, run: docker compose up -d db");
  console.error("   Then use: DATABASE_URL=postgresql://traveloop_user:traveloop_pass@localhost:5433/traveloop");
  process.exitCode = 1;
} finally {
  await closePool().catch(() => null);
}

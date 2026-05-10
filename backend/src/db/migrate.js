import dotenv from "dotenv";
import { closePool, query } from "./connection.js";
import { schemaSql } from "./schema.js";

dotenv.config();

try {
  await query(schemaSql);
  console.log("Traveloop database schema is ready.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await closePool();
}

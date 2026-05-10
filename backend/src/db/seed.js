import dotenv from "dotenv";
import { closePool, query } from "./connection.js";
import { schemaSql } from "./schema.js";
import { seedReferenceData } from "./seedData.js";

dotenv.config();

try {
  await query(schemaSql);
  await seedReferenceData(query);
  console.log("Traveloop cities and activities seeded.");
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await closePool();
}

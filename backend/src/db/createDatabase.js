import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Create backend/.env from backend/.env.example first.");
  process.exit(1);
}

const targetUrl = new URL(process.env.DATABASE_URL);
const targetDatabase = targetUrl.pathname.replace("/", "");
const maintenanceUrl = new URL(process.env.DATABASE_URL);
maintenanceUrl.pathname = "/postgres";

const client = new Client({
  connectionString: maintenanceUrl.toString(),
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

try {
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    targetDatabase,
  ]);

  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${targetDatabase.replace(/"/g, '""')}"`);
    console.log(`Created database "${targetDatabase}".`);
  } else {
    console.log(`Database "${targetDatabase}" already exists.`);
  }
} catch (error) {
  console.error("Could not create/check database.");
  console.error(`Message: ${error.message}`);
  console.error("");
  console.error("Use a DATABASE_URL whose user can connect to the postgres maintenance database.");
  console.error("Example for your local install: postgresql://postgres:admin123@localhost:5432/traveloop");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => null);
}

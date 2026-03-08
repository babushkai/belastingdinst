import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: false });
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  // Resolve from /app working directory — works in both dev and Docker
  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  console.log("Running migrations from:", migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

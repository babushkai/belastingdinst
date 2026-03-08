import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: false });
import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");

  console.log("CWD:", process.cwd());
  console.log("Migrations folder:", migrationsFolder);
  console.log("Journal exists:", fs.existsSync(journalPath));
  console.log("Drizzle dir contents:", fs.existsSync(migrationsFolder) ? fs.readdirSync(migrationsFolder) : "DIR NOT FOUND");

  await migrate(db, { migrationsFolder });
  console.log("Migrations complete.");

  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

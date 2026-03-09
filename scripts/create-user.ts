import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/lib/db/schema/users";

const args = process.argv.slice(2);
const emailIdx = args.indexOf("--email");
const passwordIdx = args.indexOf("--password");
const nameIdx = args.indexOf("--name");

if (emailIdx === -1 || passwordIdx === -1) {
  console.error(
    "Usage: tsx scripts/create-user.ts --email <email> --password <password> [--name <name>]",
  );
  process.exit(1);
}

const email = args[emailIdx + 1];
const password = args[passwordIdx + 1];
const name = nameIdx !== -1 ? args[nameIdx + 1] : email.split("@")[0];

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    name,
  });

  console.log(`User created: ${email}`);
  await client.end();
}

main().catch((err) => {
  console.error("Failed to create user:", err);
  process.exit(1);
});

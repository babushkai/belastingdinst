import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";
import { sql, gt, lt, and, eq } from "drizzle-orm";

const MAX_ATTEMPTS = 50;
const WINDOW_MINUTES = 1;

export async function checkLoginRateLimit(
  ip: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(
      and(eq(loginAttempts.ip, ip), gt(loginAttempts.attemptedAt, windowStart)),
    );

  if (result.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: WINDOW_MINUTES * 60 };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(ip: string): Promise<void> {
  await db.insert(loginAttempts).values({ ip });
}

export async function cleanOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, cutoff));
}

import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/bank/encryption";
import { getAccessToken, refreshAccessToken, type GcTokenResponse } from "./client";

function getGcCredentials() {
  const secretId = process.env.GC_SECRET_ID;
  const secretKey = process.env.GC_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new Error(
      "GC_SECRET_ID and GC_SECRET_KEY must be set. Get them at https://bankaccountdata.gocardless.com",
    );
  }
  return { secretId, secretKey };
}

/** Get a fresh access token from env credentials (no stored state needed). */
export async function getFreshAccessToken(): Promise<string> {
  const { secretId, secretKey } = getGcCredentials();
  const tokens = await getAccessToken(secretId, secretKey);
  return tokens.access;
}

/** Get full token set (access + refresh) for initial setup flows. */
export async function getFullTokenSet(): Promise<GcTokenResponse> {
  const { secretId, secretKey } = getGcCredentials();
  return getAccessToken(secretId, secretKey);
}

/**
 * Get a valid access token for a connected bank account.
 * Reads encrypted tokens from DB, refreshes if within 5min of expiry.
 * Falls back to fresh token acquisition if no stored tokens exist.
 *
 * NOTE: Single-user tool — no concurrent refresh protection.
 * If concurrency were added, use a DB advisory lock.
 */
export async function getValidAccessToken(
  bankAccountId: string,
): Promise<string> {
  const [account] = await db
    .select({
      gcAccessTokenEnc: bankAccounts.gcAccessTokenEnc,
      gcRefreshTokenEnc: bankAccounts.gcRefreshTokenEnc,
      gcAccessTokenExpiresAt: bankAccounts.gcAccessTokenExpiresAt,
      gcRefreshTokenExpiresAt: bankAccounts.gcRefreshTokenExpiresAt,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account) throw new Error("Bank account not found");

  const now = new Date();
  const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // If access token exists and still valid
  if (
    account.gcAccessTokenEnc &&
    account.gcAccessTokenExpiresAt &&
    account.gcAccessTokenExpiresAt > fiveMinFromNow
  ) {
    return decrypt(account.gcAccessTokenEnc);
  }

  // Try refresh if refresh token exists and valid
  if (
    account.gcRefreshTokenEnc &&
    account.gcRefreshTokenExpiresAt &&
    account.gcRefreshTokenExpiresAt > now
  ) {
    const refreshToken = decrypt(account.gcRefreshTokenEnc);
    const refreshed = await refreshAccessToken(refreshToken);
    const expiresAt = new Date(
      now.getTime() + refreshed.access_expires * 1000,
    );

    await db
      .update(bankAccounts)
      .set({
        gcAccessTokenEnc: encrypt(refreshed.access),
        gcAccessTokenExpiresAt: expiresAt,
      })
      .where(eq(bankAccounts.id, bankAccountId));

    return refreshed.access;
  }

  // Fall back to fresh token acquisition
  const { secretId, secretKey } = getGcCredentials();
  const tokens = await getAccessToken(secretId, secretKey);
  await storeTokens(bankAccountId, tokens.access, tokens.refresh, tokens.access_expires, tokens.refresh_expires);
  return tokens.access;
}

export async function storeTokens(
  bankAccountId: string,
  access: string,
  refresh: string,
  accessExpiresSeconds: number,
  refreshExpiresSeconds: number,
): Promise<void> {
  const now = new Date();
  await db
    .update(bankAccounts)
    .set({
      gcAccessTokenEnc: encrypt(access),
      gcRefreshTokenEnc: encrypt(refresh),
      gcAccessTokenExpiresAt: new Date(
        now.getTime() + accessExpiresSeconds * 1000,
      ),
      gcRefreshTokenExpiresAt: new Date(
        now.getTime() + refreshExpiresSeconds * 1000,
      ),
    })
    .where(eq(bankAccounts.id, bankAccountId));
}

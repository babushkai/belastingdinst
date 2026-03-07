import { encrypt, decrypt } from "@/lib/bank/encryption";
import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ponto (Isabel Connect) API client.
 * Phase 9 enhancement — not required for MVP.
 *
 * Base URL: https://api.myponto.com
 * Docs: https://documentation.ibanity.com/ponto-connect/api
 */

interface PontoTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export function getAuthorizationUrl(state: string): string {
  const clientId = process.env.PONTO_CLIENT_ID;
  if (!clientId) throw new Error("PONTO_CLIENT_ID not configured");

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/ponto/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "ai",
    state,
  });

  return `https://oauth.myponto.com/oauth2/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<PontoTokens> {
  const res = await fetch("https://api.myponto.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.PONTO_CLIENT_ID!,
      client_secret: process.env.PONTO_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/ponto/callback`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ponto token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function saveTokens(
  bankAccountId: string,
  tokens: PontoTokens,
): Promise<void> {
  const accessEnc = encrypt(tokens.accessToken);
  const refreshEnc = encrypt(tokens.refreshToken);

  await db
    .update(bankAccounts)
    .set({
      pontoAccessTokenEnc: accessEnc,
      pontoRefreshTokenEnc: refreshEnc,
      pontoTokenExpiresAt: tokens.expiresAt,
    })
    .where(eq(bankAccounts.id, bankAccountId));
}

export async function loadTokens(
  bankAccountId: string,
): Promise<PontoTokens | null> {
  const [account] = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account?.pontoAccessTokenEnc || !account?.pontoRefreshTokenEnc) {
    return null;
  }

  return {
    accessToken: decrypt(account.pontoAccessTokenEnc),
    refreshToken: decrypt(account.pontoRefreshTokenEnc),
    expiresAt: account.pontoTokenExpiresAt!,
  };
}

import { readFileSync } from "fs";
import { createSign } from "crypto";
import { encrypt, decrypt } from "@/lib/bank/encryption";
import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type {
  WiseProfile,
  WiseBalance,
  WiseStatementResponse,
} from "./types";

const WISE_API_BASE = "https://api.wise.com";

function getPrivateKey(): string | null {
  const keyEnv = process.env.WISE_PRIVATE_KEY;
  if (keyEnv) return keyEnv.replace(/\\n/g, "\n");

  const keyPath = process.env.WISE_PRIVATE_KEY_PATH;
  if (!keyPath) return null;

  return readFileSync(keyPath, "utf-8");
}

function signOtt(ott: string): string | null {
  const privateKey = getPrivateKey();
  if (!privateKey) return null;
  const sign = createSign("SHA256");
  sign.update(ott);
  sign.end();
  return sign.sign(privateKey, "base64");
}

async function wiseFetch(
  apiToken: string,
  path: string,
  params?: Record<string, string>,
): Promise<Response> {
  const url = new URL(path, WISE_API_BASE);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  // First attempt
  let res = await fetch(url, { headers });

  // Handle SCA challenge: 403 with x-2fa-approval header
  if (res.status === 403) {
    const ott = res.headers.get("x-2fa-approval");
    const approvalResult = res.headers.get("x-2fa-approval-result");
    const body403 = await res.text();

    console.log("[Wise SCA] 403 response:", {
      ott,
      approvalResult,
      body: body403,
      allHeaders: Object.fromEntries(res.headers.entries()),
    });

    if (!ott) {
      throw new Error(`Wise API 403 (no SCA token): ${body403}`);
    }

    const signature = signOtt(ott);
    if (!signature) {
      throw new Error(
        "Wise API requires SCA but no private key configured. " +
        "Set WISE_PRIVATE_KEY or WISE_PRIVATE_KEY_PATH, or register in the Wise app marketplace for OAuth.",
      );
    }

    console.log("[Wise SCA] Retrying with signed OTT:", { ott, signature: signature.slice(0, 20) + "..." });

    res = await fetch(url, {
      headers: {
        ...headers,
        "x-2fa-approval": ott,
        "X-Signature": signature,
      },
    });

    if (!res.ok) {
      const retryBody = await res.text();
      const retryApproval = res.headers.get("x-2fa-approval-result");
      console.log("[Wise SCA] Retry failed:", {
        status: res.status,
        approvalResult: retryApproval,
        body: retryBody,
      });
      throw new Error(`Wise API ${res.status} after SCA: ${retryBody}`);
    }
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Wise API ${res.status}: ${body}`);
  }

  return res;
}

async function wiseRequest<T>(
  apiToken: string,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const res = await wiseFetch(apiToken, path, params);
  return res.json() as Promise<T>;
}

export async function getProfiles(apiToken: string): Promise<WiseProfile[]> {
  return wiseRequest<WiseProfile[]>(apiToken, "/v2/profiles");
}

export async function getBalances(
  apiToken: string,
  profileId: number,
): Promise<WiseBalance[]> {
  return wiseRequest<WiseBalance[]>(
    apiToken,
    `/v4/profiles/${profileId}/balances`,
    { types: "STANDARD" },
  );
}

export async function getStatement(
  apiToken: string,
  profileId: number,
  balanceId: number,
  currency: string,
  intervalStart: Date,
  intervalEnd: Date,
): Promise<WiseStatementResponse> {
  return wiseRequest<WiseStatementResponse>(
    apiToken,
    `/v1/profiles/${profileId}/balance-statements/${balanceId}/statement.json`,
    {
      currency,
      intervalStart: intervalStart.toISOString(),
      intervalEnd: intervalEnd.toISOString(),
      type: "COMPACT",
    },
  );
}

export async function getStatementMT940(
  apiToken: string,
  profileId: number,
  balanceId: number,
  currency: string,
  intervalStart: Date,
  intervalEnd: Date,
): Promise<string> {
  const res = await wiseFetch(
    apiToken,
    `/v1/profiles/${profileId}/balance-statements/${balanceId}/statement.mt940`,
    {
      currency,
      intervalStart: intervalStart.toISOString(),
      intervalEnd: intervalEnd.toISOString(),
    },
  );
  return res.text();
}

export async function saveWiseConfig(
  bankAccountId: string,
  profileId: string,
  accountId: string,
  apiToken: string,
): Promise<void> {
  const tokenEnc = encrypt(apiToken);

  await db
    .update(bankAccounts)
    .set({
      wiseProfileId: profileId,
      wiseAccountId: accountId,
      wiseApiTokenEnc: tokenEnc,
    })
    .where(eq(bankAccounts.id, bankAccountId));
}

export async function loadWiseToken(
  bankAccountId: string,
): Promise<string | null> {
  const [account] = await db
    .select({ wiseApiTokenEnc: bankAccounts.wiseApiTokenEnc })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account?.wiseApiTokenEnc) return null;

  return decrypt(account.wiseApiTokenEnc);
}

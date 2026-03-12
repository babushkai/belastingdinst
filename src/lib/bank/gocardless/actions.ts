"use server";

import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  listInstitutions,
  createRequisition,
  getRequisition,
  getAccountDetails,
  deleteRequisition,
  type GcInstitution,
} from "./client";
import { getFreshAccessToken, getFullTokenSet, storeTokens } from "./token-manager";
import { syncGoCardlessAccount } from "./importer";
import type { ImportResult } from "../types";

export async function listDutchInstitutions(): Promise<GcInstitution[]> {
  const token = await getFreshAccessToken();
  return listInstitutions("nl", token);
}

export async function initiateGcRequisition(
  institutionId: string,
): Promise<{ link: string }> {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL must be set for GoCardless redirect");
  }
  const redirectUrl = `${baseUrl}/api/bank/gocardless/callback`;

  const token = await getFreshAccessToken();
  const requisition = await createRequisition(
    institutionId,
    redirectUrl,
    token,
  );

  return { link: requisition.link };
}

export async function handleGcCallback(
  requisitionId: string,
): Promise<void> {
  const tokens = await getFullTokenSet();

  const requisition = await getRequisition(requisitionId, tokens.access);

  // Create a bank_accounts row for each linked account
  for (const gcAccountId of requisition.accounts) {
    const details = await getAccountDetails(gcAccountId, tokens.access);

    // Upsert by IBAN — if account already exists, update GC fields
    const [existing] = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(eq(bankAccounts.iban, details.iban))
      .limit(1);

    if (existing) {
      await db
        .update(bankAccounts)
        .set({
          gcRequisitionId: requisitionId,
          gcAccountId: gcAccountId,
          bankName: details.ownerName ?? details.name ?? undefined,
        })
        .where(eq(bankAccounts.id, existing.id));

      await storeTokens(
        existing.id,
        tokens.access,
        tokens.refresh,
        tokens.access_expires,
        tokens.refresh_expires,
      );
    } else {
      const [newAccount] = await db
        .insert(bankAccounts)
        .values({
          iban: details.iban,
          bankName: details.name ?? null,
          displayName: details.ownerName ?? details.name ?? details.iban,
          gcRequisitionId: requisitionId,
          gcAccountId: gcAccountId,
        })
        .returning();

      await storeTokens(
        newAccount.id,
        tokens.access,
        tokens.refresh,
        tokens.access_expires,
        tokens.refresh_expires,
      );
    }
  }

  revalidatePath("/bank");
}

export async function triggerGcSync(
  bankAccountId: string,
): Promise<ImportResult> {
  const result = await syncGoCardlessAccount(bankAccountId);
  revalidatePath("/bank");
  revalidatePath("/bank/transactions");
  return result;
}

export async function disconnectGcAccount(
  bankAccountId: string,
): Promise<void> {
  const [account] = await db
    .select({
      gcRequisitionId: bankAccounts.gcRequisitionId,
      gcAccessTokenEnc: bankAccounts.gcAccessTokenEnc,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account) throw new Error("Account niet gevonden");

  // Revoke consent at GoCardless
  if (account.gcRequisitionId) {
    try {
      const token = await getFreshAccessToken();
      await deleteRequisition(account.gcRequisitionId, token);
    } catch {
      // Best effort — still clear local state
    }
  }

  await db
    .update(bankAccounts)
    .set({
      gcRequisitionId: null,
      gcAccountId: null,
      gcAccessTokenEnc: null,
      gcRefreshTokenEnc: null,
      gcAccessTokenExpiresAt: null,
      gcRefreshTokenExpiresAt: null,
    })
    .where(eq(bankAccounts.id, bankAccountId));

  revalidatePath("/bank");
}

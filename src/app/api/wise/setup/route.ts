import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getProfiles, getBalances, saveWiseConfig } from "@/lib/wise/client";
import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { apiToken } = await req.json();

  if (!apiToken || typeof apiToken !== "string") {
    return NextResponse.json(
      { error: "API token is required" },
      { status: 400 },
    );
  }

  // Validate the token by fetching profiles
  let profiles;
  try {
    profiles = await getProfiles(apiToken);
  } catch {
    return NextResponse.json(
      { error: "Invalid API token — could not connect to Wise" },
      { status: 400 },
    );
  }

  const businessProfile = profiles.find((p) => p.type === "BUSINESS");
  if (!businessProfile) {
    return NextResponse.json(
      { error: "No Wise Business profile found" },
      { status: 400 },
    );
  }

  // Get balances to find the EUR account
  const balances = await getBalances(apiToken, businessProfile.id);
  const eurBalance = balances.find((b) => b.currency === "EUR");
  if (!eurBalance) {
    return NextResponse.json(
      { error: "No EUR balance found on Wise Business account" },
      { status: 400 },
    );
  }

  // Find existing bank account by profileId or IBAN, or create one
  const wiseIban = `WISE-${businessProfile.id}`;
  const [existing] = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(
      or(
        eq(bankAccounts.wiseProfileId, String(businessProfile.id)),
        eq(bankAccounts.iban, wiseIban),
      )!,
    )
    .limit(1);

  let bankAccountId: string;

  if (existing) {
    bankAccountId = existing.id;
  } else {
    const [created] = await db
      .insert(bankAccounts)
      .values({
        iban: wiseIban,
        bankName: "Wise",
        displayName: `Wise - ${businessProfile.fullName}`,
      })
      .returning({ id: bankAccounts.id });
    bankAccountId = created.id;
  }

  await saveWiseConfig(
    bankAccountId,
    String(businessProfile.id),
    String(eurBalance.id),
    apiToken,
  );

  return NextResponse.json({
    bankAccountId,
    profileId: businessProfile.id,
    profileName: businessProfile.fullName,
    balanceId: eurBalance.id,
    currency: eurBalance.currency,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { importBankFile } from "@/lib/bank/importers/file-import";
import { db } from "@/lib/db";
import { bankAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const rawBankAccountId = formData.get("bankAccountId") as string | null;

  if (!file || !rawBankAccountId) {
    return NextResponse.json(
      { error: "Bestand en bankrekening zijn verplicht" },
      { status: 400 },
    );
  }

  const parsed = z.string().uuid().safeParse(rawBankAccountId);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ongeldig bankrekening ID" },
      { status: 400 },
    );
  }
  const bankAccountId = parsed.data;

  const [account] = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.id, bankAccountId))
    .limit(1);

  if (!account) {
    return NextResponse.json(
      { error: "Bankrekening niet gevonden" },
      { status: 404 },
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Bestand is te groot (max 10MB)" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importBankFile(bankAccountId, buffer, file.name);

  return NextResponse.json(result);
}

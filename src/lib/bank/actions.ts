"use server";

import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const VALID_BTW_CODES = ["0", "9", "21"] as const;

const CategoriseSchema = z.object({
  btwCode: z
    .string()
    .nullable()
    .refine(
      (v) => v === null || (VALID_BTW_CODES as readonly string[]).includes(v),
      { message: "Invalid BTW code" },
    ),
});

export async function categoriseTransaction(
  id: string,
  input: { btwCode: string | null },
) {
  const data = CategoriseSchema.parse(input);

  const [tx] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  if (!tx) throw new Error("Transactie niet gevonden");

  await db
    .update(transactions)
    .set({ btwCode: data.btwCode })
    .where(eq(transactions.id, id));

  revalidatePath("/bank/transactions");
}

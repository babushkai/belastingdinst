"use server";

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SettingsSchema = z.object({
  companyName: z.string().min(1),
  kvkNumber: z.string().optional(),
  btwNumber: z.string().min(1),
  iban: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressPostcode: z.string().optional(),
  invoicePrefix: z.string().default("F"),
  korActive: z.coerce.boolean().default(false),
  defaultBtwRate: z.coerce.number().int().default(21),
});

export async function getSettings() {
  const [row] = await db.select().from(settings).limit(1);
  return row ?? null;
}

export async function upsertSettings(formData: FormData) {
  const data = SettingsSchema.parse({
    companyName: formData.get("companyName"),
    kvkNumber: formData.get("kvkNumber") || undefined,
    btwNumber: formData.get("btwNumber"),
    iban: formData.get("iban") || undefined,
    addressStreet: formData.get("addressStreet") || undefined,
    addressCity: formData.get("addressCity") || undefined,
    addressPostcode: formData.get("addressPostcode") || undefined,
    invoicePrefix: formData.get("invoicePrefix") || "F",
    korActive: formData.get("korActive") === "on",
    defaultBtwRate: formData.get("defaultBtwRate") || 21,
  });

  const existing = await db.select().from(settings).limit(1);

  if (existing.length > 0) {
    await db
      .update(settings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(settings.id, 1));
  } else {
    await db.insert(settings).values({ id: 1, ...data });
  }

  revalidatePath("/settings");
}

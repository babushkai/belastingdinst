import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { syncWiseAccount } from "@/lib/wise/sync";
import { z } from "zod";

const syncSchema = z.object({
  bankAccountId: z.string().uuid(),
  intervalStart: z.string().datetime(),
  intervalEnd: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { bankAccountId, intervalStart, intervalEnd } = parsed.data;

  const result = await syncWiseAccount(
    bankAccountId,
    new Date(intervalStart),
    new Date(intervalEnd),
  );

  return NextResponse.json(result);
}

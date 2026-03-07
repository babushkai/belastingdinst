import { NextRequest, NextResponse } from "next/server";
import { searchContacts } from "@/lib/contacts/queries";
import { auth } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const results = await searchContacts(q);
  return NextResponse.json(
    results.map((c) => ({ id: c.id, companyName: c.companyName })),
  );
}

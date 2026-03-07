import { NextRequest, NextResponse } from "next/server";
import { createInvoice } from "@/lib/invoices/actions";
import { auth } from "@/lib/auth/config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const invoice = await createInvoice(body);
    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Onbekende fout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { handleGcCallback } from "@/lib/bank/gocardless/actions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || !UUID_RE.test(ref)) {
    return NextResponse.redirect(
      new URL("/bank/gocardless?error=invalid_ref", request.url),
    );
  }

  try {
    await handleGcCallback(ref);
    return NextResponse.redirect(
      new URL("/bank/gocardless?connected=1", request.url),
    );
  } catch (err) {
    console.error("GoCardless callback error:", err);
    return NextResponse.redirect(
      new URL("/bank/gocardless?error=api_error", request.url),
    );
  }
}

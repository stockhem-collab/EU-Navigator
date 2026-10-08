import { NextResponse } from "next/server";
import { amountStats } from "@/lib/imported/server";
import { isSector } from "@/lib/imported/request";

// What projects in a programme and theme have actually been granted: span
// and median of the EU contribution, for the match cards. Takes the
// idea's theme and the programmes of the calls it was matched against.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { sector?: unknown; programIds?: unknown } | null;
  if (!body || !isSector(body.sector) || !Array.isArray(body.programIds)) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  const sector = body.sector;
  const programIds = [...new Set(body.programIds.filter((id): id is string => typeof id === "string"))].slice(0, 50);
  return NextResponse.json({ stats: programIds.map((id) => amountStats(id, sector)) });
}

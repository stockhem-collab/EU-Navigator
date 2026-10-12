import { NextResponse } from "next/server";
import { searchPartners } from "@/lib/imported/server";

// Partner search over the organisations in the imported projects
// (Kohesio, Keep.eu, CORDIS, ESF-projektbanken), filtered and paged on the
// server like /api/referensprojekt.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const number = (key: string) => {
    const n = Number(params.get(key));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return NextResponse.json(
    searchPartners({
      q: params.get("q"),
      type: params.get("type"),
      country: params.get("country"),
      program: params.get("program"),
      sector: params.get("sector"),
      period: params.get("period"),
      role: params.get("role"),
      own: params.get("own"),
      page: number("page"),
      pageSize: number("pageSize"),
    })
  );
}

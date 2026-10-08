import { NextResponse } from "next/server";
import { listReferenceProjects } from "@/lib/imported/server";

// The imported reference projects (Kohesio, Keep.eu, CORDIS,
// ESF-projektbanken), filtered and paged on the server so the browser only
// gets one page at a time.
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const number = (key: string) => {
    const n = Number(params.get(key));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  return NextResponse.json(
    listReferenceProjects({
      source: params.get("source"),
      program: params.get("program"),
      country: params.get("country"),
      year: number("year") ?? null,
      q: params.get("q"),
      page: number("page"),
      pageSize: number("pageSize"),
    })
  );
}

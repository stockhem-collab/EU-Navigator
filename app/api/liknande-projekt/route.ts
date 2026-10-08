import { NextResponse } from "next/server";
import { findSimilar } from "@/lib/imported/server";
import { parseIdea } from "@/lib/imported/request";

// Similar imported projects and partner suggestions for a project idea.
// The idea lives only in the browser (localStorage), so its fields come in
// the request body; the imported data stays on the server.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const idea = parseIdea(await request.json().catch(() => null));
  if (!idea) return NextResponse.json({ error: "invalid-idea" }, { status: 400 });
  return NextResponse.json(findSimilar(idea));
}

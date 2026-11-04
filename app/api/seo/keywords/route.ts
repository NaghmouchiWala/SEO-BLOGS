import { NextRequest, NextResponse } from "next/server";
import { keywordIdeas } from "@/lib/keywords";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "fr";
  if (q.length < 2) return NextResponse.json({ error: "Type at least 2 characters" }, { status: 400 });
  try {
    return NextResponse.json(await keywordIdeas(q, lang));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

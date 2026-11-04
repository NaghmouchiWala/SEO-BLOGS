import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// Researched link leads; edited by hand in data/opportunities.json.
export function GET() {
  try {
    return NextResponse.json(JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "opportunities.json"), "utf8")));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

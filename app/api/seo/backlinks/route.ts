import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// History written weekly by scripts/backlink-snapshot.mjs (cron on the VPS).
export function GET() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".backlink-history.json"), "utf8");
    return NextResponse.json({ history: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ history: [] });
  }
}

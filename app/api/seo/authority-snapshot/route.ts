import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

// DR/UR snapshot collected from da-checker.org (the free tool is rate-limited,
// so it is updated by hand / by Claude rather than live). See data/authority-snapshot.json.
export function GET() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "authority-snapshot.json"), "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

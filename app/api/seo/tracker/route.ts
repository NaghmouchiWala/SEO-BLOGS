import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Which backlink tasks the team has started or finished. A small JSON file next to
// the app (git-ignored), shared by everyone who signs in.
const FILE = path.join(process.cwd(), ".backlink-tracker.json");
const STATES = ["todo", "doing", "done", "skip"];

function read(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function GET() {
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  try {
    const { id, state } = await req.json();
    if (typeof id !== "string" || !/^[a-z0-9-]{1,60}$/.test(id) || !STATES.includes(state)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const data = read();
    if (state === "todo") delete data[id];
    else data[id] = state;
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

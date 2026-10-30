import { NextRequest, NextResponse } from "next/server";
import { runGenerateNow } from "@/lib/generate";
import { getSite } from "@/lib/sites";

// In-memory status tracker (fine for a single-process PM2 app, single admin
// user) so the client can poll instead of holding one long HTTP request
// open for the full 10-60s generation run.
type RunStatus = { state: "running" | "done" | "error"; output?: string; success?: boolean };
const runs = new Map<string, RunStatus>();

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ siteKey: string }> }
) {
  const { siteKey } = await params;
  const site = getSite(siteKey);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });

  if (runs.get(siteKey)?.state === "running") {
    return NextResponse.json({ error: "Already running for this site" }, { status: 409 });
  }

  runs.set(siteKey, { state: "running" });
  runGenerateNow(siteKey)
    .then((result) => {
      runs.set(siteKey, { state: "done", output: result.output, success: result.success });
    })
    .catch((err) => {
      runs.set(siteKey, { state: "error", output: String(err) });
    });

  return NextResponse.json({ started: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteKey: string }> }
) {
  const { siteKey } = await params;
  const status = runs.get(siteKey) ?? { state: "done" as const };
  return NextResponse.json(status);
}

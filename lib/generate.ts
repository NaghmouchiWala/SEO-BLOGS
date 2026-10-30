import { spawn } from "child_process";
import { getSite } from "./sites";

export type GenerateResult = {
  siteKey: string;
  success: boolean;
  output: string;
  startedAt: string;
  finishedAt: string;
};

// Runs the SAME shell script the daily cron already runs for this site —
// not a reimplementation — so "Generate now" behaves identically to the
// scheduled run (same env file, same RSS/Groq/Unsplash pipeline, same
// link-enforcement and dedup logic).
export function runGenerateNow(siteKey: string): Promise<GenerateResult> {
  const site = getSite(siteKey);
  if (!site || !site.generateScript || !site.generateArgs) {
    return Promise.reject(new Error(`No generate script configured for site "${siteKey}"`));
  }

  const startedAt = new Date().toISOString();
  return new Promise((resolve) => {
    const child = spawn(site.generateScript!, site.generateArgs!, {
      cwd: "/home/ubuntu",
      timeout: 1000 * 60 * 5, // 5 minutes — generous for RSS+Groq+Unsplash+git
    });

    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk.toString()));
    child.stderr.on("data", (chunk) => (output += chunk.toString()));

    child.on("close", (code) => {
      resolve({
        siteKey,
        success: code === 0,
        output,
        startedAt,
        finishedAt: new Date().toISOString(),
      });
    });

    child.on("error", (err) => {
      resolve({
        siteKey,
        success: false,
        output: output + "\n" + String(err),
        startedAt,
        finishedAt: new Date().toISOString(),
      });
    });
  });
}

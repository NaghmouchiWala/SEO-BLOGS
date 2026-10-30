import fs from "fs";

export type CronHealth = {
  siteKey: string;
  lastRunAt: string | null;
  lastRunSucceeded: boolean | null;
  lastRunSummary: string | null;
};

const LOG_FILES: Record<string, string> = {
  points: "/home/ubuntu/points-tn-blog-generate-cron.log",
};
const MULTISITE_LOG = "/home/ubuntu/multisite-generate-cron.log";

function parseLastRunFromLog(log: string, runHeaderPattern: RegExp): CronHealth["lastRunAt"] {
  const matches = [...log.matchAll(runHeaderPattern)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1];
}

function lastRunBlock(log: string, startPattern: RegExp): string | null {
  const matches = [...log.matchAll(startPattern)];
  if (matches.length === 0) return null;
  const lastMatch = matches[matches.length - 1];
  const startIdx = lastMatch.index!;
  // Block runs until the next run header (any site) or end of file.
  const rest = log.slice(startIdx + lastMatch[0].length);
  const nextHeaderIdx = rest.search(/={5,} generate/);
  return nextHeaderIdx === -1 ? log.slice(startIdx) : log.slice(startIdx, startIdx + lastMatch[0].length + nextHeaderIdx);
}

export function getCronHealth(siteKey: string): CronHealth {
  if (siteKey === "points") {
    const path = LOG_FILES.points;
    if (!fs.existsSync(path)) return { siteKey, lastRunAt: null, lastRunSucceeded: null, lastRunSummary: null };
    const log = fs.readFileSync(path, "utf8");
    const lastRunAt = parseLastRunFromLog(log, /=+ generate (\S+) =+/g);
    const block = lastRunBlock(log, /=+ generate \S+ =+/g);
    const succeeded = block ? !block.includes("Article generation failed") : null;
    const summary = block
      ? block.includes("Skipping")
        ? "Skipped (under 2-day minimum)"
        : block.includes("Wrote ")
          ? "Published new article"
          : "See log"
      : null;
    return { siteKey, lastRunAt, lastRunSucceeded: succeeded, lastRunSummary: summary };
  }

  if (!fs.existsSync(MULTISITE_LOG)) {
    return { siteKey, lastRunAt: null, lastRunSucceeded: null, lastRunSummary: null };
  }
  const log = fs.readFileSync(MULTISITE_LOG, "utf8");
  const pattern = new RegExp(`=+ generate ${siteKey} (\\S+) =+`, "g");
  const lastRunAt = parseLastRunFromLog(log, pattern);
  const block = lastRunBlock(log, new RegExp(`=+ generate ${siteKey} \\S+ =+`, "g"));
  const succeeded = block ? block.includes("Done. Photo by") : null;
  const summary = block
    ? (() => {
        const m = block.match(/Source story: \[([^\]]+)\] (.+)/);
        return m ? `New article from ${m[1]}: ${m[2].slice(0, 60)}` : "See log";
      })()
    : null;

  return { siteKey, lastRunAt, lastRunSucceeded: succeeded, lastRunSummary: summary };
}

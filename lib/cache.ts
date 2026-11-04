// Tiny disk cache shared by the search-data clients (GSC, Bing, Open PageRank).
// Keeps reloads from re-hitting rate-limited APIs. Failures are never cached.
import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), ".search-cache.json");
type Store = Record<string, { at: number; value: unknown }>;

function read(): Store {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export async function cached<T>(key: string, ttlMs: number, force: boolean, fn: () => Promise<T>): Promise<T> {
  const store = read();
  const hit = store[key];
  if (!force && hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn(); // throws on failure -> nothing cached
  const fresh = read();
  fresh[key] = { at: Date.now(), value };
  try {
    fs.writeFileSync(FILE, JSON.stringify(fresh));
  } catch {
    /* best effort */
  }
  return value;
}

export const HOUR = 3600 * 1000;

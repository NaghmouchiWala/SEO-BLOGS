// Keeps <title> and meta description inside the lengths search engines show
// without truncating (title ~60 chars, description ~160).

const BRAND = "Points.tn";

function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return base.replace(/[\s,;:.\-–—]+$/, "") + "…";
}

/** "Title — Points.tn" when it fits, otherwise the title alone, trimmed to ~60 chars. */
export function seoTitle(title: string): string {
  const withBrand = `${title} — ${BRAND}`;
  if (withBrand.length <= 62) return withBrand;
  return cutAtWord(title, 60);
}

/** Meta description trimmed to 160 chars at a word boundary. */
export function seoDescription(description: string): string {
  return cutAtWord(description.replace(/\s+/g, " ").trim(), 160);
}

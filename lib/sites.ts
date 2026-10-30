// Registry of every site the dashboard manages: points.tn (the Next.js/MDX
// blog, git-based) and the 10 satellite sites (static WordPress-export
// HTML, no database, edited by direct file writes). Paths match exactly
// what the generator scripts on this VPS already use.

export type SiteKind = "points" | "static";
export type ThemeFamily =
  | "twentytwentyfour"
  | "looks"
  | "responsiveblogily"
  | "blacklite"
  | "sento"
  | "twentyten";

export type SiteConfig = {
  key: string;
  domain: string;
  displayName: string;
  kind: SiteKind;
  // Static sites only:
  siteRoot?: string;
  categorySlug?: string;
  themeFamily?: ThemeFamily;
  generateScript?: string; // shell command to run for "Generate now"
  generateArgs?: string[];
  // points.tn only:
  repoRoot?: string;
  deployScript?: string;
};

export const SITES: Record<string, SiteConfig> = {
  points: {
    key: "points",
    domain: "points.tn",
    displayName: "Points.tn",
    kind: "points",
    repoRoot: "/home/ubuntu/points-tn-blog",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/generate-points-tn-article.sh"],
    deployScript: "/home/ubuntu/deploy-points-tn-blog.sh",
  },
  soukbladi: {
    key: "soukbladi",
    domain: "soukbladi.tn",
    displayName: "Souk Bladi",
    kind: "static",
    siteRoot: "/var/www/copied-sites/soukbladi.tn",
    categorySlug: "blog",
    themeFamily: "twentytwentyfour",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "soukbladi"],
  },
  generaldesign: {
    key: "generaldesign",
    domain: "generaldesign.tn",
    displayName: "General Design",
    kind: "static",
    siteRoot: "/var/www/copied-sites/generaldesign.tn",
    categorySlug: "blog",
    themeFamily: "twentytwentyfour",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "generaldesign"],
  },
  lequotidien: {
    key: "lequotidien",
    domain: "lequotidien.tn",
    displayName: "Le Quotidien",
    kind: "static",
    siteRoot: "/var/www/copied-sites/lequotidien.tn",
    categorySlug: "my-blog",
    themeFamily: "twentytwentyfour",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "lequotidien"],
  },
  snitnord: {
    key: "snitnord",
    domain: "snitnord.tn",
    displayName: "Snit Nord",
    kind: "static",
    siteRoot: "/var/www/copied-sites/snitnord.tn",
    categorySlug: "blog",
    themeFamily: "twentytwentyfour",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "snitnord"],
  },
  webline: {
    key: "webline",
    domain: "webline.tn",
    displayName: "Web Line",
    kind: "static",
    siteRoot: "/var/www/copied-sites/webline.tn",
    categorySlug: "blog",
    themeFamily: "twentytwentyfour",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "webline"],
  },
  chedmed: {
    key: "chedmed",
    domain: "chedmed.tn",
    displayName: "Chedmed",
    kind: "static",
    siteRoot: "/var/www/copied-sites/chedmed.tn",
    categorySlug: "blog",
    themeFamily: "looks",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "chedmed"],
  },
  openmosques: {
    key: "openmosques",
    domain: "openmosques.tn",
    displayName: "Open Mosques",
    kind: "static",
    siteRoot: "/var/www/copied-sites/openmosques.tn",
    categorySlug: "blog",
    themeFamily: "responsiveblogily",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "openmosques"],
  },
  pcs: {
    key: "pcs",
    domain: "pcs.tn",
    displayName: "PCS",
    kind: "static",
    siteRoot: "/var/www/copied-sites/pcs.tn",
    categorySlug: "blog",
    themeFamily: "blacklite",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "pcs"],
  },
  smartimpact: {
    key: "smartimpact",
    domain: "smartimpact.tn",
    displayName: "Smart Impact",
    kind: "static",
    siteRoot: "/var/www/copied-sites/smartimpact.tn",
    categorySlug: "blog",
    themeFamily: "sento",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "smartimpact"],
  },
  yatout: {
    key: "yatout",
    domain: "yatout.tn",
    displayName: "Yatout",
    kind: "static",
    siteRoot: "/var/www/copied-sites/yatout.tn",
    categorySlug: "blog",
    themeFamily: "twentyten",
    generateScript: "/bin/bash",
    generateArgs: ["/home/ubuntu/run-multisite-generator.sh", "yatout"],
  },
};

export const SITE_LIST = Object.values(SITES);

export function getSite(key: string): SiteConfig | undefined {
  return SITES[key];
}

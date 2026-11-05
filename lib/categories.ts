// Sections of the site, modelled on the sections of Tunisian news portals.
// Articles store a human-readable label in their frontmatter ("category");
// everything else (URLs, covers, colours) works from the slug.
export type CategorySlug = "national" | "international" | "sport" | "culture" | "regions" | "tech" | "divers";

export const CATEGORIES: { slug: CategorySlug; fr: string; en: string }[] = [
  { slug: "national", fr: "Actualité nationale", en: "National news" },
  { slug: "international", fr: "International", en: "International" },
  { slug: "sport", fr: "Sport", en: "Sport" },
  { slug: "culture", fr: "Culture", en: "Culture" },
  { slug: "regions", fr: "Régions", en: "Regions" },
  { slug: "tech", fr: "Tech", en: "Tech" },
  { slug: "divers", fr: "Divers", en: "Miscellaneous" },
];

// Labels used by articles published before the news redesign (all tech/AI/e-commerce) → Tech.
const LEGACY_TO_TECH = [
  "Intelligence Artificielle",
  "Artificial Intelligence",
  "SEO & E-commerce",
  "Business & Innovation",
  "Tech Education & Careers",
  "Formation & Carrière Tech",
  "E-commerce & Bons plans",
  "E-commerce & Deals",
  "Électroménager & High-Tech",
  "Appliances & Gadgets",
];

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function categorySlug(label: string): CategorySlug {
  if (LEGACY_TO_TECH.includes(label)) return "tech";
  const hit = CATEGORIES.find((c) => c.fr === label || c.en === label);
  return hit ? hit.slug : "divers";
}

export function categoryLabel(slug: CategorySlug, locale: "fr" | "en"): string {
  return CATEGORIES.find((c) => c.slug === slug)![locale];
}

export function imageForCategory(category: string): string {
  return `/images/cover-${categorySlug(category)}.svg`;
}

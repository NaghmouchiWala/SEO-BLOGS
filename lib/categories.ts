export type CategoryKey = "ai" | "seo" | "business" | "ecommerce";

export const categoryImages: Record<CategoryKey, string> = {
  ai: "/images/cover-ai.svg",
  seo: "/images/cover-seo.svg",
  business: "/images/cover-business.svg",
  ecommerce: "/images/cover-ecommerce.svg",
};

const categoryKeyByLabel: Record<string, CategoryKey> = {
  "Intelligence Artificielle": "ai",
  "Artificial Intelligence": "ai",
  "SEO & E-commerce": "seo",
  "Business & Innovation": "business",
  "Tech Education & Careers": "business",
  "Formation & Carrière Tech": "business",
  "E-commerce & Bons plans": "ecommerce",
  "E-commerce & Deals": "ecommerce",
};

export function imageForCategory(category: string): string {
  const key = categoryKeyByLabel[category] ?? "ai";
  return categoryImages[key];
}

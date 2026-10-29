export type CategoryKey = "ai" | "seo" | "business" | "ecommerce" | "appliances";

export const categoryImages: Record<CategoryKey, string> = {
  ai: "/images/cover-ai.svg",
  seo: "/images/cover-seo.svg",
  business: "/images/cover-business.svg",
  ecommerce: "/images/cover-ecommerce.svg",
  appliances: "/images/cover-appliances.svg",
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
  "Électroménager & High-Tech": "appliances",
  "Appliances & Gadgets": "appliances",
};

export function imageForCategory(category: string): string {
  const key = categoryKeyByLabel[category] ?? "ai";
  return categoryImages[key];
}

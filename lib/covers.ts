import { imageForCategory } from "./categories";

const coverBySlug: Record<string, string> = {
  // custom AI vs generic
  "ia-sur-mesure-vs-ia-generique-pme": "/images/covers/custom-ai-models.svg",
  "custom-ai-models-vs-generic-chatbots": "/images/covers/custom-ai-models.svg",

  // SEO automation at scale
  "seo-catalogue-produits-automatisation-ia": "/images/covers/seo-automation.svg",
  "seo-automation-product-catalogs-at-scale": "/images/covers/seo-automation.svg",

  // Tunisia-France bridge
  "startup-tunisienne-ia-expansion-france": "/images/covers/tunisia-france-bridge.svg",
  "tunisian-ai-startup-bridge-to-france": "/images/covers/tunisia-france-bridge.svg",

  // Go2Code general training
  "go2code-former-talents-ia-tunisie": "/images/covers/go2code-training.svg",
  "go2code-tunisia-ai-talent-pipeline": "/images/covers/go2code-training.svg",

  // Tdiscount / smart shopping
  "tdiscount-acheter-malin-en-ligne-tunisie": "/images/covers/tdiscount-shopping.svg",
  "smart-online-shopping-tunisia-discount-sites": "/images/covers/tdiscount-shopping.svg",

  // DronIA / agriculture
  "ia-agriculture-dronia-detection-precoce": "/images/covers/dronia-agriculture.svg",
  "drone-ai-early-crop-disease-detection": "/images/covers/dronia-agriculture.svg",

  // Fraud detection / fintech
  "detection-fraude-ia-fintech-scoring-risque": "/images/covers/fraud-detection.svg",
  "ai-fraud-detection-fintech-risk-scoring": "/images/covers/fraud-detection.svg",

  // Cybersecurity / cloud certifications
  "go2code-cybersecurite-cloud-certifications-carriere": "/images/covers/cybersecurity-certs.svg",
  "cybersecurity-cloud-certifications-that-matter": "/images/covers/cybersecurity-certs.svg",

  // Price comparison electronics
  "comparer-prix-electronique-avant-achat-tunisie": "/images/covers/price-comparison.svg",
  "how-to-compare-electronics-prices-before-buying": "/images/covers/price-comparison.svg",

  // GEO / AI search
  "geo-referencement-ia-chatgpt-perplexity": "/images/covers/geo-ai-search.svg",
  "geo-generative-engine-optimization-explained": "/images/covers/geo-ai-search.svg",
};

export function coverForArticle(slug: string, category: string): string {
  return coverBySlug[slug] ?? imageForCategory(category);
}

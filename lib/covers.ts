import { imageForCategory } from "./categories";

const coverBySlug: Record<string, string> = {
  // custom AI vs generic
  "ia-sur-mesure-vs-ia-generique-pme": "/images/photos/custom-ai-models.jpg",
  "custom-ai-models-vs-generic-chatbots": "/images/photos/custom-ai-models.jpg",

  // SEO automation at scale
  "seo-catalogue-produits-automatisation-ia": "/images/photos/seo-automation.jpg",
  "seo-automation-product-catalogs-at-scale": "/images/photos/seo-automation.jpg",

  // Tunisia-France bridge
  "startup-tunisienne-ia-expansion-france": "/images/photos/tunisia-france-bridge.jpg",
  "tunisian-ai-startup-bridge-to-france": "/images/photos/tunisia-france-bridge.jpg",

  // Go2Code general training
  "go2code-former-talents-ia-tunisie": "/images/photos/go2code-training.jpg",
  "go2code-tunisia-ai-talent-pipeline": "/images/photos/go2code-training.jpg",

  // Tdiscount / smart shopping
  "tdiscount-acheter-malin-en-ligne-tunisie": "/images/photos/tdiscount-shopping.jpg",
  "smart-online-shopping-tunisia-discount-sites": "/images/photos/tdiscount-shopping.jpg",

  // DronIA / agriculture
  "ia-agriculture-dronia-detection-precoce": "/images/photos/dronia-agriculture.jpg",
  "drone-ai-early-crop-disease-detection": "/images/photos/dronia-agriculture.jpg",

  // Fraud detection / fintech
  "detection-fraude-ia-fintech-scoring-risque": "/images/photos/fraud-detection.jpg",
  "ai-fraud-detection-fintech-risk-scoring": "/images/photos/fraud-detection.jpg",

  // Cybersecurity / cloud certifications
  "go2code-cybersecurite-cloud-certifications-carriere": "/images/photos/cybersecurity-certs.jpg",
  "cybersecurity-cloud-certifications-that-matter": "/images/photos/cybersecurity-certs.jpg",

  // Price comparison electronics
  "comparer-prix-electronique-avant-achat-tunisie": "/images/photos/price-comparison.jpg",
  "how-to-compare-electronics-prices-before-buying": "/images/photos/price-comparison.jpg",

  // GEO / AI search
  "geo-referencement-ia-chatgpt-perplexity": "/images/photos/geo-ai-search.jpg",
  "geo-generative-engine-optimization-explained": "/images/photos/geo-ai-search.jpg",
};

export function coverForArticle(slug: string, category: string): string {
  return coverBySlug[slug] ?? imageForCategory(category);
}

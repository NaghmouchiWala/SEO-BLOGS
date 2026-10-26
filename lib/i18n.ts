export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

type Dictionary = {
  siteName: string;
  tagline: string;
  nav: { home: string; blog: string; about: string };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    latestArticles: string;
    readMore: string;
    minRead: string;
  };
  blog: {
    title: string;
    subtitle: string;
    minRead: string;
  };
  article: {
    backToBlog: string;
    publishedOn: string;
    shareTitle: string;
    relatedTitle: string;
  };
  footer: {
    description: string;
    sitesTitle: string;
    legal: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    siteName: "Points.tn",
    tagline: "Idées, outils et intelligence artificielle pour les entreprises tunisiennes qui visent le monde.",
    nav: { home: "Accueil", blog: "Articles", about: "À propos" },
    home: {
      heroTitle: "L'intelligence artificielle expliquée pour de vrais résultats business.",
      heroSubtitle:
        "Points.tn décrypte l'IA, le e-commerce et la tech appliqués aux entreprises, avec un regard particulier sur ce qui se construit entre la Tunisie et la France.",
      heroCta: "Lire les articles",
      latestArticles: "Derniers articles",
      readMore: "Lire l'article",
      minRead: "min de lecture",
    },
    blog: {
      title: "Tous les articles",
      subtitle: "Analyses, guides et retours d'expérience sur l'IA, l'automatisation et la croissance digitale.",
      minRead: "min",
    },
    article: {
      backToBlog: "Retour aux articles",
      publishedOn: "Publié le",
      shareTitle: "Partager cet article",
      relatedTitle: "À lire aussi",
    },
    footer: {
      description:
        "Points.tn est un média indépendant qui explore l'intelligence artificielle, le digital et l'innovation technologique, en Tunisie et à l'international.",
      sitesTitle: "Nos recommandations",
      legal: "Tous droits réservés.",
    },
  },
  en: {
    siteName: "Points.tn",
    tagline: "Ideas, tools and artificial intelligence for businesses that think beyond borders.",
    nav: { home: "Home", blog: "Articles", about: "About" },
    home: {
      heroTitle: "Artificial intelligence explained for real business outcomes.",
      heroSubtitle:
        "Points.tn breaks down AI, e-commerce and technology for businesses, with a close look at what's being built between Tunisia, France and the wider world.",
      heroCta: "Read the articles",
      latestArticles: "Latest articles",
      readMore: "Read article",
      minRead: "min read",
    },
    blog: {
      title: "All articles",
      subtitle: "Analysis, guides and field notes on AI, automation and digital growth.",
      minRead: "min",
    },
    article: {
      backToBlog: "Back to articles",
      publishedOn: "Published on",
      shareTitle: "Share this article",
      relatedTitle: "You might also like",
    },
    footer: {
      description:
        "Points.tn is an independent media outlet exploring artificial intelligence, digital transformation and technology innovation, from Tunisia to the world.",
      sitesTitle: "Recommended",
      legal: "All rights reserved.",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

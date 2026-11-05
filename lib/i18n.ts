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
  news: {
    menu: string;
    close: string;
    search: string;
    searchPlaceholder: string;
    noResults: string;
    readMore: string;
    recent: string;
    topStories: string;
    allArticles: string;
    sections: string;
    inCategory: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    siteName: "Points.tn",
    tagline: "L'actualité de la Tunisie et du monde : national, international, sport, culture, régions et tech.",
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
        "Points.tn est un média en ligne qui suit l'actualité de la Tunisie et du monde : national, international, sport, culture, régions et technologie. Chaque article cite sa source.",
      sitesTitle: "Nos recommandations",
      legal: "Tous droits réservés.",
    },
  news: {
      menu: "Menu",
      close: "Fermer",
      search: "Rechercher",
      searchPlaceholder: "Rechercher un article…",
      noResults: "Aucun article ne correspond à votre recherche.",
      readMore: "Lire la suite",
      recent: "Les plus récents",
      topStories: "À la une",
      allArticles: "Tous les articles",
      sections: "Rubriques",
      inCategory: "Dans la rubrique",
    },
  },
  en: {
    siteName: "Points.tn",
    tagline: "News from Tunisia and the world: national, international, sport, culture, regions and tech.",
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
        "Points.tn is an online news outlet covering Tunisia and the world: national, international, sport, culture, regions and technology. Every article cites its source.",
      sitesTitle: "Recommended",
      legal: "All rights reserved.",
    },
  news: {
      menu: "Menu",
      close: "Close",
      search: "Search",
      searchPlaceholder: "Search articles…",
      noResults: "No article matches your search.",
      readMore: "Read more",
      recent: "Most recent",
      topStories: "Top stories",
      allArticles: "All articles",
      sections: "Sections",
      inCategory: "In section",
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { isLocale, locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

const COPY = {
  fr: {
    title: "Questions fréquentes sur Points.tn",
    description: "Réponses aux questions les plus posées sur Points.tn : sujets couverts, origine des informations, rôle de l'IA, langues et corrections.",
    h1: "Questions fréquentes",
    faqs: [
      {
        q: "Qu'est-ce que Points.tn ?",
        a: "Points.tn est un média en ligne qui suit l'actualité de la Tunisie et du monde : actualité nationale, international, sport, culture, régions et technologie. Il est publié en français et en anglais.",
      },
      {
        q: "Quelles rubriques propose Points.tn ?",
        a: "Sept rubriques : Actualité nationale, International, Sport, Culture, Régions, Tech et Divers. Chaque rubrique a sa propre page qui liste les derniers articles.",
      },
      {
        q: "D'où viennent les informations publiées ?",
        a: "Chaque article part d'une actualité réelle publiée par un média cité. L'article indique sa source avec un lien. Pour le détail complet d'un événement, consultez toujours la source citée.",
      },
      {
        q: "Les articles sont-ils écrits par une intelligence artificielle ?",
        a: "Les articles sont rédigés avec l'aide de l'intelligence artificielle, qui reformule et met en contexte l'actualité. L'outil reçoit l'instruction de ne rien ajouter qui ne figure pas dans la source : ni chiffre, ni date, ni déclaration.",
      },
      {
        q: "À quelle fréquence Points.tn publie-t-il ?",
        a: "Un nouvel article est publié chaque jour, en français et en anglais. Le plan du site (sitemap.xml) et les flux RSS en français et en anglais permettent de suivre les nouveautés.",
      },
      {
        q: "Points.tn est-il disponible en anglais ?",
        a: "Oui. Le site est disponible en français et en anglais, et chaque article peut avoir une version dans l'autre langue.",
      },
      {
        q: "Que représentent les photos des articles ?",
        a: "Ce sont des images d'illustration génériques issues de banques d'images libres de droits. Elles ne montrent pas forcément l'événement décrit, et les crédits sont conservés.",
      },
      {
        q: "Comment signaler une erreur ou demander une correction ?",
        a: "Écrivez-nous via la page de contact de Galylio, le réseau dont fait partie Points.tn. Les erreurs signalées sont corrigées rapidement.",
        link: { href: "https://galylio.com/contact", label: "Page de contact de Galylio" },
      },
    ],
  },
  en: {
    title: "Points.tn frequently asked questions",
    description: "Answers to the most common questions about Points.tn: topics covered, where information comes from, the role of AI, languages and corrections.",
    h1: "Frequently asked questions",
    faqs: [
      {
        q: "What is Points.tn?",
        a: "Points.tn is an online news outlet covering Tunisia and the world: national news, international news, sport, culture, regions and technology. It is published in French and English.",
      },
      {
        q: "Which sections does Points.tn cover?",
        a: "Seven sections: National news, International, Sport, Culture, Regions, Tech and Miscellaneous. Each section has its own page listing the latest articles.",
      },
      {
        q: "Where does the information come from?",
        a: "Every article starts from a real story published by a named outlet, and the article links to its source. For the full details of an event, always check the cited source.",
      },
      {
        q: "Are the articles written by artificial intelligence?",
        a: "Articles are written with the help of artificial intelligence, which rewrites and adds context to the news. The tool is instructed not to add anything that is not in the source: no figures, dates or statements.",
      },
      {
        q: "How often does Points.tn publish?",
        a: "A new article is published every day, in French and English. The sitemap (sitemap.xml) and the French and English RSS feeds make it easy to follow new articles.",
      },
      {
        q: "Is Points.tn available in English?",
        a: "Yes. The site is available in French and English, and each article may have a version in the other language.",
      },
      {
        q: "What do the photos in the articles show?",
        a: "They are generic illustration images from royalty-free libraries. They do not necessarily show the event described, and credits are kept.",
      },
      {
        q: "How do I report a mistake or ask for a correction?",
        a: "Write to us through the contact page of Galylio, the network Points.tn belongs to. Reported mistakes are fixed quickly.",
        link: { href: "https://galylio.com/contact", label: "Galylio contact page" },
      },
    ],
  },
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = COPY[locale];
  return {
    title: { absolute: c.title },
    description: c.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/faq`,
      languages: { fr: `${SITE_URL}/fr/faq`, en: `${SITE_URL}/en/faq` },
    },
    openGraph: { title: c.title, description: c.description, url: `${SITE_URL}/${locale}/faq`, type: "website", siteName: "Points.tn" },
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const c = COPY[loc];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: loc === "fr" ? "fr-FR" : "en-US",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <Container className="py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold leading-tight sm:text-4xl">{c.h1}</h1>
        <div className="divide-y divide-border border-y border-border">
          {c.faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[17px] font-bold leading-snug">
                {f.q}
                <span aria-hidden className="mt-1 text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">
                {f.a}
                {"link" in f && f.link && (
                  <>
                    {" "}
                    <a href={f.link.href} target="_blank" rel="noopener" className="text-accent-dark underline">
                      {f.link.label}
                    </a>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </article>
    </Container>
  );
}

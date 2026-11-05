import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { CATEGORIES } from "@/lib/categories";
import { isLocale, locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

const COPY = {
  fr: {
    title: "À propos de Points.tn",
    description: "Qui est Points.tn, comment les articles sont produits, d'où viennent les sources et comment signaler une erreur.",
    h1: "À propos de Points.tn",
    sections: [
      {
        h: "Qui sommes-nous",
        p: [
          "Points.tn est un média en ligne qui suit l'actualité de la Tunisie et du monde : actualité nationale, international, sport, culture, régions et technologie. Le site est publié en français et en anglais.",
          "Points.tn fait partie du réseau Galylio, une entreprise tunisienne spécialisée dans l'intelligence artificielle et l'automatisation.",
        ],
      },
      {
        h: "Comment les articles sont produits",
        p: [
          "Chaque article part d'une actualité réelle, publiée par un média cité. Le texte est rédigé avec l'aide de l'intelligence artificielle, qui reformule et met en contexte l'information. Nous demandons à l'outil de ne rien ajouter qui ne figure pas dans la source : ni chiffre, ni date, ni déclaration.",
          "Chaque article indique sa source avec un lien. Pour le détail complet d'un événement, consultez toujours la source citée.",
          "Les photos d'illustration sont des images génériques issues de banques d'images libres de droits. Elles ne représentent pas forcément l'événement décrit ; les crédits sont conservés.",
        ],
      },
      {
        h: "Corrections et signalements",
        p: [
          "Si vous constatez une erreur ou si vous êtes à l'origine d'une information reprise ici et souhaitez une correction ou un retrait, écrivez-nous via la page de contact de Galylio. Nous corrigeons rapidement les erreurs signalées.",
        ],
      },
    ],
    contact: "Contacter l'équipe",
    sectionsTitle: "Rubriques",
  },
  en: {
    title: "About Points.tn",
    description: "Who Points.tn is, how its articles are produced, where sources come from and how to report a mistake.",
    h1: "About Points.tn",
    sections: [
      {
        h: "Who we are",
        p: [
          "Points.tn is an online news outlet covering Tunisia and the world: national news, international news, sport, culture, regions and technology. The site is published in French and English.",
          "Points.tn is part of the Galylio network, a Tunisian company specialised in artificial intelligence and automation.",
        ],
      },
      {
        h: "How articles are produced",
        p: [
          "Every article starts from a real story published by a named outlet. The text is written with the help of artificial intelligence, which rewrites the story and adds context. We instruct the tool not to add anything that is not in the source: no figures, dates or statements.",
          "Each article names its source with a link. For the full details of an event, always check the cited source.",
          "Illustration photos are generic images from royalty-free libraries. They do not necessarily show the event described; credits are kept.",
        ],
      },
      {
        h: "Corrections and reports",
        p: [
          "If you notice a mistake, or you are the origin of a story used here and want a correction or removal, write to us through Galylio's contact page. We fix reported errors quickly.",
        ],
      },
    ],
    contact: "Contact the team",
    sectionsTitle: "Sections",
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
    title: { absolute: `${c.title} — Points.tn` },
    description: c.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/about`,
      languages: { fr: `${SITE_URL}/fr/about`, en: `${SITE_URL}/en/about` },
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const c = COPY[loc];

  return (
    <Container className="py-8 sm:py-12">
      <article className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold leading-tight sm:text-4xl">{c.h1}</h1>
        <div className="prose-points">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </section>
          ))}
          <p>
            <a href="https://galylio.com/contact" target="_blank" rel="noopener">
              {c.contact}
            </a>
          </p>
          <h2>{c.sectionsTitle}</h2>
          <ul>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <a href={`/${loc}/category/${cat.slug}`}>{cat[loc]}</a>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </Container>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { isLocale, locales, type Locale } from "@/lib/i18n";

const SITE_URL = "https://points.tn";

type Entry = { name: string; url: string; fr: string; en: string; source?: string };
type Group = { fr: string; en: string; items: Entry[] };

// Facts come from public pages and press articles (listed as sources). Checked 2026-11-05.
const GROUPS: Group[] = [
  {
    fr: "Associations et communautés IA",
    en: "AI associations and communities",
    items: [
      {
        name: "Tunisian Artificial Intelligence Society (TAIS)",
        url: "https://kapitalis.com/tunisie/2023/05/22/lancement-de-la-tunisian-artificial-intelligence-society/",
        fr: "Association créée en 2023 pour promouvoir et développer l'intelligence artificielle en Tunisie. Elle décerne les Tunisian AI Awards.",
        en: "Association created in 2023 to promote and develop artificial intelligence in Tunisia. It presents the Tunisian AI Awards.",
        source: "Kapitalis",
      },
      {
        name: "Club IA France-Tunisie",
        url: "https://managers.tn/2025/10/24/lancement-du-club-ia-france-tunisie-une-dynamique-nouvelle-pour-linnovation-bilaterale/",
        fr: "Lancé en octobre 2025 à l'ambassade de France à Tunis par Business France, French Tech Tunis et la CDC. Il réunit startups et grands groupes de l'écosystème IA franco-tunisien.",
        en: "Launched in October 2025 at the French embassy in Tunis by Business France, French Tech Tunis and the CDC. It brings together startups and large groups in the Franco-Tunisian AI ecosystem.",
        source: "Managers.tn",
      },
      {
        name: "French Tech Tunis",
        url: "https://lafrenchtech.com/en/community/tunis/",
        fr: "Communauté de startups portant le label French Tech. Elle organise des cafés de l'innovation et le French Tech Tunis Summit (2e édition le 25 juin 2025).",
        en: "Startup community with the French Tech label. It runs innovation cafés and the French Tech Tunis Summit (2nd edition on 25 June 2025).",
        source: "La French Tech",
      },
      {
        name: "Global AI Tunis",
        url: "https://globalai.community/chapters/tunis",
        fr: "Chapitre tunisien de la communauté internationale Global AI.",
        en: "The Tunis chapter of the international Global AI community.",
      },
      {
        name: "ATUGE — Tunisia Global Forum",
        url: "https://atuge.org",
        fr: "Association des Tunisiens des Grandes Écoles. Elle organise le Tunisia Global Forum, consacré à l'IA en 2026, et le Diaspora Month.",
        en: "Association of Tunisians from the Grandes Écoles. It organises the Tunisia Global Forum, themed on AI in 2026, and Diaspora Month.",
        source: "AllAfrica",
      },
    ],
  },
  {
    fr: "Événements IA",
    en: "AI events",
    items: [
      {
        name: "AI Community Days Tunis",
        url: "https://aicommunitydays.ai",
        fr: "Conférence gratuite en présentiel consacrée à l'IA. L'édition 2025 a eu lieu le 8 novembre 2025 au MIT Polytech Tunis.",
        en: "Free in-person AI conference. The 2025 edition took place on 8 November 2025 at MIT Polytech Tunis.",
        source: "Sessionize",
      },
      {
        name: "Deep Learning IndabaX Tunisia (GDG Carthage)",
        url: "https://gdg.community.dev/events/details/google-gdg-carthage-presents-deep-learning-indabax-tunisia/",
        fr: "Rencontre sur le deep learning organisée par GDG Carthage.",
        en: "Deep learning meetup organised by GDG Carthage.",
      },
    ],
  },
  {
    fr: "Incubateurs, accélérateurs et hubs",
    en: "Incubators, accelerators and hubs",
    items: [
      {
        name: "The Dot",
        url: "https://thedot.tn",
        fr: "Se présente comme le premier hub tunisien dédié à l'innovation, à l'entrepreneuriat et à la transformation digitale. Programmes : Dot Camp, Dot Landing, Executives in Residence.",
        en: "Describes itself as the first Tunisian hub dedicated to innovation, entrepreneurship and digital transformation. Programmes include Dot Camp, Dot Landing and Executives in Residence.",
        source: "Managers.tn",
      },
      {
        name: "Flat6Labs Tunis",
        url: "https://www.flat6labs.com",
        fr: "Programme d'amorçage pour startups lancé à Tunis en 2016, en partenariat avec Le15.",
        en: "Seed programme for startups launched in Tunis in 2016, in partnership with Le15.",
        source: "Wamda",
      },
      {
        name: "Orange Digital Center Tunisie",
        url: "https://itweb.africa/article/orange-targets-start-ups-with-first-digital-centre-in-tunisia/KA3Ww7dDB4A7rydZ",
        fr: "Centre pour startups réunissant une école de code, le FabLab Solidaire et Orange Fab.",
        en: "Startup centre combining a coding school, the FabLab Solidaire and Orange Fab.",
        source: "ITWeb Africa",
      },
    ],
  },
  {
    fr: "Entreprises et médias de référence",
    en: "Companies and media worth following",
    items: [
      {
        name: "InstaDeep",
        url: "https://managers.tn/2020/03/04/instadeep-au-top-100-des-startups-de-lia-dans-le-monde",
        fr: "Entreprise d'IA fondée à Tunis en 2014, souvent citée comme référence de l'écosystème IA tunisien.",
        en: "AI company founded in Tunis in 2014, often cited as a reference of the Tunisian AI ecosystem.",
        source: "Managers.tn",
      },
      {
        name: "Noqta",
        url: "https://noqta.tn",
        fr: "Publie des guides sur l'écosystème technologique tunisien.",
        en: "Publishes guides on the Tunisian tech ecosystem.",
      },
      {
        name: "WeAreTech Africa",
        url: "https://www.wearetech.africa",
        fr: "Média qui publie des portraits de fondateurs et de startups tunisiennes.",
        en: "Media outlet that publishes profiles of Tunisian founders and startups.",
      },
    ],
  },
];

const COPY = {
  fr: {
    title: "L'écosystème de l'IA en Tunisie : associations, événements et hubs",
    description: "Annuaire des principaux acteurs de l'intelligence artificielle en Tunisie : associations, événements, hubs et médias, avec leurs liens officiels.",
    h1: "L'écosystème de l'IA en Tunisie",
    intro:
      "Un annuaire des principaux acteurs de l'intelligence artificielle en Tunisie : associations, événements, incubateurs et médias. Les descriptions viennent de leurs sites et de la presse. Vérifiée le 5 novembre 2026.",
    note: "Une information est inexacte ou une organisation manque ? Écrivez-nous via la page de contact de Galylio.",
    contact: "Page de contact de Galylio",
    source: "Source",
  },
  en: {
    title: "The AI ecosystem in Tunisia: associations, events and hubs",
    description: "A directory of the main players in artificial intelligence in Tunisia: associations, events, hubs and media, with their official links.",
    h1: "The AI ecosystem in Tunisia",
    intro:
      "A directory of the main players in artificial intelligence in Tunisia: associations, events, incubators and media. Descriptions come from their own sites and from press coverage. Checked on 5 November 2026.",
    note: "Something is wrong or an organisation is missing? Write to us through Galylio's contact page.",
    contact: "Galylio contact page",
    source: "Source",
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
      canonical: `${SITE_URL}/${locale}/ai-ecosystem`,
      languages: { fr: `${SITE_URL}/fr/ai-ecosystem`, en: `${SITE_URL}/en/ai-ecosystem` },
    },
    openGraph: { title: c.title, description: c.description, url: `${SITE_URL}/${locale}/ai-ecosystem`, type: "website", siteName: "Points.tn" },
  };
}

export default async function AiEcosystemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const c = COPY[loc];

  const flat = GROUPS.flatMap((g) => g.items);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.h1,
    inLanguage: loc === "fr" ? "fr-FR" : "en-US",
    itemListElement: flat.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.name,
      url: e.url,
    })),
  };

  return (
    <Container className="py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{c.h1}</h1>
        <p className="mb-10 text-lg leading-relaxed text-muted">{c.intro}</p>

        {GROUPS.map((g) => (
          <section key={g.fr} className="mb-10">
            <h2 className="section-title mb-5">{g[loc]}</h2>
            <ul className="divide-y divide-border">
              {g.items.map((e) => (
                <li key={e.name} className="py-4">
                  <h3 className="text-[17px] font-bold leading-snug">
                    <a href={e.url} target="_blank" rel="noopener" className="hover:text-accent-dark">
                      {e.name}
                    </a>
                  </h3>
                  <p className="mt-1 leading-relaxed text-muted">{e[loc]}</p>
                  {e.source && (
                    <p className="mt-1 text-xs text-muted-2">
                      {c.source} : {e.source}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="border-t border-border pt-6 text-sm text-muted">
          {c.note}{" "}
          <a href="https://galylio.com/contact" target="_blank" rel="noopener" className="text-accent-dark underline">
            {c.contact}
          </a>
        </p>
      </article>
    </Container>
  );
}

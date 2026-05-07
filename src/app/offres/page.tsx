import type { Metadata } from "next";

import PlanCheckoutButton from "@/components/plan-checkout-button";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "100T | Offres",
  description: "Découvrez les formules 100T : Essentielle, Essentielle annuelle et Premium.",
};

type Offer = {
  name: string;
  planKey: string;
  eyebrow?: string;
  price: string;
  cadence: string;
  commitment: string;
  features: string[];
  highlight?: string;
  note: string;
  accent?: boolean;
  extra?: string;
};

const offers: Offer[] = [
  {
    name: "Offre Essentielle",
    planKey: "ESSENTIELLE",
    price: "29,90 €",
    cadence: "/ mois",
    commitment: "sans engagement",
    features: [
      "Accès à la plateforme",
      "1 programme par mois",
      "Accès à tous les coachs",
      "1 ebook nutritionnel fourni par la plateforme",
      "Changement de coach / programme possible tous les mois",
    ],
    note: "Offre principale, accessible au plus grand nombre.",
  },
  {
    name: "Offre Essentielle annuelle",
    planKey: "ESSENTIELLE_ANNUELLE",
    eyebrow: "Recommandée",
    price: "19,90 €",
    cadence: "/ mois",
    commitment: "facturation mensuelle · engagement 12 mois",
    features: [
      "Même contenu que l'offre Essentielle",
      "Tarif réduit",
      "Fidélisation sur l'année",
    ],
    note: "Offre principale, accessible au plus grand nombre.",
    accent: true,
  },
  {
    name: "Offre Premium",
    planKey: "PREMIUM",
    price: "49,90 €",
    cadence: "/ mois",
    commitment: "sans engagement",
    features: [
      "3 programmes par mois",
      "Accès à plusieurs coachs simultanément",
      "Ebooks illimités",
      "Liberté maximale d'utilisation",
    ],
    note: "Offre orientée utilisateurs très engagés.",
  },
];

function PhonePreview({ accent = false, index }: { accent?: boolean; index: number }) {
  return (
    <div className="relative mx-auto flex h-[220px] w-[116px] rounded-[28px] border border-white/10 bg-black p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <div className="absolute left-1/2 top-2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-white/10" />
      <div className="flex w-full flex-col gap-2 overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-2 pt-5">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className={`flex-1 rounded-[16px] p-2 ${accent && item === 1 ? "bg-[linear-gradient(135deg,rgba(207,253,90,0.95),rgba(207,253,90,0.55))] text-black" : "bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] text-white"}`}
          >
            <div className="flex items-start justify-between">
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${accent && item === 1 ? "bg-black/15" : "bg-[var(--accent)] text-black"}`}>
                {index + item + 1}
              </span>
              <span className="h-2 w-8 rounded-full bg-black/10" />
            </div>
            <div className={`mt-2 h-8 rounded-[10px] ${accent && item === 1 ? "bg-black/15" : "bg-black/25"}`} />
            <div className="mt-2 flex gap-1">
              <span className={`h-3 flex-1 rounded-full ${accent && item === 1 ? "bg-black/15" : "bg-white/10"}`} />
              <span className={`h-3 w-7 rounded-full ${accent && item === 1 ? "bg-black/15" : "bg-white/10"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OffresPage() {
  const user = await getCurrentUser();
  const isAuthenticated = Boolean(user);
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden p-2 lg:p-4">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Formules 100T</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black uppercase tracking-tighter text-white md:text-5xl">
              Trois offres claires pour cadrer l'accès à la plateforme.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Une formule simple pour démarrer, une version annuelle plus rentable, et une offre premium pour les utilisateurs qui veulent plus de volume, plus de liberté et plus de contenu.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
              <div className="font-mono text-2xl font-black text-[var(--accent)]">3</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Formules</div>
            </div>
            <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
              <div className="font-mono text-2xl font-black text-[var(--accent)]">19,90 €</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">A partir de</div>
            </div>

          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {offers.map((offer, index) => (
          <article
            key={offer.name}
            className={`grid gap-5 overflow-hidden rounded-[24px] border ${offer.accent ? "border-[rgba(207,253,90,0.14)] bg-[rgba(207,253,90,0.03)]" : "border-white/5 bg-white/[0.008]"} p-5 lg:grid-cols-[150px_1fr] lg:items-center lg:p-6`}
          >
            <div className="flex justify-center lg:justify-start">
              <PhonePreview accent={offer.accent} index={index * 2} />
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${offer.accent ? "app-chip-accent" : "app-chip"} px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em]`}>
                  {offer.name}
                </span>
                {offer.eyebrow ? (
                  <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/72">
                    {offer.eyebrow}
                  </span>
                ) : null}
              </div>

              <div className="text-black">
                <p className="text-2xl font-black text-white md:text-3xl">
                  {offer.price} <span className="text-white/92">{offer.cadence}</span>
                  <span className="ml-2 text-base font-semibold text-white/64">{offer.commitment}</span>
                </p>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2">
                {offer.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 border-b border-white/6 px-1 py-2.5 text-sm text-white/78 md:border-0 md:px-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-black text-black">
                      +
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xl font-black text-white">{offer.note}</p>
                  {offer.extra ? <p className="text-sm font-semibold text-[var(--accent)] md:text-base">{offer.extra}</p> : null}
                </div>
                <PlanCheckoutButton
                  plan={offer.planKey}
                  isAuthenticated={isAuthenticated}
                  className={`${offer.accent ? "app-button-accent" : "app-button-ghost"} inline-flex items-center justify-center px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] transition hover:bg-white hover:text-black`}
                >
                  Choisir cette formule
                </PlanCheckoutButton>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[24px] border border-white/5 bg-white/[0.008] p-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Lecture rapide</p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tighter text-white">Quelle formule choisir ?</h2>
          <p className="mt-3 text-sm text-white/64 md:text-base">
            L'Essentielle reste l'entrée la plus simple. L'annuelle baisse le prix mensuel. La Premium ouvre plus de volume pour les profils qui consomment plusieurs programmes chaque mois.
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.008] p-2">
          <div className="grid gap-px overflow-hidden rounded-[20px] bg-white/6 md:grid-cols-3">
            <div className="bg-black/45 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Essentielle</p>
              <p className="mt-3 text-xl font-black text-white">29,90 €</p>
              <p className="mt-2 text-sm text-white/62">Souple, sans engagement.</p>
            </div>
            <div className="bg-[rgba(207,253,90,0.12)] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Annuelle</p>
              <p className="mt-3 text-xl font-black text-white">19,90 €</p>
              <p className="mt-2 text-sm text-white/70">Mensuel · engagement 12 mois.</p>
            </div>
            <div className="bg-black/45 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Premium</p>
              <p className="mt-3 text-xl font-black text-white">49,90 €</p>
              <p className="mt-2 text-sm text-white/62">Volume et liberté maximum.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
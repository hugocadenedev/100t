import Image from "next/image";
import Link from "next/link";

import faqPhoto from "../../47AF34C4-9B7F-4CA8-83D5-F52946F0DB9A_L0_001-04_11_2024 11_57_37.jpg";
import footerLogo from "../../WhatsApp_Image_2026-07-01_at_22.10.13-removebg-preview.png";

import { getMarketplaceData } from "@/lib/data";
import { VideoStories } from "@/components/video-stories";

const aboutImage = faqPhoto;

const faqItems = [
  {
    question: "Comment fonctionne l'abonnement sur 100T ?",
    answer:
      "Tu choisis une formule 100T, puis tu sélectionnes ton coach et ton programme selon les limites prévues par ton abonnement. Chaque mois, tu retrouves tes sélections dans ton tableau de bord et tu peux avancer à ton rythme.",
  },
  {
    question: "Est-ce que je peux comparer plusieurs coachs avant de choisir ?",
    answer:
      "Oui. La page coachs te permet de filtrer par discipline et spécialités, puis d'ouvrir chaque profil public pour comparer l'approche, l'expérience et les contenus proposés.",
  },
  {
    question: "Les coachs sont-ils validés avant d'apparaître sur la plateforme ?",
    answer:
      "Oui. Chaque coach remplit une candidature détaillée, présente ses diplômes et son expérience, et son profil n'apparaît publiquement qu'après validation par l'administration.",
  },
  {
    question: "Je me suis trompé de coach ou de programme, puis-je annuler ?",
    answer:
      "Avant la validation finale, un message de confirmation t'aide à vérifier ton choix. Une fois la sélection validée pour le mois en cours, elle est comptabilisée selon les règles de ton offre.",
  },
  {
    question: "Puis-je sélectionner plusieurs programmes dans le même mois ?",
    answer:
      "Oui, si ta formule le permet. L'offre Essentielle donne accès à 1 programme par mois, tandis que la Premium permet jusqu'à 3 sélections mensuelles.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui. Les offres sans engagement peuvent être résiliées en fin de période. Si une formule comporte une durée minimale, cette information est affichée clairement avant paiement.",
  },
  {
    question: "Le suivi est-il personnalisé ?",
    answer:
      "Tu choisis un coach expert, un programme adapté à ton objectif et tu peux échanger dans le cadre prévu par la plateforme. 100T propose un accompagnement structuré, sans promettre du coaching privé illimité.",
  },
] as const;

export default async function Home() {
  const { coaches, disciplines } = await getMarketplaceData();
  const featuredCoaches = coaches.slice(0, 4);
  const featuredDisciplines = disciplines.slice(0, 4);

  return (
    <div className="bg-[var(--background)] text-slate-100">
      <section className="relative overflow-hidden px-4 pb-18 pt-16 md:px-10 md:pb-24 md:pt-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top_left,rgba(207,253,90,0.13),transparent_50%)]" />
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
              Marketplace coaching sport et performance
            </p>
            <h1 className="font-condensed mt-5 max-w-5xl text-[3.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-white sm:text-[5.1rem] lg:text-[6.4rem] xl:text-[7.4rem]">
              Un abonnement
              <br />
              tout compris.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
              Un coaching de qualité, sans engagement. Sélectionnez votre coach, téléchargez votre programme et progressez à votre rythme grâce à des contenus conçus par des professionnels certifiés.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["SIMPLE", "FLEXIBLE", "SANS ENGAGEMENT"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/70 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-black/78">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/coachs"
                className="app-button-accent inline-flex items-center justify-center px-7 py-3 text-sm font-semibold transition hover:opacity-92"
              >
                Trouver un coach
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ce qu'on dit de nous – story bubbles ── */}
      <section className="border-t border-white/8 bg-[#080808] px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">Témoignages</p>
            <h2 className="font-condensed mt-4 text-[2.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-white md:text-[4.2rem]">
              Ce qu'on dit de nous.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-white/45">
              Ils ont testé. Ils témoignent.
            </p>
          </div>
          <VideoStories />
        </div>
      </section>

      <section className="border-t border-black/8 bg-[#f6f5f1] px-4 py-18 text-[#111111] md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#5c6b1f]">Sports et catégories</p>
              <h2 className="font-condensed mt-4 text-[2.8rem] font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-[#111111] md:text-[4.7rem]">
                Choisis ton coach
                <br />
                en fonction de ton objectif.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-black/62 md:text-base">
                Compare les profils, choisis le coach qui correspond à ton objectif et accède à ton programme en moins de 5 minutes, sans parcours compliqué.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredCoaches.map((coach: (typeof featuredCoaches)[number], index: number) => (
              <article key={coach.id} className="group overflow-hidden rounded-[30px] border border-black/8 bg-white shadow-[0_16px_34px_rgba(0,0,0,0.06)]">
                <div className="relative aspect-[0.82] overflow-hidden bg-[#e8e5dc]">
                  {coach.photoUrl ? (
                    <Image
                      src={coach.photoUrl}
                      alt={coach.displayName}
                      fill
                      className="object-cover object-center opacity-88 transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(17,17,17,0.82)] via-[rgba(17,17,17,0.08)] to-transparent" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/84 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black/70 backdrop-blur-md">
                    {featuredDisciplines[index] || coach.discipline}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-condensed text-[2rem] uppercase leading-none tracking-[-0.03em] text-[#111111]">
                    {coach.discipline}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-black/62">
                    {coach.headline}
                  </p>
                  <Link
                    href={`/coach/${coach.slug}`}
                    className="mt-5 inline-flex text-sm font-semibold text-[#111111] underline underline-offset-4 transition hover:text-[#5c6b1f]"
                  >
                    Voir plus
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#f6f5f1] px-4 py-18 text-[#111111] md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#5c6b1f]">Mini tuto</p>
            <h2 className="font-condensed mt-4 text-[2.8rem] font-semibold uppercase leading-[0.92] tracking-[-0.04em] md:text-[4.8rem]">
              Commence
              <br />
              en 3 étapes.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/68">
              Un parcours rapide, lisible et direct pour choisir ton coach, activer ton offre et démarrer ton entraînement sans perte de temps.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[28px] border border-black/8 bg-white px-5 py-6 shadow-[0_16px_34px_rgba(0,0,0,0.06)]">
              <div className="font-condensed text-5xl leading-none text-[#111111]">01</div>
              <h3 className="mt-5 text-xl font-black uppercase tracking-tight text-[#111111]">
                Choisi ton coach en 1 clic
              </h3>
              <p className="mt-3 text-sm leading-6 text-black/62">
                Parcours les profils, trouve l'approche qui te correspond et ouvre la page du coach qui colle à ton objectif.
              </p>
            </article>

            <article className="rounded-[28px] border border-black/8 bg-[var(--accent)] px-5 py-6 text-black shadow-[0_16px_34px_rgba(0,0,0,0.06)]">
              <div className="font-condensed text-5xl leading-none">02</div>
              <h3 className="mt-5 text-xl font-black uppercase tracking-tight">
                Selectionne ton offre
              </h3>
              <p className="mt-3 text-sm leading-6 text-black/72">
                Choisis la formule qui te convient et valide ton accès en quelques secondes avec un parcours simple.
              </p>
            </article>

            <article className="rounded-[28px] border border-black/8 bg-white px-5 py-6 shadow-[0_16px_34px_rgba(0,0,0,0.06)]">
              <div className="font-condensed text-5xl leading-none text-[#111111]">03</div>
              <h3 className="mt-5 text-xl font-black uppercase tracking-tight text-[#111111]">
                Commence à t'entrainer
              </h3>
              <p className="mt-3 text-sm leading-6 text-black/62">
                Accède directement à ton programme, retrouve tes contenus et démarre ton entraînement immédiatement.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[var(--accent)] px-4 py-18 text-[#111111] md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-black/62">Questions fréquentes</p>
              <h2 className="font-condensed mt-4 text-[2.9rem] font-semibold uppercase leading-[0.9] tracking-[-0.04em] md:text-[5.4rem]">
                Des questions ?
                <br />
                Trouvez les réponses ici.
              </h2>
            </div>
            <Link
              href="#support"
              className="inline-flex items-center justify-center rounded-full bg-[#242424] px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
            >
              Nous contacter
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[30px] bg-white/30 p-2 lg:self-stretch">
              <div className="relative min-h-[420px] overflow-hidden rounded-[24px] bg-white/20 lg:h-full">
                <Image src={aboutImage} alt="Coach 100T" fill className="object-cover" />
              </div>
            </div>

            <div className="flex h-full flex-col gap-4">
              {faqItems.map((item, index) => (
                <details key={item.question} className="faq-item" open={index === 0}>
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 text-base font-semibold">
                    <span>{item.question}</span>
                    <span className="text-lg leading-none">⌄</span>
                  </summary>
                  <div className="px-6 pb-5 pt-4 text-sm leading-7 text-black/72">{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-4 pb-10 pt-16 md:px-10">
        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-5">
              <FooterMark />
            </div>
            <p className="mb-8 max-w-xs text-slate-400">
              La marketplace française pour l'entraînement athlétique par abonnement entre abonnés motivés et coachs professionnels.
            </p>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-widest text-white">Explorer</h4>
            <ul className="space-y-4 text-xs font-semibold uppercase text-slate-400">
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/coachs">
                  Trouver un coach
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/offres">
                  Offres
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/inscription">
                  Devenir coach
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="#faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div id="support">
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-widest text-white">Support</h4>
            <ul className="space-y-4 text-xs font-semibold uppercase text-slate-400">
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/mot-de-passe-oublie">
                  Mot de passe oublié
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/tableau-de-bord">
                  Espace abonné
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/coach-studio">
                  Studio coach
                </Link>
              </li>
              <li>
                <Link className="transition-colors hover:text-[var(--accent)]" href="/connexion">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-10 md:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            © 2026 marketplace sportive 100T. Tous droits réservés.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Conçu pour les infatigables.</p>
        </div>
      </footer>
    </div>
  );
}

function FooterMark() {
  return (
    <div aria-label="Logo 100T symbole" className="inline-flex items-center justify-center">
      <Image src={footerLogo} alt="100T" className="h-14 w-auto md:h-16" />
    </div>
  );
}
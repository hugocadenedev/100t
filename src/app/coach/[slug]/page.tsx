import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import SelectProgramButton from "@/components/select-program-button";
import { SubscribeModal, SwitchCoachModal } from "@/components/subscribe-modal";
import { getCoachPageData } from "@/lib/data";
import type { DifficultyValue } from "@/lib/domain";
import { PLATFORM_MONTHLY_PRICE } from "@/lib/domain";
import { difficultyLabels, formatDuration, formatPrice, programLevelLabels } from "@/lib/utils";
import type { ProgramLevelValue } from "@/lib/domain";

const socialIcons: Record<string, React.ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  "Site web": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
};

export default async function CoachPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCoachPageData(slug);

  if (!data.coach) notFound();

  const { coach, isSubscribed, hasActivePlatformSub, selectedProgramIds, selectionLimitReached, hasActiveSubElsewhere, switchPendingToThisCoach, user } = data;

  const socialLinks = [
    { label: "Instagram", href: coach.instagramUrl },
    { label: "YouTube", href: coach.youtubeUrl },
    { label: "TikTok", href: coach.tiktokUrl },
    { label: "LinkedIn", href: coach.linkedinUrl },
    { label: "Site web", href: coach.websiteUrl },
  ].filter((item) => Boolean(item.href));

  const specialities = coach.specialities
    ? coach.specialities.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const stats = [
    { label: "Abonnés", value: coach._count.subscriptions },
    { label: "Expérience", value: `${coach.experienceYears} ans` },
    { label: "Clients coachés", value: coach.coachedClientsCount },
    { label: "Programmes", value: coach.programs.length },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO — couverture */}
      <div className="relative h-52 w-full overflow-hidden md:h-64 lg:h-72">
        {coach.coverImageUrl ? (
          <Image
            src={coach.coverImageUrl}
            alt="Couverture"
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="relative h-full w-full bg-gradient-to-br from-[#0c1015] via-[#111820] to-[#0a0d10]">
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse 60% 70% at 30% 50%, rgba(180,255,80,0.06) 0%, transparent 70%)" }}
            />
            <div className="absolute inset-0 flex items-center justify-start px-12 opacity-[0.03]">
              <span className="font-mono text-[16rem] font-black uppercase leading-none text-white">
                {coach.displayName.slice(0, 1)}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[rgba(6,9,14,0.15)] to-transparent" />

        {/* Retour */}
        <div className="absolute left-4 top-4 sm:left-6 lg:left-8">
          <Link
            href="/coachs"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:text-white"
          >
            ← Tous les coachs
          </Link>
        </div>

        {/* Discipline */}
        <div className="absolute right-4 top-4 sm:right-6 lg:right-8">
          <span className="rounded-full border border-[var(--accent)]/30 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)] backdrop-blur-sm">
            {coach.discipline}
          </span>
        </div>
      </div>

      {/* IDENTITÉ — avatar + nom */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Avatar — chevauchement sur la couverture */}
        <div className="-mt-14 mb-3 md:-mt-16">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--bg)] shadow-xl md:h-28 md:w-28">
            {coach.photoUrl ? (
              <Image
                src={coach.photoUrl}
                alt={coach.displayName}
                fill
                className="object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/8 to-white/[0.02]">
                <span className="text-2xl font-black uppercase text-white/40">
                  {coach.displayName.slice(0, 1)}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Nom + accroche — toujours sous l'avatar */}
        <div className="pb-5">
          <h1 className="text-2xl font-black uppercase leading-tight tracking-tighter text-white md:text-3xl lg:text-[2.2rem]">
            {coach.displayName}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-white/50">{coach.headline}</p>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="border-y border-white/5 bg-white/[0.025]">
        <div className="mx-auto flex max-w-5xl overflow-x-auto px-4 sm:px-6 lg:px-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex shrink-0 flex-col gap-0.5 px-5 py-4 ${i > 0 ? "border-l border-white/5" : ""}`}
            >
              <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
                {stat.label}
              </span>
              <span className="whitespace-nowrap text-sm font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENU */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">

        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Programmes */}
          <div className="space-y-4">
            <SectionLabel>
              Programmes
              {isSubscribed ? (
                <span className="ml-2 font-mono text-white/25">
                  ({coach.programs.length} débloqué{coach.programs.length > 1 ? "s" : ""})
                </span>
              ) : (
                <span className="ml-2 font-mono text-white/25">({coach.programs.length})</span>
              )}
            </SectionLabel>

            {coach.programs.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {coach.programs.map((program: (typeof coach.programs)[number]) => (
                  <article
                    key={program.id}
                    className="group flex flex-col overflow-hidden rounded-[22px] border border-white/5 bg-white/[0.02] transition hover:border-white/10"
                  >
                    <div className="relative h-40 overflow-hidden bg-white/[0.03]">
                      {program.coverImage ? (
                        <Image
                          src={program.coverImage}
                          alt={program.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-mono text-2xl font-black uppercase text-white/8">
                            {program.title.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,9,14,0.75)] to-transparent" />
                      <div className="absolute bottom-2.5 left-3 flex flex-wrap gap-1.5">
                        {program.submissionMeta ? (
                          <>
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                              {programLevelLabels[program.submissionMeta.level as ProgramLevelValue]}
                            </span>
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                              {program.submissionMeta.durationMonths} mois
                            </span>
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                              {program.submissionMeta.sessionsPerWeek} séances/sem.
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                              {difficultyLabels[program.difficulty as DifficultyValue]}
                            </span>
                            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                              {formatDuration(program.totalDurationMinutes)}
                            </span>
                            {program._count.workoutSessions > 0 && (
                              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                                {program._count.workoutSessions} séance{program._count.workoutSessions > 1 ? "s" : ""}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-tight text-white">{program.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/45">{program.description}</p>
                      </div>
                      <div className="mt-auto pt-1">
                        {isSubscribed ? (
                          // Legacy: old-style coach subscription — direct access
                          <Link
                            href={`/programmes/${program.id}`}
                            className="app-button-accent inline-flex w-full items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em]"
                          >
                            Ouvrir le programme
                          </Link>
                        ) : hasActivePlatformSub ? (
                          selectedProgramIds.has(program.id) ? (
                            // Already selected this month
                            <Link
                              href={`/programmes/${program.id}`}
                              className="app-button-accent inline-flex w-full items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em]"
                            >
                              ✓ Sélectionné · Accéder
                            </Link>
                          ) : selectionLimitReached ? (
                            // Limit reached
                            <Link
                              href={`/programmes/${program.id}`}
                              className="inline-flex w-full items-center justify-center rounded-[12px] border border-white/8 px-4 py-2.5 text-xs font-semibold text-white/40 transition hover:border-white/20 hover:text-white/70"
                            >
                              Voir le programme →
                            </Link>
                          ) : (
                            // Has active sub, can select
                            <SelectProgramButton
                              programId={program.id}
                              className="app-button-accent inline-flex w-full items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em]"
                            />
                          )
                        ) : user?.role !== "COACH" ? (
                          <Link
                            href={`/programmes/${program.id}`}
                            className="inline-flex w-full items-center justify-center rounded-[12px] border border-white/8 px-4 py-2.5 text-xs font-semibold text-white/40 transition hover:border-white/20 hover:text-white/70"
                          >
                            Voir le programme →
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-white/35">
                Aucun programme publié pour le moment.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

          {/* Bio avec voir plus */}
          <details className="group rounded-[22px] border border-white/5 bg-white/[0.02] p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <SectionLabel>À propos</SectionLabel>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)] group-open:hidden">Voir plus ↓</span>
              <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-white/40 group-open:inline">Réduire ↑</span>
            </summary>
            {/* Extrait visible quand fermé */}
            <p className="mt-3 line-clamp-3 text-sm leading-[1.9] text-white/65 group-open:hidden">{coach.bio}</p>
            {/* Texte complet quand ouvert */}
            <p className="mt-3 hidden whitespace-pre-line text-sm leading-[1.9] text-white/65 group-open:block">{coach.bio}</p>
          </details>

          {isSubscribed ? (
            <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/[0.07] p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-bold text-emerald-100">Accès actif</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-100/55">
                Tous les programmes de ce coach sont débloqués.
              </p>
            </div>
          ) : hasActivePlatformSub ? (
            <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-400/[0.07] p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-bold text-emerald-100">Abonnement actif</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-100/55">
                Sélectionne un programme ci-dessus pour ce mois.
              </p>
            </div>
          ) : switchPendingToThisCoach ? (
            <div className="rounded-[22px] border border-[var(--accent)]/20 bg-[var(--accent)]/[0.06] p-5">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                <span className="text-sm font-bold text-[var(--accent)]">Changement programmé</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/40">Actif dès le prochain renouvellement.</p>
            </div>
          ) : user?.role !== "COACH" ? (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-5">
              <SectionLabel>Accès complet</SectionLabel>
              <div className="mb-3">
                <span className="text-2xl font-black text-white">À partir de {formatPrice(19.9)}</span>
                <span className="ml-1.5 text-sm text-white/35">/ mois</span>
              </div>
              <p className="mb-4 text-xs leading-5 text-white/40">
                Choisis une formule et sélectionne un programme par mois. Annulable à tout moment.
              </p>
              <Link
                href="/offres"
                className="app-button-accent inline-flex w-full items-center justify-center px-4 py-3 text-xs font-black uppercase tracking-[0.14em]"
              >
                Voir les offres
              </Link>
            </div>
          ) : null}

          {specialities.length > 0 && (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-5">
              <SectionLabel>Spécialisations</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {specialities.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/55"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-5">
              <SectionLabel>Réseaux &amp; liens</SectionLabel>
              <div className="space-y-1">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-white/55 transition hover:bg-white/[0.04] hover:text-[var(--accent)]"
                  >
                    <span className="text-white/25">{socialIcons[link.label]}</span>
                    {link.label}
                    <span className="ml-auto text-[10px] text-white/20">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA bas de page */}
      {!isSubscribed && !switchPendingToThisCoach && user?.role !== "COACH" && coach.programs.length > 0 && (
        <div className="sticky bottom-4 z-30 flex justify-center px-4">
          <div className="flex w-full max-w-2xl items-center justify-between gap-4 rounded-full border border-white/8 bg-[rgba(8,10,14,0.94)] px-5 py-3.5 shadow-[0_22px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div>
              <div className="text-sm font-bold text-white">
                Débloque {coach.programs.length} programme{coach.programs.length > 1 ? "s" : ""}
              </div>
              <div className="text-xs text-white/35">
                {formatPrice(PLATFORM_MONTHLY_PRICE)} / mois · annulable à tout moment
              </div>
            </div>
            {hasActiveSubElsewhere ? (
              <SwitchCoachModal coachId={coach.id} coachName={coach.displayName} monthlyPrice={PLATFORM_MONTHLY_PRICE} />
            ) : (
              <SubscribeModal
                coachId={coach.id}
                coachName={coach.displayName}
                monthlyPrice={PLATFORM_MONTHLY_PRICE}
                triggerClassName="app-button-accent inline-flex items-center justify-center px-5 py-3 text-xs font-black uppercase tracking-[0.14em]"
                isAuthenticated={!!user}
                redirectAfter={`/coach/${coach.slug}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
      {children}
    </p>
  );
}

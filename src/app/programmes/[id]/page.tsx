import Link from "next/link";
import { notFound } from "next/navigation";

import { getProgramPageData } from "@/lib/data";
import type { DifficultyValue, ProgramLevelValue } from "@/lib/domain";
import { difficultyLabels, formatDate, formatDuration, getMonthUnlockDate, programLevelLabels } from "@/lib/utils";

const difficultyColors: Record<DifficultyValue, string> = {
  DEBUTANT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  INTERMEDIAIRE: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  AVANCE: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  EXPERT: "bg-red-500/15 text-red-400 border-red-500/20",
};

function parseEquipment(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [String(raw)];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

const equipmentLabels: Record<string, string> = {
  barbell: "Barre olympique",
  dumbbell: "Haltères",
  kettlebell: "Kettlebell",
  rings: "Anneaux",
  pullup_bar: "Barre de traction",
  resistance_band: "Élastiques",
  box: "Box",
  none: "Sans matériel",
  rope: "Corde à sauter",
  bench: "Banc",
  trx: "TRX",
};

export default async function ProgrammeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProgramPageData(id);

  if (!data) notFound();

  const { canAccess } = data;
  const { user } = data;
  const program = "program" in data ? data.program : null;
  if (!program) notFound();

  const { unlockedMonths, subscriptionStartedAt } = program;

  // Lien d'abonnement : inscription si non connecté, page coach sinon
  const subscribeHref = user
    ? `/coach/${program.coachSlug}`
    : `/inscription?redirectAfter=${encodeURIComponent(`/programmes/${id}`)}`;

  const equipment = parseEquipment(program.submissionMeta?.equipment);
  const hasPdfs = program.monthlyPdfs.length > 0;
  const totalSessions = program.workoutSessions.length;

  const statsBar = [
    {
      label: "Niveau",
      value: program.submissionMeta?.level
        ? programLevelLabels[program.submissionMeta.level as ProgramLevelValue]
        : difficultyLabels[program.difficulty as DifficultyValue],
    },
    ...(program.submissionMeta?.durationMonths
      ? [{ label: "Durée", value: `${program.submissionMeta.durationMonths} mois` }]
      : []),
    ...(program.submissionMeta?.sessionsPerWeek
      ? [{ label: "Fréquence", value: `${program.submissionMeta.sessionsPerWeek}×/semaine` }]
      : []),
    ...(program.submissionMeta?.avgSessionMinutes
      ? [{ label: "Par séance", value: `~${program.submissionMeta.avgSessionMinutes} min` }]
      : []),
    ...(totalSessions ? [{ label: "Séances", value: `${totalSessions} au total` }] : []),
    ...(hasPdfs
      ? [{ label: "PDF", value: `${program.monthlyPdfs.length} mensuel${program.monthlyPdfs.length > 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <div className="min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <div className="relative h-72 w-full overflow-hidden md:h-80 lg:h-96">
        {program.coverImage ? (
          <img
            src={program.coverImage}
            alt={program.title}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0c1015] via-[#111820] to-[#0a0d10]">
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse 80% 60% at 80% 20%, rgba(180,255,80,0.07) 0%, transparent 70%)" }}
            />
            <div className="absolute inset-0 flex items-center justify-end px-8 opacity-[0.04]">
              <span className="font-mono text-[14rem] font-black uppercase leading-none text-white">
                {program.title.slice(0, 1)}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[rgba(6,9,14,0.45)] to-transparent" />

        {/* Back button */}
        <div className="absolute left-4 top-4 sm:left-6 lg:left-8">
          <Link
            href={`/coach/${program.coachSlug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:text-white"
          >
            ← Profil du coach
          </Link>
        </div>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-7 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--accent)]">
              {canAccess ? "Programme débloqué" : "Aperçu du programme"}
            </p>
            <h1 className="text-3xl font-black uppercase leading-none tracking-tighter text-white md:text-4xl lg:text-[2.75rem]">
              {program.title}
            </h1>
            <p className="mt-2.5 text-sm text-white/45">
              Par <span className="font-semibold text-white/75">{program.coachName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      {statsBar.length > 0 && (
        <div className="border-b border-white/5 bg-white/[0.025]">
          <div className="mx-auto flex max-w-5xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            {statsBar.map((stat, i) => (
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
      )}

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">
        {/* ── LEFT ── */}
        <div className="space-y-5">
          {/* Description */}
          <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-6">
            <SectionLabel>À propos du programme</SectionLabel>
            <p className="text-sm leading-[1.85] text-white/65">{program.description}</p>
          </div>

          {/* Monthly PDFs – verrouillage progressif par mois d'abonnement */}
          {hasPdfs && (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-6">
              <SectionLabel>
                PDFs mensuels
                {canAccess && unlockedMonths !== null && (
                  <span className="ml-2 rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]">
                    Mois {unlockedMonths} débloqué{unlockedMonths > 1 ? "s" : ""}
                  </span>
                )}
              </SectionLabel>

              {canAccess ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {program.monthlyPdfs.map((pdf) => {
                    // null = aucune restriction (admin / propriétaire)
                    const isUnlocked = unlockedMonths === null || pdf.monthNumber <= unlockedMonths;
                    const unlockDate =
                      !isUnlocked && subscriptionStartedAt
                        ? getMonthUnlockDate(subscriptionStartedAt, pdf.monthNumber)
                        : null;

                    if (isUnlocked) {
                      return (
                        <a
                          key={pdf.id}
                          href={pdf.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-[14px] border border-white/6 bg-white/[0.02] p-4 transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/[0.05]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] transition group-hover:bg-[var(--accent)]/20">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {pdf.label ?? `Mois ${pdf.monthNumber}`}
                            </p>
                            <p className="text-[11px] text-white/35 transition group-hover:text-[var(--accent)]">
                              Télécharger →
                            </p>
                          </div>
                        </a>
                      );
                    }

                    // PDF verrouillé
                    return (
                      <div
                        key={pdf.id}
                        className="flex items-center gap-3 rounded-[14px] border border-white/4 bg-white/[0.01] p-4 opacity-60"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-white/25">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white/40">
                            {pdf.label ?? `Mois ${pdf.monthNumber}`}
                          </p>
                          <p className="text-[11px] text-white/25">
                            {unlockDate
                              ? `Disponible le ${formatDate(unlockDate)}`
                              : `Disponible au mois ${pdf.monthNumber}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[14px] border border-white/6 bg-white/[0.02] p-5 text-center">
                  <p className="text-xs text-white/35">
                    🔒 {program.monthlyPdfs.length} PDF{program.monthlyPdfs.length > 1 ? "s" : ""} disponible{program.monthlyPdfs.length > 1 ? "s" : ""} pour les abonnés
                  </p>
                  <Link href={subscribeHref} className="mt-3 inline-block text-xs font-semibold text-[var(--accent)] hover:underline">
                    S&apos;abonner pour y accéder →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Single PDF */}
          {!hasPdfs && program.pdfUrl && (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-6">
              <SectionLabel>Programme PDF</SectionLabel>
              {canAccess ? (
              <a
                href={program.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="app-button-accent inline-flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
                Ouvrir le PDF
              </a>
              ) : (
                <div className="rounded-[14px] border border-white/6 bg-white/[0.02] p-5 text-center">
                  <p className="text-xs text-white/35">🔒 PDF disponible pour les abonnés</p>
                  <Link href={subscribeHref} className="mt-3 inline-block text-xs font-semibold text-[var(--accent)] hover:underline">S&apos;abonner pour y accéder →</Link>
                </div>
              )}
            </div>
          )}

          {/* Sessions */}
          {totalSessions > 0 && (
            <div className="space-y-3">
              <SectionLabel>
                Séances du programme{" "}
                <span className="ml-1 font-mono text-white/25">({totalSessions})</span>
              </SectionLabel>

              {program.workoutSessions.map(
                (session: (typeof program.workoutSessions)[number], index: number) => (
                  <details
                    key={session.id}
                    className="group overflow-hidden rounded-[22px] border border-white/5 bg-white/[0.02] transition open:border-white/8"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer select-none list-none items-start gap-4 p-5">
                      {/* Session number */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 font-mono text-sm font-black text-[var(--accent)]">
                        {index + 1}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold uppercase tracking-tight text-white">
                            {session.title}
                          </h3>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${difficultyColors[session.difficulty as DifficultyValue]}`}>
                            {difficultyLabels[session.difficulty as DifficultyValue]}
                          </span>
                          <span className="text-xs text-white/35">
                            {formatDuration(session.durationMinutes)}
                          </span>
                        </div>
                        {session.description ? (
                          <p className="text-xs leading-5 text-white/45">{session.description}</p>
                        ) : null}
                        {/* Exercise preview chips when collapsed */}
                        <div className="flex flex-wrap gap-1.5 group-open:hidden">
                          {session.exerciseBlocks
                            .slice(0, 4)
                            .map((b: (typeof session.exerciseBlocks)[number]) => (
                              <span key={b.id} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/40">
                                {b.name}
                              </span>
                            ))}
                          {session.exerciseBlocks.length > 4 && (
                            <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/25">
                              +{session.exerciseBlocks.length - 4} exercices
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Toggle */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/8 text-xs font-bold text-white/30 transition group-open:rotate-45 group-open:border-white/15 group-open:text-white/60">
                        +
                      </div>
                    </summary>

                    {/* Expanded content */}
                    <div className="border-t border-white/5 px-5 pb-5 pt-4">
                      {session.videoUrl ? (
                        <div className="mb-4 overflow-hidden rounded-[16px]">
                          <iframe
                            src={session.videoUrl}
                            title={`Vidéo ${session.title}`}
                            className="h-56 w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}

                      {session.exerciseBlocks.length > 0 && (
                        <div className="space-y-1.5">
                          {/* Column headers */}
                          <div className="hidden grid-cols-[1fr_52px_80px_60px] gap-3 px-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/20 sm:grid">
                            <span>Exercice</span>
                            <span className="text-center">Séries</span>
                            <span className="text-center">Reps</span>
                            <span className="text-center">Repos</span>
                          </div>
                          {session.exerciseBlocks.map(
                            (block: (typeof session.exerciseBlocks)[number], bi: number) => (
                              <div
                                key={block.id}
                                className={`rounded-[12px] p-3 ${bi % 2 === 0 ? "bg-white/[0.025]" : "bg-transparent"}`}
                              >
                                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_52px_80px_60px] sm:items-center sm:gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-white">{block.name}</p>
                                    {block.notes ? (
                                      <p className="mt-0.5 text-xs text-white/35">{block.notes}</p>
                                    ) : null}
                                  </div>
                                  <div className="flex gap-2 sm:contents">
                                    <ExercisePill label="Séries" value={`${block.sets}`} />
                                    <ExercisePill label="Reps" value={block.reps} />
                                    <ExercisePill label="Repos" value={`${block.restSeconds}s`} />
                                  </div>
                                </div>
                                {block.videoUrl ? (
                                  <a
                                    href={block.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex text-[11px] font-medium text-[var(--accent)] hover:underline"
                                  >
                                    ▶ Voir la démonstration
                                  </a>
                                ) : null}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                ),
              )}
            </div>
          )}

          {/* Empty state */}
          {totalSessions === 0 && !hasPdfs && !program.pdfUrl && (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/40">Ce programme ne contient pas encore de séances en ligne.</p>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Details */}
          <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-5">
            <SectionLabel>Caractéristiques</SectionLabel>
            <dl className="space-y-0">
              <InfoRow
                label="Niveau"
                value={
                  program.submissionMeta?.level
                    ? programLevelLabels[program.submissionMeta.level as ProgramLevelValue]
                    : difficultyLabels[program.difficulty as DifficultyValue]
                }
              />
              {program.submissionMeta?.durationMonths ? (
                <InfoRow label="Durée" value={`${program.submissionMeta.durationMonths} mois`} />
              ) : null}
              {program.submissionMeta?.sessionsPerWeek ? (
                <InfoRow label="Fréquence" value={`${program.submissionMeta.sessionsPerWeek} séances/sem.`} />
              ) : null}
              {program.submissionMeta?.avgSessionMinutes ? (
                <InfoRow label="Durée séance" value={`~${program.submissionMeta.avgSessionMinutes} min`} />
              ) : null}
              {totalSessions > 0 ? <InfoRow label="Séances" value={String(totalSessions)} /> : null}
              {hasPdfs ? (
                <InfoRow label="PDFs" value={`${program.monthlyPdfs.length} mensuel${program.monthlyPdfs.length > 1 ? "s" : ""}`} />
              ) : null}
            </dl>
          </div>

          {/* Equipment */}
          {equipment.length > 0 && (
            <div className="rounded-[22px] border border-white/5 bg-white/[0.02] p-5">
              <SectionLabel>Matériel requis</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {equipment.map((eq) => (
                  <span key={eq} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60">
                    {equipmentLabels[eq] ?? eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coach card */}
          <Link
            href={`/coach/${program.coachSlug}`}
            className="group flex items-center gap-3 rounded-[22px] border border-white/5 bg-white/[0.02] p-5 transition hover:border-white/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 font-mono text-base font-black uppercase text-[var(--accent)]">
              {program.coachName.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-white/30">Coach</p>
              <p className="truncate text-sm font-bold text-white">{program.coachName}</p>
            </div>
            <span className="text-xs text-white/15 transition group-hover:text-white/50">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--accent)]">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/4 py-2.5 last:border-0">
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="text-right text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

function ExercisePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-white/6 bg-white/[0.03] px-3 py-1.5 text-center sm:items-end sm:rounded-none sm:border-none sm:bg-transparent sm:p-0 sm:text-right">
      <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/25 sm:hidden">
        {label}
      </span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

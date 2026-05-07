"use client";

import { useState } from "react";
import Link from "next/link";

import { cancelSubscriptionAction, cancelPendingCoachSwitchAction } from "@/lib/actions";
import { PLATFORM_MONTHLY_PRICE } from "@/lib/domain";
import { MonthlyProgramSelector } from "@/components/monthly-program-selector";
import type { DifficultyValue } from "@/lib/domain";
import { difficultyLabels, formatDate, formatDuration, formatPrice } from "@/lib/utils";

/* ─────────────────── types ─────────────────── */

type Program = {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyValue;
  totalDurationMinutes: number;
  coverImage?: string | null;
  _count?: { workoutSessions: number };
};

type Subscription = {
  id: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
  commitmentEndDate: Date | null;
  plan: string;
  coach: {
    displayName: string;
    slug: string;
    headline: string;
    discipline: string;
    programs: Program[];
  } | null;
  pendingCoach: {
    displayName: string;
    slug: string;
    discipline: string;
  } | null;
};

type RecentView = {
  id: string;
  lastViewedAt: Date;
  program: {
    id: string;
    title: string;
    coachName: string;
  };
};

type MonthlySelection = {
  month: number;
  year: number;
  program: {
    id: string;
    title: string;
    description: string;
    coachName: string;
    coachSlug: string;
  };
};

type AvailableProgram = {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyValue;
  totalDurationMinutes: number;
  coachName: string;
  coachSlug: string;
};

type DashboardData = {
  subscriptions: Subscription[];
  recentPrograms: RecentView[];
  monthlySelections: MonthlySelection[];
};

/* ─────────────────── icon ─────────────────── */

function Icon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  dashboard:     "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  coaches:       "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  programs:      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20v19H6.5A2.5 2.5 0 0 1 4 19.5z",
  selection:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

type TabId = "dashboard" | "coaches" | "programs" | "selection";

const NAV: Array<{ id: TabId; label: string; icon: keyof typeof ICONS }> = [
  { id: "dashboard",  label: "Vue d'ensemble",   icon: "dashboard" },
  { id: "coaches",    label: "Mes coachs",        icon: "coaches" },
  { id: "programs",   label: "Programmes",        icon: "programs" },
  { id: "selection",  label: "Sélection du mois", icon: "selection" },
];

/* ─────────────────── panels ─────────────────── */

function DashboardPanel({ data }: { data: DashboardData }) {
  const activeCount = data.subscriptions.length;
  const programCount = data.subscriptions.reduce((s, sub) => s + (sub.coach?.programs.length ?? 0), 0);
  const recentCount = data.recentPrograms.length;

  return (
    <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
      <div className="border-b border-white/6 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Dashboard abonné</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">Vue d'ensemble</h2>
        <p className="mt-1.5 text-sm text-slate-400">Retrouve tes coachs actifs et accède rapidement à tes programmes.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Abonnements actifs", value: activeCount },
          { label: "Programmes débloqués", value: programCount },
          { label: "Récemment consultés", value: recentCount },
        ].map((m) => (
          <div key={m.label} className="rounded-[18px] border border-white/5 bg-white/[0.02] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{m.label}</p>
            <div className="mt-2 font-mono text-3xl font-black tracking-tighter text-[var(--accent)]">{m.value}</div>
          </div>
        ))}
      </div>

      {data.recentPrograms.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Récemment consultés</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.recentPrograms.map((view) => (
              <Link
                key={view.id}
                href={`/programmes/${view.program.id}`}
                className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4 transition hover:border-white/15"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{view.program.coachName}</div>
                <div className="mt-1.5 text-sm font-semibold text-white">{view.program.title}</div>
                <div className="mt-2 text-[11px] text-white/40">Vu le {formatDate(view.lastViewedAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function CoachesPanel({ data }: { data: DashboardData }) {
  return (
    <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
      <div className="border-b border-white/6 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Abonnements</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">Mes coachs</h2>
        <p className="mt-1.5 text-sm text-slate-400">Coachs auxquels tu es abonné et leurs programmes débloqués.</p>
      </div>

      {data.subscriptions.length ? (
        <div className="space-y-5">
          {data.subscriptions.map((sub) => (
            <article key={sub.id} className="rounded-[20px] border border-white/5 bg-white/[0.01] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight text-white">{sub.coach?.displayName ?? "Abonnement plateforme"}</h3>
                  <p className="mt-1 text-sm text-white/55">{sub.coach?.headline}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="app-chip px-3 py-1 text-xs">{sub.coach?.discipline ?? "Plateforme"}</span>
                    <span className="app-chip px-3 py-1 text-xs">{formatPrice(PLATFORM_MONTHLY_PRICE)} / mois</span>
                  </div>
                </div>
                <div className="rounded-[14px] border border-white/5 bg-white/[0.008] px-4 py-2.5 text-xs text-white/55">
                  Renouvellement : {formatDate(sub.currentPeriodEnd)}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/coach/${sub.coach?.slug ?? ""}`} className="app-button-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
                  Voir les programmes
                </Link>
                {sub.pendingCoach ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-[12px] border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-3 py-1.5 text-xs text-[var(--accent)]">
                      Changement prévu → <strong>{sub.pendingCoach.displayName}</strong>
                    </span>
                    <form action={cancelPendingCoachSwitchAction}>
                      <button type="submit" className="app-button-ghost px-4 py-2 text-xs text-white transition hover:border-white/30 hover:bg-white/10">
                        Annuler le changement
                      </button>
                    </form>
                  </div>
                ) : (
                  (() => {
                    const inCommitment = sub.commitmentEndDate && new Date(sub.commitmentEndDate) > new Date();
                    if (inCommitment) {
                      return (
                        <div className="flex flex-col gap-1.5">
                          <span className="rounded-[12px] border border-amber-400/25 bg-amber-400/8 px-3 py-1.5 text-xs text-amber-300">
                            Engagement jusqu'au {new Date(sub.commitmentEndDate!).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          <span className="text-[11px] text-white/35">Résiliation possible après cette date.</span>
                        </div>
                      );
                    }
                    return (
                      <form action={cancelSubscriptionAction.bind(null, sub.id)}>
                        <button type="submit" className="app-button-ghost px-4 py-2 text-xs text-white transition hover:border-white/30 hover:bg-white/10">
                          {sub.cancelAtPeriodEnd ? "Résiliation planifiée" : "Résilier en fin de période"}
                        </button>
                      </form>
                    );
                  })()
                )}
              </div>
              {(sub.coach?.programs.length ?? 0) > 0 && (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {(sub.coach?.programs ?? []).map((program) => (
                    <Link
                      key={program.id}
                      href={`/programmes/${program.id}`}
                      className="rounded-[16px] border border-white/4 bg-white/[0.008] p-3.5 text-sm transition hover:border-white/10"
                    >
                      <div className="font-semibold text-white">{program.title}</div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">{program.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="app-chip px-2 py-0.5 text-[10px]">{difficultyLabels[program.difficulty]}</span>
                        <span className="app-chip px-2 py-0.5 text-[10px]">{formatDuration(program.totalDurationMinutes)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/5 bg-white/[0.008] p-8 text-sm text-white/50">
          Aucun abonnement actif. <Link href="/coachs" className="text-[var(--accent)] hover:underline">Découvrir les coachs →</Link>
        </div>
      )}
    </main>
  );
}

function ProgramsPanel({ data }: { data: DashboardData }) {
  const allPrograms = data.subscriptions.flatMap((sub) =>
    (sub.coach?.programs ?? []).map((p) => ({ ...p, coachName: sub.coach?.displayName ?? "", coachSlug: sub.coach?.slug ?? "" }))
  );

  return (
    <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
      <div className="border-b border-white/6 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Bibliothèque</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">Programmes débloqués</h2>
        <p className="mt-1.5 text-sm text-slate-400">Tous les programmes accessibles via tes abonnements actifs.</p>
      </div>
      {allPrograms.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {allPrograms.map((program) => (
            <Link
              key={program.id}
              href={`/programmes/${program.id}`}
              className="group flex flex-col overflow-hidden rounded-[22px] border border-white/5 bg-white/[0.01] transition hover:border-white/15"
            >
              {/* Cover */}
              <div className="relative h-36 w-full overflow-hidden bg-white/4">
                {program.coverImage ? (
                  <img
                    src={program.coverImage}
                    alt={program.title}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0d0d0d] to-[#181818]">
                    <span className="font-mono text-2xl font-black uppercase text-white/10 tracking-widest">
                      {program.title.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,9,14,0.7)] to-transparent" />
                <div className="absolute bottom-2 left-3 flex gap-1.5">
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                    {difficultyLabels[program.difficulty]}
                  </span>
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                    {formatDuration(program.totalDurationMinutes)}
                  </span>
                  {program._count && program._count.workoutSessions > 0 && (
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                      {program._count.workoutSessions} séance{program._count.workoutSessions > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              {/* Body */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{program.coachName}</div>
                <h3 className="text-sm font-bold uppercase tracking-tight text-white">{program.title}</h3>
                <p className="line-clamp-2 text-xs leading-5 text-white/50">{program.description}</p>
                <div className="mt-auto pt-2 text-[11px] font-semibold text-white/40 transition group-hover:text-[var(--accent)]">
                  Voir le programme →
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/5 bg-white/[0.008] p-8 text-sm text-white/50">
          Aucun programme disponible. Abonne-toi à un coach pour accéder à ses programmes.
        </div>
      )}
    </main>
  );
}

function SelectionPanel({ data, availablePrograms }: { data: DashboardData; availablePrograms: AvailableProgram[] }) {
  return (
    <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
      <div className="border-b border-white/6 pb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Personnalisation</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">Sélection du mois</h2>
        <p className="mt-1.5 text-sm text-slate-400">Choisis le programme sur lequel tu vas te concentrer ce mois-ci.</p>
      </div>
      {availablePrograms.length ? (
        <MonthlyProgramSelector
          availablePrograms={availablePrograms}
          monthlySelections={data.monthlySelections}
        />
      ) : (
        <div className="rounded-[20px] border border-white/5 bg-white/[0.008] p-8 text-sm text-white/50">
          Aucun programme disponible. Abonne-toi à un coach pour pouvoir sélectionner un programme mensuel.
        </div>
      )}
    </main>
  );
}

/* ─────────────────── main component ─────────────────── */

export function UserDashboardClient({
  data,
  availablePrograms,
  displayName,
}: {
  data: DashboardData;
  availablePrograms: AvailableProgram[];
  displayName: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* ── Sidebar desktop ── */}
      <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-52 shrink-0 flex-col border-r border-white/6 bg-[#0a0a0a] lg:flex xl:w-56">
        <div className="border-b border-white/6 px-5 py-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--accent)]">Espace abonné</p>
          <p className="mt-0.5 truncate text-sm font-black uppercase tracking-widest text-white">{displayName}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                  isActive ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-slate-400 hover:bg-white/4 hover:text-white"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-[var(--accent)]" : "text-slate-600"}`}>
                  <Icon path={ICONS[item.icon]} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/6 p-4">
          <Link href="/coachs" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300">
            <Icon path="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" className="h-3.5 w-3.5" />
            Trouver un coach
          </Link>
        </div>
      </aside>

      {/* ── Mobile top tabs ── */}
      <div className="flex w-full flex-col lg:flex-1">
        <div className="flex overflow-x-auto border-b border-white/6 bg-[#0a0a0a] px-2 py-1 lg:hidden">
          {NAV.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative shrink-0 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${isActive ? "text-[var(--accent)]" : "text-slate-500 hover:text-slate-300"}`}
              >
                {item.label}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>

        {activeTab === "dashboard"  && <DashboardPanel data={data} />}
        {activeTab === "coaches"    && <CoachesPanel data={data} />}
        {activeTab === "programs"   && <ProgramsPanel data={data} />}
        {activeTab === "selection"  && <SelectionPanel data={data} availablePrograms={availablePrograms} />}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { selectMonthlyProgramAction } from "@/lib/actions";
import type { DifficultyValue } from "@/lib/domain";
import { difficultyLabels, formatDuration } from "@/lib/utils";

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

type AvailableProgram = {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyValue;
  totalDurationMinutes: number;
  coachName: string;
  coachSlug: string;
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

type Props = {
  availablePrograms: AvailableProgram[];
  monthlySelections: MonthlySelection[];
  selectionLimit: number;
  currentMonthSelectionCount: number;
};

export function MonthlyProgramSelector({
  availablePrograms,
  monthlySelections,
  selectionLimit,
  currentMonthSelectionCount,
}: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isPending, startTransition] = useTransition();

  const currentSelections = monthlySelections.filter((s) => s.month === month && s.year === year);
  const remainingSelections = Math.max(selectionLimit - currentSelections.length, 0);
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const counterValue = isCurrentMonth ? currentMonthSelectionCount : currentSelections.length;

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const select = (programId: string) => {
    const program = availablePrograms.find((entry) => entry.id === programId);
    if (!program) return;

    const alreadySelected = currentSelections.some((selection) => selection.program.id === programId);
    if (alreadySelected) return;

    const confirmation =
      selectionLimit === 1
        ? `Es-tu sûr de vouloir sélectionner "${program.title}" ? Une fois ton choix validé, tu ne pourras pas sélectionner d'autre programme avant le mois prochain.`
        : `Es-tu sûr de vouloir sélectionner "${program.title}" ? Après cette validation, il te restera ${Math.max(selectionLimit - (currentSelections.length + 1), 0)} sélection${selectionLimit - (currentSelections.length + 1) > 1 ? "s" : ""} pour ce mois.`;

    if (!window.confirm(confirmation)) {
      return;
    }

    startTransition(async () => {
      await selectMonthlyProgramAction(programId, month, year);
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Programme du mois</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {MONTHS_FR[month - 1]} {year}
          </h2>
          <p className="mt-2 text-xs text-white/52">
            {counterValue} / {selectionLimit} sélection{selectionLimit > 1 ? "s" : ""} utilisée{counterValue > 1 ? "s" : ""} sur cette période.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="app-button-ghost px-3 py-2 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10"
          >
            ←
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="app-button-ghost px-3 py-2 text-sm text-white/70 transition hover:border-white/30 hover:bg-white/10"
          >
            →
          </button>
        </div>
      </div>

      {currentSelections.length ? (
        <div className="rounded-[22px] border border-[var(--accent)]/30 bg-[rgba(207,253,90,0.05)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            {currentSelections.length > 1 ? "Programmes sélectionnés" : "Programme sélectionné"}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {currentSelections.map((selection) => (
              <div key={`${selection.program.id}-${selection.month}-${selection.year}`} className="rounded-[18px] border border-white/10 bg-black/15 p-4">
                <h3 className="text-base font-semibold text-white">{selection.program.title}</h3>
                <p className="mt-1 text-sm text-white/60">{selection.program.coachName}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">{selection.program.description}</p>
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/programmes/${selection.program.id}`}
                    className="app-button-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                  >
                    Ouvrir le programme
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[22px] border border-white/5 bg-white/[0.008] p-5">
          <p className="text-sm text-white/62">
            Aucun programme sélectionné pour {MONTHS_FR[month - 1]} {year}.
          </p>
          <p className="mt-1 text-xs text-white/42">
            Choisis un programme ci-dessous pour l'associer à ce mois.
          </p>
        </div>
      )}

      {availablePrograms.length > 0 ? (
        <div>
          <p className="mb-3 text-sm text-white/58">
            {remainingSelections > 0
              ? currentSelections.length > 0
                ? "Sélectionner un autre programme pour ce mois :"
                : "Choisir un programme pour ce mois :"
              : "Limite atteinte pour ce mois."}
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {availablePrograms.map((program) => {
              const isSelected = currentSelections.some((selection) => selection.program.id === program.id);
              const isDisabled = isPending || isSelected || remainingSelections === 0;
              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => select(program.id)}
                  disabled={isDisabled}
                  className={`rounded-[18px] border p-4 text-left transition ${
                    isSelected
                      ? "border-[var(--accent)]/40 bg-[rgba(207,253,90,0.07)] opacity-70"
                      : "border-white/5 bg-white/[0.008] hover:border-white/12 hover:bg-white/[0.015]"
                  } disabled:cursor-not-allowed`}
                >
                  <div className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">{program.coachName}</div>
                  <div className="mt-2 font-semibold text-white">{program.title}</div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/58">{program.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-white/42">
                    <span className="app-chip px-2 py-0.5">{difficultyLabels[program.difficulty]}</span>
                    <span className="app-chip px-2 py-0.5">{formatDuration(program.totalDurationMinutes)}</span>
                  </div>
                  {isSelected ? (
                    <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">Sélectionné ✓</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

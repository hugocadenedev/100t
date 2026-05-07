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
};

export function MonthlyProgramSelector({ availablePrograms, monthlySelections }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isPending, startTransition] = useTransition();

  const currentSelection = monthlySelections.find((s) => s.month === month && s.year === year);

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

      {currentSelection ? (
        <div className="rounded-[22px] border border-[var(--accent)]/30 bg-[rgba(207,253,90,0.05)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Programme sélectionné</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{currentSelection.program.title}</h3>
          <p className="mt-1 text-sm text-white/60">{currentSelection.program.coachName}</p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/70">{currentSelection.program.description}</p>
          <div className="mt-4 flex gap-3">
            <Link
              href={`/programmes/${currentSelection.program.id}`}
              className="app-button-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
            >
              Ouvrir le programme
            </Link>
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
            {currentSelection ? "Changer de programme pour ce mois :" : "Choisir un programme pour ce mois :"}
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {availablePrograms.map((program) => {
              const isSelected = currentSelection?.program.id === program.id;
              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => select(program.id)}
                  disabled={isPending || isSelected}
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

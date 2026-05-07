"use client";

import { useTransition } from "react";

import { selectMonthlyProgramAction } from "@/lib/actions";

interface SelectProgramButtonProps {
  programId: string;
  className?: string;
}

export default function SelectProgramButton({ programId, className }: SelectProgramButtonProps) {
  const [isPending, startTransition] = useTransition();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  function handleSelect() {
    startTransition(async () => {
      await selectMonthlyProgramAction(programId, month, year);
    });
  }

  return (
    <button
      onClick={handleSelect}
      disabled={isPending}
      className={className}
    >
      {isPending ? "Sélection…" : "Sélectionner ce mois"}
    </button>
  );
}

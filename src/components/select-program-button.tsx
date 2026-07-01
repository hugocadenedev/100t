"use client";

import { useTransition } from "react";

import { selectMonthlyProgramAction } from "@/lib/actions";

interface SelectProgramButtonProps {
  programId: string;
  className?: string;
  confirmMessage?: string;
}

export default function SelectProgramButton({ programId, className, confirmMessage }: SelectProgramButtonProps) {
  const [isPending, startTransition] = useTransition();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  function handleSelect() {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

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

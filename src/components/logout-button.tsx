"use client";

import { useTransition } from "react";

import { logoutAction } from "@/lib/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="app-button-ghost px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-100 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      onClick={() => startTransition(async () => logoutAction())}
      disabled={isPending}
    >
      {isPending ? "Déconnexion..." : "Déconnexion"}
    </button>
  );
}

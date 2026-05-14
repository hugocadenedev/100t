"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { switchCoachAction } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";

export function SubscribeModal({
  coachId,
  coachName,
  monthlyPrice,
  triggerClassName,
  isAuthenticated = true,
  redirectAfter,
}: {
  coachId: string;
  coachName: string;
  monthlyPrice: number;
  triggerClassName?: string;
  isAuthenticated?: boolean;
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      const dest = redirectAfter
        ? `/inscription?redirectAfter=${encodeURIComponent(redirectAfter)}`
        : "/inscription";
      router.push(dest);
      return;
    }
    setOpen(true);
  };

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId }),
        });
        const data: { url?: string; error?: string } = await res.json();
        if (!res.ok || !data.url) {
          setError(data.error ?? "Une erreur est survenue. Veuillez réessayer.");
          return;
        }
        window.location.href = data.url;
      } catch {
        setError("Une erreur réseau est survenue. Veuillez réessayer.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className={triggerClassName ?? "app-button-accent px-5 py-3 text-sm font-semibold transition hover:opacity-90"}
        onClick={handleOpenModal}
      >
        S'abonner à {formatPrice(monthlyPrice)} / mois
      </button>
      {open ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.82)] p-4">
          <div className="w-full max-w-lg rounded-[26px] border border-white/8 bg-[var(--surface)] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.52)]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Paiement sécurisé</p>
              <h3 className="text-3xl font-black uppercase tracking-tight text-white">Confirmer l'abonnement</h3>
              <p className="max-w-md text-sm leading-7 text-white/62">
                Tu vas débloquer immédiatement tous les programmes présents et futurs de {coachName}. Le paiement est traité de manière sécurisée via Stripe.
              </p>
            </div>
            <div className="mt-6 rounded-[16px] border border-white/6 bg-[var(--surface-strong)] p-4 text-sm text-white/78">
              <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                <span className="text-white/56">Montant mensuel</span>
                <strong className="text-base font-black text-white">{formatPrice(monthlyPrice)}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-white/56">Renouvellement</span>
                <span className="font-medium text-white/82">Mensuel · Annulable à tout moment</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-white/56">Paiement</span>
                <span className="font-medium text-white/82">🔒 Stripe</span>
              </div>
            </div>
            {error ? (
              <div className="mt-4 rounded-[18px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="app-button-ghost px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </button>
              <button
                type="button"
                className="app-button-accent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition hover:bg-white disabled:opacity-50"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending ? "Redirection vers Stripe…" : "Payer et débloquer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

export function SwitchCoachModal({
  coachId,
  coachName,
  monthlyPrice,
}: {
  coachId: string;
  coachName: string;
  monthlyPrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await switchCoachAction(coachId);
        if (result.status === "error") {
          setError(result.message ?? "Erreur inconnue.");
        } else {
          setSuccess(result.message ?? "Changement programmé.");
        }
      } catch {
        setError("Une erreur inattendue est survenue.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="app-button-accent px-5 py-3 text-sm font-semibold transition hover:opacity-90"
        onClick={() => setOpen(true)}
      >
        Changer pour {coachName}
      </button>
      {open ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.82)] p-4">
          <div className="w-full max-w-lg rounded-[26px] border border-white/8 bg-[var(--surface)] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.52)]">
            {success ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Changement programmé</p>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">{coachName}</h3>
                <p className="text-sm leading-7 text-white/62">{success}</p>
                <button
                  type="button"
                  className="app-button-accent px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
                  onClick={() => setOpen(false)}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Changer de coach</p>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-white">Confirmer le changement</h3>
                  <p className="max-w-md text-sm leading-7 text-white/62">
                    Ton abonnement actuel continuera jusqu&apos;à la fin de la période en cours. Dès le prochain renouvellement tu accèderas aux programmes de <strong className="text-white">{coachName}</strong>.
                  </p>
                </div>
                <div className="mt-6 rounded-[16px] border border-white/6 bg-[var(--surface-strong)] p-4 text-sm text-white/78">
                  <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3">
                    <span className="text-white/56">Tarif mensuel</span>
                    <strong className="text-base font-black text-white">{formatPrice(monthlyPrice)}</strong>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-white/56">Prise d&apos;effet</span>
                    <span className="font-medium text-white/82">Prochain renouvellement</span>
                  </div>
                </div>
                {error ? (
                  <div className="mt-4 rounded-[18px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="app-button-ghost px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="app-button-accent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition hover:bg-white disabled:opacity-50"
                    onClick={handleConfirm}
                    disabled={isPending}
                  >
                    {isPending ? "En cours…" : "Confirmer le changement"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

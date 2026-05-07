"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { adminCreatePdfProgramAction } from "@/lib/actions";
import { Difficulty } from "@/lib/domain";
import { difficultyOptions } from "@/lib/utils";
import { initialActionState } from "@/lib/validations";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="app-button-accent px-4 py-3 text-xs font-black uppercase tracking-widest transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
    >
      {pending ? "Import en cours..." : "Importer le programme PDF"}
    </button>
  );
}

export function AdminUploadProgramForm({
  coachOptions,
}: {
  coachOptions: Array<{
    id: string;
    displayName: string;
    discipline: string;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  }>;
}) {
  const [state, formAction] = useActionState(adminCreatePdfProgramAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm text-white/70">Coach destinataire</label>
        <select name="coachId" className="field" defaultValue="" required>
          <option value="" disabled>
            Sélectionner un coach
          </option>
          {coachOptions.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.displayName} • {coach.discipline} • {coach.approvalStatus}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Titre public</label>
          <input name="title" className="field" required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Description</label>
          <textarea name="description" className="field min-h-28" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Couverture optionnelle</label>
          <input name="coverImage" type="url" className="field" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Durée totale (minutes)</label>
          <input name="totalDurationMinutes" type="number" min={10} defaultValue={60} className="field" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Niveau</label>
          <select name="difficulty" defaultValue={Difficulty.DEBUTANT} className="field" required>
            {difficultyOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Fichier PDF</label>
          <input name="pdfFile" type="file" accept="application/pdf,.pdf" className="field file:mr-4 file:rounded-full file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-black" required />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">PDF max 10 Mo, publication immédiate.</p>
        <SubmitButton />
      </div>
    </form>
  );
}
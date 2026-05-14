"use client";

import React, { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import {
  deleteWorkoutSessionAction,
  reorderWorkoutSessionsAction,
  saveCoachProfileAction,
  saveWorkoutSessionAction,
} from "@/lib/actions";
import { Difficulty, PLATFORM_MONTHLY_PRICE, type DifficultyValue } from "@/lib/domain";
import { difficultyLabels, difficultyOptions, formatDate, formatPrice } from "@/lib/utils";
import { initialActionState } from "@/lib/validations";
import { ProgramSubmissionForm, ProgramSubmissionList } from "@/components/program-submission-form";
import type { ProgramLevelValue } from "@/lib/domain";

// ── Upload dropzone (profile photo & cover) ─────────────────────────────────
function ImageDropzone({
  name,
  endpoint,
  initialUrl,
  label,
  aspect,
}: {
  name: string;
  endpoint: string;
  initialUrl?: string | null;
  label: string;
  aspect: "square" | "cover";
}) {
  const [preview, setPreview] = React.useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState(initialUrl ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragRef = React.useRef<HTMLDivElement>(null);

  const uploadFile = React.useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'upload");
      setUrl(json.url);
      setPreview(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }, [endpoint]);

  const handleFiles = React.useCallback((files: FileList | null) => {
    if (!files?.length) return;
    uploadFile(files[0]);
  }, [uploadFile]);

  const isSquare = aspect === "square";

  return (
    <div className="space-y-1.5">
      <label className="text-sm text-white/70">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div
        ref={dragRef}
        role="button"
        tabIndex={0}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[16px] border-2 border-dashed border-white/10 bg-white/[0.02] transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/[0.03] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 ${
          isSquare ? "h-36 w-36" : "h-28 w-full"
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); dragRef.current?.classList.add("border-[var(--accent)]/60"); }}
        onDragLeave={() => dragRef.current?.classList.remove("border-[var(--accent)]/60")}
        onDrop={(e) => {
          e.preventDefault();
          dragRef.current?.classList.remove("border-[var(--accent)]/60");
          handleFiles(e.dataTransfer.files);
        }}
      >
        {preview ? (
          isSquare ? (
            <img src={preview} alt="Aperçu" className="h-full w-full rounded-[14px] object-cover" />
          ) : (
            <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
          )
        ) : uploading ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
            <span className="text-xs text-white/40">Upload…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-white/20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs text-white/40">Glisse ou <span className="font-semibold text-[var(--accent)]">parcourir</span></span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type ExerciseBlock = {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string | null;
  videoUrl?: string | null;
};

type WorkoutSession = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: DifficultyValue;
  videoUrl: string | null;
  order: number;
  exerciseBlocks: ExerciseBlock[];
};

type Program = {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  pdfUrl: string | null;
  difficulty: DifficultyValue;
  totalDurationMinutes: number;
  workoutSessions: WorkoutSession[];
};

type SubmissionPdf = {
  id: string;
  monthNumber: number;
  label: string | null;
  pdfUrl: string;
};

type ProgramSubmission = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  level: ProgramLevelValue;
  durationMonths: number;
  sessionsPerWeek: number;
  avgSessionMinutes: number;
  equipment: string;
  equipmentFreeText: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  createdAt: Date;
  pdfs: SubmissionPdf[];
};

type StudioData = {
  coach: {
    id: string;
    slug: string;
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
    reviewedAt: Date | null;
    reviewNotes: string | null;
    displayName: string;
    headline: string;
    bio: string;
    photoUrl: string | null;
    coverImageUrl: string | null;
    monthlyPrice: number;
    discipline: string;
    specialities: string;
    skills: string;
    experienceYears: number;
    coachedClientsCount: number;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    youtubeUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
    programs: Program[];
    programSubmissions: ProgramSubmission[];
  };
  metrics: {
    subscribers: number;
    programs: number;
    sessions: number;
  };
};

function CoachApplicationStatusPanel({ studio }: { studio: StudioData }) {
  const isPending = studio.coach.approvalStatus === "PENDING";

  return (
    <section className="rounded-[24px] border border-white/5 bg-white/[0.008] p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Candidature coach</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isPending ? "Demande en cours de validation" : "Demande refusée pour le moment"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-white/62">
            {isPending
              ? "Ton dossier a bien été transmis à l'administration. Le profil public et les outils de publication seront activés une fois la candidature approuvée."
              : "L'administration a refusé cette demande. Les éléments transmis restent affichés ici pour suivi interne et relecture."}
          </p>
        </div>
        <div className="app-chip px-4 py-2 text-sm text-white/76">
          Statut : {isPending ? "En attente" : "Refusée"}
        </div>
      </div>

      {studio.coach.reviewNotes ? (
        <div className="mt-5 rounded-[18px] border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-50">
          <div className="font-semibold">Retour de l'administration</div>
          <p className="mt-2 whitespace-pre-wrap text-rose-50/88">{studio.coach.reviewNotes}</p>
          {studio.coach.reviewedAt ? (
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-rose-50/55">
              Dernière revue le {formatDate(studio.coach.reviewedAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/42">Discipline</p>
          <div className="mt-2 text-sm font-semibold text-white">{studio.coach.discipline}</div>
        </div>
        <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/42">Expérience</p>
          <div className="mt-2 text-sm font-semibold text-white">{studio.coach.experienceYears} an(s)</div>
        </div>
        <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/42">Clients coachés</p>
          <div className="mt-2 text-sm font-semibold text-white">{studio.coach.coachedClientsCount}</div>
        </div>
        <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-white/42">Tarif souhaité</p>
          <div className="mt-2 text-sm font-semibold text-white">{formatPrice(PLATFORM_MONTHLY_PRICE)} / mois</div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/42">Accroche</p>
            <p className="mt-2 text-base font-semibold text-white">{studio.coach.headline}</p>
          </div>
          <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/42">Bio transmise</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/74">{studio.coach.bio}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/42">Spécialités</p>
              <p className="mt-2 text-sm text-white/76">{studio.coach.specialities}</p>
            </div>
            <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/42">Compétences</p>
              <p className="mt-2 text-sm text-white/76">{studio.coach.skills}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/42">Adresse</p>
            <p className="mt-2 text-sm text-white/76">{studio.coach.addressLine1}</p>
            <p className="mt-1 text-sm text-white/60">
              {studio.coach.postalCode} {studio.coach.city}, {studio.coach.country}
            </p>
            {studio.coach.phone ? <p className="mt-3 text-sm text-white/76">{studio.coach.phone}</p> : null}
          </div>
          <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/42">Liens transmis</p>
            <div className="mt-3 space-y-2 text-sm text-white/76">
              {[
                studio.coach.websiteUrl,
                studio.coach.instagramUrl,
                studio.coach.linkedinUrl,
                studio.coach.youtubeUrl,
                studio.coach.tiktokUrl,
              ]
                .filter(Boolean)
                .map((link) => (
                  <div key={link}>{link}</div>
                ))}
              {!studio.coach.websiteUrl &&
              !studio.coach.instagramUrl &&
              !studio.coach.linkedinUrl &&
              !studio.coach.youtubeUrl &&
              !studio.coach.tiktokUrl ? (
                <p className="text-white/48">Aucun réseau social renseigné.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PendingButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
      disabled={pending}
    >
      {pending ? "Enregistrement..." : label}
    </button>
  );
}

function ActionMessage({ message, status }: { message?: string; status: "idle" | "success" | "error" }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        status === "success"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          : "border-rose-400/30 bg-rose-400/10 text-rose-100"
      }`}
    >
      {message}
    </div>
  );
}

function ReorderList({ programId, sessions }: { programId: string; sessions: WorkoutSession[] }) {
  const [items, setItems] = useState(sessions);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [state, formAction] = useActionState(reorderWorkoutSessionsAction, initialActionState);

  return (
    <div className="rounded-[20px] border border-white/5 bg-white/[0.008] p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-white">Réorganiser les séances</h4>
          <p className="text-sm text-white/58">Glisse-dépose les cartes pour changer l'ordre.</p>
        </div>
      </div>
      <ActionMessage message={state.message} status={state.status} />
      <div className="space-y-2">
        {items.map((session) => (
          <div
            key={session.id}
            draggable
            onDragStart={() => setDraggedId(session.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggedId || draggedId === session.id) {
                return;
              }

              const next = [...items];
              const fromIndex = next.findIndex((item) => item.id === draggedId);
              const toIndex = next.findIndex((item) => item.id === session.id);
              const [moved] = next.splice(fromIndex, 1);
              next.splice(toIndex, 0, moved);
              setItems(next);
              setDraggedId(null);
            }}
            className="rounded-[16px] border border-white/4 bg-white/[0.008] px-4 py-3 text-sm text-white/80"
          >
            <strong className="text-white">#{items.findIndex((item) => item.id === session.id) + 1}</strong> {session.title}
          </div>
        ))}
      </div>
      <form action={formAction} className="flex items-center justify-end">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="orderedSessionIds" value={items.map((item) => item.id).join(",")} />
        <PendingButton label="Enregistrer l'ordre" />
      </form>
    </div>
  );
}

function SessionEditor({
  programId,
  session,
}: {
  programId: string;
  session?: WorkoutSession;
}) {
  const [state, formAction] = useActionState(saveWorkoutSessionAction, initialActionState);
  const [isDeleting, startDeleting] = useTransition();
  const [blocks, setBlocks] = useState<ExerciseBlock[]>(
    session?.exerciseBlocks.length
      ? session.exerciseBlocks
      : [{ name: "", sets: 3, reps: "10 reps", restSeconds: 60, notes: "", videoUrl: "" }],
  );

  const serializedBlocks = useMemo(() => JSON.stringify(blocks), [blocks]);

  const addBlock = () => {
    setBlocks((current) => [
      ...current,
      { name: "", sets: 3, reps: "10 reps", restSeconds: 60, notes: "", videoUrl: "" },
    ]);
  };

  const updateBlock = (index: number, key: keyof ExerciseBlock, value: string) => {
    setBlocks((current) =>
      current.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              [key]: key === "sets" || key === "restSeconds" ? Number(value) : value,
            }
          : block,
      ),
    );
  };

  const removeBlock = (index: number) => {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
  };

  return (
    <div className="rounded-[20px] border border-white/5 bg-white/[0.008] p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-white">
            {session ? `Modifier : ${session.title}` : "Nouvelle séance"}
          </h4>
          <p className="text-sm text-white/58">Décris la séance et structure les blocs d'exercices.</p>
        </div>
        {session ? (
          <button
            type="button"
            className="rounded-full bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/15"
            onClick={() => startDeleting(async () => deleteWorkoutSessionAction(session.id))}
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </button>
        ) : null}
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="sessionId" value={session?.id || ""} />
        <input type="hidden" name="exerciseBlocks" value={serializedBlocks} />
        <ActionMessage message={state.message} status={state.status} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Titre</label>
            <input name="title" defaultValue={session?.title} className="field" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Durée (minutes)</label>
            <input name="durationMinutes" type="number" min={5} defaultValue={session?.durationMinutes || 45} className="field" required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Description</label>
          <textarea name="description" defaultValue={session?.description} className="field min-h-28" required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Niveau</label>
            <select name="difficulty" defaultValue={session?.difficulty || Difficulty.DEBUTANT} className="field" required>
              {difficultyOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Lien vidéo optionnel</label>
            <input name="videoUrl" type="url" defaultValue={session?.videoUrl || ""} className="field" />
          </div>
        </div>
        <div className="rounded-[18px] border border-white/5 bg-white/[0.008] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h5 className="text-base font-semibold text-white">Blocs d'exercices</h5>
              <p className="text-sm text-white/58">Ajoute les séries, répétitions, repos et notes pour chaque bloc.</p>
            </div>
            <button
              type="button"
              className="app-button-ghost px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/10"
              onClick={addBlock}
            >
              Ajouter un bloc
            </button>
          </div>
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div key={`${session?.id || "new"}-${index}`} className="rounded-[18px] border border-white/4 bg-white/[0.008] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <strong className="text-sm text-white">Bloc {index + 1}</strong>
                  {blocks.length > 1 ? (
                    <button
                      type="button"
                      className="text-sm text-rose-100/90"
                      onClick={() => removeBlock(index)}
                    >
                      Retirer
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input
                    className="field"
                    placeholder="Exercice"
                    value={block.name}
                    onChange={(event) => updateBlock(index, "name", event.target.value)}
                  />
                  <input
                    className="field"
                    type="number"
                    min={1}
                    placeholder="Séries"
                    value={block.sets}
                    onChange={(event) => updateBlock(index, "sets", event.target.value)}
                  />
                  <input
                    className="field"
                    placeholder="Répétitions ou durée"
                    value={block.reps}
                    onChange={(event) => updateBlock(index, "reps", event.target.value)}
                  />
                  <input
                    className="field"
                    type="number"
                    min={0}
                    placeholder="Repos en secondes"
                    value={block.restSeconds}
                    onChange={(event) => updateBlock(index, "restSeconds", event.target.value)}
                  />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    className="field"
                    placeholder="Notes optionnelles"
                    value={block.notes || ""}
                    onChange={(event) => updateBlock(index, "notes", event.target.value)}
                  />
                  <input
                    className="field"
                    type="url"
                    placeholder="URL vidéo optionnelle"
                    value={block.videoUrl || ""}
                    onChange={(event) => updateBlock(index, "videoUrl", event.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <PendingButton label={session ? "Mettre à jour la séance" : "Créer la séance"} />
        </div>
      </form>
    </div>
  );
}

function ProgramsPanel({ submissions }: { submissions: ProgramSubmission[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
      <div className="border-b border-white/6 pb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Programmes</p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">Mes dépôts</h2>
          <p className="mt-1.5 text-sm text-slate-400">Programmes soumis à l'administration pour validation et publication.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="app-button-accent shrink-0 px-5 py-2.5 text-xs font-black uppercase tracking-widest transition hover:bg-white"
        >
          {showForm ? "Annuler" : "+ Nouveau programme"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Nouveau dépôt</p>
          <ProgramSubmissionForm />
        </div>
      )}

      <ProgramSubmissionList submissions={submissions} />
    </main>
  );
}

type CoachTab = "dashboard" | "profile" | "programs";

const COACH_NAV: Array<{ id: CoachTab; label: string; path: string }> = [
  { id: "dashboard", label: "Tableau de bord", path: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { id: "profile",   label: "Mon profil",       path: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { id: "programs",  label: "Programmes",        path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
];

function CoachIcon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function CoachStudioClient({ studio, categories = [] }: { studio: StudioData; categories?: { id: string; name: string }[] }) {
  const [profileState, profileAction] = useActionState(saveCoachProfileAction, initialActionState);
  const [activeTab, setActiveTab] = useState<CoachTab>("dashboard");
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>(
    () => (studio.coach.specialities ? studio.coach.specialities.split(", ").filter(Boolean) : []),
  );

  if (studio.coach.approvalStatus !== "APPROVED") {
    return <CoachApplicationStatusPanel studio={studio} />;
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* ── Sidebar desktop ── */}
      <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-52 shrink-0 flex-col border-r border-white/6 bg-[#0a0a0a] lg:flex xl:w-56">
        <div className="border-b border-white/6 px-5 py-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--accent)]">Studio Coach</p>
          <p className="mt-0.5 truncate text-sm font-black uppercase tracking-widest text-white">{studio.coach.displayName}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {COACH_NAV.map((item) => {
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
                  <CoachIcon path={item.path} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/6 p-4 space-y-2">
          <Link href={`/coach/${studio.coach.slug}`} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300">
            <CoachIcon path="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" className="h-3.5 w-3.5" />
            Page publique
          </Link>
          <Link href="/" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300">
            <CoachIcon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" className="h-3.5 w-3.5" />
            Marketplace
          </Link>
        </div>
      </aside>

      {/* ── Mobile top tabs ── */}
      <div className="flex w-full flex-col lg:flex-1">
        <div className="flex overflow-x-auto border-b border-white/6 bg-[#0a0a0a] px-2 py-1 lg:hidden">
          {COACH_NAV.map((item) => {
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

        {/* ── Dashboard panel ── */}
        {activeTab === "dashboard" && (
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
          <div className="border-b border-white/6 pb-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Coach</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">Tableau de bord</h2>
            <p className="mt-1 text-sm text-slate-400">Statistiques de ton espace coach.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Abonnés", value: studio.metrics.subscribers },
              { label: "Programmes", value: studio.metrics.programs },
              { label: "Séances", value: studio.metrics.sessions },
            ].map((m) => (
              <div key={m.label} className="rounded-[18px] border border-white/5 bg-white/[0.02] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{m.label}</p>
                <div className="mt-2 font-mono text-3xl font-black tracking-tighter text-[var(--accent)]">{m.value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-5 space-y-3 text-sm text-slate-400">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Infos rapides</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><span className="text-white/50">Discipline : </span><span className="text-white">{studio.coach.discipline}</span></div>
              <div><span className="text-white/50">Spécialités : </span><span className="text-white">{studio.coach.specialities}</span></div>
              <div><span className="text-white/50">Ville : </span><span className="text-white">{studio.coach.city}</span></div>
              <div><span className="text-white/50">Expérience : </span><span className="text-white">{studio.coach.experienceYears} an(s)</span></div>
            </div>
          </div>
        </main>
        )}

        {/* ── Profile panel ── */}
        {activeTab === "profile" && (
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6">
          <div className="border-b border-white/6 pb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">Profil public</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">{studio.coach.displayName}</h2>
            </div>
            <div className="app-chip px-4 py-2 text-sm text-white/70">
              Tarif plateforme : {formatPrice(PLATFORM_MONTHLY_PRICE)} / mois
            </div>
          </div>
          <form action={profileAction} className="space-y-4">
            <ActionMessage message={profileState.message} status={profileState.status} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Slug public</label>
                <input name="slug" defaultValue={studio.coach.slug} className="field" required />
              </div>
              {/* Photos */}
              <div className="md:col-span-2 grid gap-4 sm:grid-cols-[auto_1fr]">
                <ImageDropzone
                  name="photoUrl"
                  endpoint="/api/upload/photo"
                  initialUrl={studio.coach.photoUrl}
                  label="Photo de profil"
                  aspect="square"
                />
                <ImageDropzone
                  name="coverImageUrl"
                  endpoint="/api/upload/cover"
                  initialUrl={studio.coach.coverImageUrl}
                  label="Photo de couverture (bannière)"
                  aspect="cover"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70">Accroche</label>
                <input name="headline" defaultValue={studio.coach.headline} className="field" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70">Bio</label>
                <textarea name="bio" defaultValue={studio.coach.bio} className="field min-h-32" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Années d'expérience</label>
                <input name="experienceYears" type="number" min={0} defaultValue={studio.coach.experienceYears} className="field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Clients coachés</label>
                <input name="coachedClientsCount" type="number" min={0} defaultValue={studio.coach.coachedClientsCount} className="field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Discipline</label>
                <input name="discipline" defaultValue={studio.coach.discipline} className="field" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70">Spécialités</label>
                <input type="hidden" name="specialities" value={selectedSpecialities.join(", ")} />
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedSpecialities.includes(cat.name);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setSelectedSpecialities((prev) =>
                            isSelected ? prev.filter((s) => s !== cat.name) : [...prev, cat.name],
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white/80"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                {categories.length === 0 && (
                  <p className="text-xs text-white/40">Aucune catégorie configurée par l&apos;administration.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Compétences</label>
                <input name="skills" defaultValue={studio.coach.skills} className="field" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-white/70">Adresse professionnelle</label>
                <input name="addressLine1" defaultValue={studio.coach.addressLine1} className="field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Ville</label>
                <input name="city" defaultValue={studio.coach.city} className="field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Code postal</label>
                <input name="postalCode" defaultValue={studio.coach.postalCode} className="field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Pays</label>
                <input name="country" defaultValue={studio.coach.country} className="field" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Téléphone</label>
                <input name="phone" defaultValue={studio.coach.phone || ""} className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Site web</label>
                <input name="websiteUrl" type="url" defaultValue={studio.coach.websiteUrl || ""} className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Instagram</label>
                <input name="instagramUrl" type="url" defaultValue={studio.coach.instagramUrl || ""} className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">LinkedIn</label>
                <input name="linkedinUrl" type="url" defaultValue={studio.coach.linkedinUrl || ""} className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">YouTube</label>
                <input name="youtubeUrl" type="url" defaultValue={studio.coach.youtubeUrl || ""} className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">TikTok</label>
                <input name="tiktokUrl" type="url" defaultValue={studio.coach.tiktokUrl || ""} className="field" />
              </div>
            </div>
            <div className="flex justify-end">
              <PendingButton label="Mettre à jour le profil" />
            </div>
          </form>
        </main>
        )}

        {/* ── Programs panel ── */}
        {activeTab === "programs" && (
        <ProgramsPanel submissions={studio.coach.programSubmissions} />
        )}

      </div>
    </div>
  );
}

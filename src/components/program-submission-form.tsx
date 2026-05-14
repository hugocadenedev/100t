"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { submitProgramAction } from "@/lib/actions";
import { EQUIPMENT_OPTIONS, ProgramLevel, programLevelValues } from "@/lib/domain";
import { programLevelLabels } from "@/lib/utils";
import { initialActionState } from "@/lib/validations";
import type { ProgramLevelValue } from "@/lib/domain";

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
  equipment: string; // JSON string
  equipmentFreeText: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  createdAt: Date;
  pdfs: SubmissionPdf[];
};

const statusLabels: Record<ProgramSubmission["status"], string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Refusé",
};

const statusStyles: Record<ProgramSubmission["status"], string> = {
  PENDING: "border-amber-400/25 bg-amber-400/10 text-amber-100",
  APPROVED: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
  REJECTED: "border-rose-400/25 bg-rose-400/10 text-rose-100",
};

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Envoi en cours…" : editing ? "Mettre à jour le dépôt" : "Envoyer à l'administration"}
    </button>
  );
}

function CoverDropZone({
  existingUrl,
  onChange,
}: {
  existingUrl?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format invalide. Utilise JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image dépasse la limite de 5 Mo.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <div
        className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed transition ${isDragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-white/15 bg-white/[0.018] hover:border-white/30"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Aperçu couverture" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100">
              <p className="text-sm font-semibold text-white">Changer l'image</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/6 text-2xl">🖼</div>
            <p className="text-sm font-medium text-white/70">Glisse une image ici</p>
            <p className="text-xs text-white/40">JPG, PNG ou WebP · Max 5 Mo</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
    </>
  );
}

function PdfDropZone({
  existingUrl,
  onChange,
  label,
}: {
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(
    existingUrl ? existingUrl.split('/').pop() ?? null : null
  );
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > 190 * 1024 * 1024) {
      setError('Le PDF dépasse la limite de 190 Mo.');
      return;
    }
    setFileName(file.name);
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <div
        className={`flex cursor-pointer items-center gap-4 rounded-[18px] border-2 border-dashed px-5 py-4 transition ${
          isDragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-white/15 bg-white/[0.018] hover:border-white/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-lg">📄</div>
        <div className="min-w-0 flex-1">
          {fileName ? (
            <>
              <p className="truncate text-sm font-medium text-white">{fileName}</p>
              <p className="mt-0.5 text-xs text-white/40">Clique ou glisse pour remplacer</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white/70">Glisse le PDF ici</p>
              <p className="mt-0.5 text-xs text-white/40">PDF uniquement · Max 190 Mo</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
    </>
  );
}

export function ProgramSubmissionForm({
  submission,
}: {
  submission?: ProgramSubmission;
}) {
  const [state, formAction] = useActionState(submitProgramAction, initialActionState);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (coverFile) formData.set("coverImageFile", coverFile);
    if (pdfFile) formData.set("pdfFile", pdfFile);
    startTransition(() => formAction(formData));
  };

  const isPending = submission?.status === "PENDING";
  const isEditing = Boolean(submission && isPending);

  const parsedEquipment: string[] = submission?.equipment
    ? (JSON.parse(submission.equipment) as string[])
    : [];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {submission && <input type="hidden" name="submissionId" value={submission.id} />}

      {state.status !== "idle" && state.message ? (
        <div
          className={`rounded-[18px] border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      {/* Titre + Description */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Titre du programme <span className="text-rose-400">*</span></label>
          <input
            name="title"
            defaultValue={submission?.title}
            className="field"
            placeholder="Ex : Programme force 12 semaines"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/70">Description <span className="text-rose-400">*</span></label>
          <textarea
            name="description"
            defaultValue={submission?.description}
            className="field min-h-32"
            placeholder="Décris l'objectif, le public cible et l'approche pédagogique…"
            required
          />
        </div>
      </div>

      {/* Image de couverture */}
      <div className="space-y-2">
        <label className="text-sm text-white/70">Image de couverture</label>
        <CoverDropZone
          existingUrl={submission?.coverImageUrl}
          onChange={handleCoverChange}
        />
        {/* Keep existing URL if no new file uploaded */}
        {submission?.coverImageUrl && !coverFile && (
          <input type="hidden" name="coverImageUrl" value={submission.coverImageUrl} />
        )}
      </div>

      {/* PDF Mois 1 — obligatoire */}
      <div className="space-y-2">
        <label className="text-sm text-white/70">
          PDF – Mois 1 <span className="text-rose-400">*</span>
          <span className="ml-2 text-white/30 font-normal">(obligatoire)</span>
        </label>
        <PdfDropZone
          existingUrl={submission?.pdfs.find((p) => p.monthNumber === 1)?.pdfUrl ?? null}
          onChange={(file) => setPdfFile(file)}
          label="Mois 1"
        />
      </div>

      {/* Niveau + Durée */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm text-white/70">Niveau <span className="text-rose-400">*</span></label>
          <select
            name="level"
            defaultValue={submission?.level ?? ProgramLevel.ACCESSIBLE_TOUS}
            className="field"
            required
          >
            {programLevelValues.map((v) => (
              <option key={v} value={v}>
                {programLevelLabels[v]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Durée totale <span className="text-rose-400">*</span></label>
          <div className="relative">
            <input
              name="durationMonths"
              type="number"
              min={1}
              max={24}
              defaultValue={submission?.durationMonths ?? 3}
              className="field pr-14"
              required
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">mois</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Séances / semaine <span className="text-rose-400">*</span></label>
          <input
            name="sessionsPerWeek"
            type="number"
            min={1}
            max={14}
            defaultValue={submission?.sessionsPerWeek ?? 3}
            className="field"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Durée moy. / séance <span className="text-rose-400">*</span></label>
          <div className="relative">
            <input
              name="avgSessionMinutes"
              type="number"
              min={10}
              max={300}
              defaultValue={submission?.avgSessionMinutes ?? 60}
              className="field pr-14"
              required
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">min</span>
          </div>
        </div>
      </div>

      {/* Équipement */}
      <div className="space-y-3">
        <label className="text-sm text-white/70">Équipement requis <span className="text-rose-400">*</span></label>
        <div className="grid gap-3 sm:grid-cols-2">
          {EQUIPMENT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-white/8 bg-white/[0.018] px-4 py-3 text-sm text-white/80 transition hover:border-white/20 has-[:checked]:border-[var(--accent)]/40 has-[:checked]:bg-[var(--accent)]/5 has-[:checked]:text-white"
            >
              <input
                type="checkbox"
                name="equipment"
                value={option.value}
                defaultChecked={parsedEquipment.includes(option.value)}
                className="h-4 w-4 rounded accent-[var(--accent)]"
              />
              {option.label}
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/40">Autre (texte libre)</label>
          <input
            name="equipmentFreeText"
            defaultValue={submission?.equipmentFreeText ?? ""}
            className="field"
            placeholder="Ex : Haltères réglables, barre de traction…"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton editing={isEditing} />
      </div>
    </form>
  );
}

export function ProgramSubmissionList({
  submissions,
}: {
  submissions: ProgramSubmission[];
}) {
  if (!submissions.length) {
    return (
      <div className="rounded-[22px] border border-white/5 bg-white/[0.008] p-8 text-sm text-white/60">
        Aucun dépôt pour le moment. Utilise le formulaire ci-dessus pour soumettre un programme.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        let equipment: string[] = [];
        try { equipment = JSON.parse(sub.equipment) as string[]; } catch { /* noop */ }
        const equipmentLabels = equipment
          .map((v) => EQUIPMENT_OPTIONS.find((o) => o.value === v)?.label ?? v)
          .join(", ");

        return (
          <article
            key={sub.id}
            className="rounded-[20px] border border-white/5 bg-white/[0.008] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-white">{sub.title}</h4>
                <p className="mt-1 text-sm text-white/56">{sub.description}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusStyles[sub.status]}`}
              >
                {statusLabels[sub.status]}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
              <span className="app-chip px-2.5 py-1">{programLevelLabels[sub.level]}</span>
              <span className="app-chip px-2.5 py-1">{sub.durationMonths} mois</span>
              <span className="app-chip px-2.5 py-1">{sub.sessionsPerWeek} séances/sem.</span>
              <span className="app-chip px-2.5 py-1">{sub.avgSessionMinutes} min/séance</span>
              {equipmentLabels && <span className="app-chip px-2.5 py-1">{equipmentLabels}</span>}
              {sub.equipmentFreeText && <span className="app-chip px-2.5 py-1">{sub.equipmentFreeText}</span>}
            </div>
            {sub.adminNotes ? (
              <div className="mt-4 rounded-[14px] border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                <strong className="text-xs uppercase tracking-wider">Note de l'administration :</strong>
                <p className="mt-1">{sub.adminNotes}</p>
              </div>
            ) : null}
            <MonthlyPdfManager submission={sub} />
          </article>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MonthlyPdfManager — manage PDFs month by month after submission
// ──────────────────────────────────────────────────────────────────────────────

function UploadPdfButton({ isPending }: { isPending: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || isPending}
      className="mt-2 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Envoi…" : "Déposer ce PDF"}
    </button>
  );
}

function MonthSlotUploader({
  submissionId,
  monthNumber,
}: {
  submissionId: string;
  monthNumber: number;
}) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ status: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pdfFile) return;
    setUploading(true);
    setMessage(null);
    const fd = new FormData();
    fd.set("file", pdfFile);
    fd.set("submissionId", submissionId);
    fd.set("monthNumber", String(monthNumber));
    try {
      const res = await fetch("/api/upload/pdf", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ status: "error", text: json.error ?? "Erreur lors de l'upload." });
      } else {
        setMessage({ status: "success", text: `PDF du mois ${monthNumber} enregistré.` });
        setPdfFile(null);
        router.refresh();
      }
    } catch {
      setMessage({ status: "error", text: "Erreur réseau lors de l'upload." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <PdfDropZone
        onChange={(file) => setPdfFile(file)}
        label={`Mois ${monthNumber}`}
      />
      {message ? (
        <p className={`text-xs ${message.status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
          {message.text}
        </p>
      ) : null}
      {pdfFile ? <UploadPdfButton isPending={uploading} /> : null}
    </form>
  );
}

function MonthlyPdfManager({ submission }: { submission: ProgramSubmission }) {
  return (
    <div className="mt-4 space-y-4">
      <h5 className="text-xs font-semibold uppercase tracking-wider text-white/40">
        PDFs du programme ({submission.pdfs.length}/{submission.durationMonths} mois)
      </h5>

      <div className="grid gap-3">
        {Array.from({ length: submission.durationMonths }, (_, i) => i + 1).map((monthNumber) => {
          const existingPdf = submission.pdfs.find((p) => p.monthNumber === monthNumber);

          return (
            <div
              key={monthNumber}
              className={`rounded-[16px] border px-4 py-3 ${
                existingPdf
                  ? "border-emerald-400/20 bg-emerald-400/5"
                  : "border-amber-400/20 bg-amber-400/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white/80">
                  Mois {monthNumber}
                  {monthNumber === 1 ? " (initial)" : ""}
                </span>
                {existingPdf ? (
                  <a
                    href={existingPdf.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-400/10"
                  >
                    📄 Voir le PDF
                  </a>
                ) : (
                  <span className="text-xs text-amber-300/70">PDF manquant</span>
                )}
              </div>

              {!existingPdf ? (
                <MonthSlotUploader submissionId={submission.id} monthNumber={monthNumber} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

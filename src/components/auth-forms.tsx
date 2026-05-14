"use client";

import Link from "next/link";
import { useActionState, useCallback, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/actions";
import { Role } from "@/lib/domain";
import { initialActionState } from "@/lib/validations";

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="app-button-accent w-full px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
      disabled={pending}
    >
      {pending ? "Chargement..." : children}
    </button>
  );
}

/* ── Photo drag-and-drop zone ── */
function PhotoDropzone({ name = "photoUrl" }: { name?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/photo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'upload");
      setUrl(json.url);
      setPreview(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    uploadFile(files[0]);
  }, [uploadFile]);

  return (
    <div className="space-y-2">
      {/* Hidden field carries the final URL to the form action */}
      <input type="hidden" name={name} value={url} />

      {/* Drop zone */}
      <div
        ref={dragRef}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt photo de profil"
        className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-white/10 bg-white/[0.02] transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/[0.03] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
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
          <img src={preview} alt="Aperçu" className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--accent)]/30" />
        ) : uploading ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
            <span className="text-xs text-white/40">Upload en cours…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-white/20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs text-white/40">
              Glisse ta photo ici ou <span className="font-semibold text-[var(--accent)]">parcourir</span>
            </span>
            <span className="text-[10px] text-white/20">JPG, PNG, WebP • max 5 Mo</span>
          </div>
        )}

        {preview && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPreview(null); setUrl(""); }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white/60 hover:text-white"
            aria-label="Supprimer la photo"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

/* ── Diploma file drop zone ── */
function DiplomaDropzone() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload/diploma", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'upload");
      setUrl(json.url);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <div className="space-y-2">
      <input type="hidden" name="diplomaFileUrl" value={url} />
      <div
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt justificatif de diplôme"
        className="relative flex min-h-[80px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-white/10 bg-white/[0.02] px-4 text-center transition hover:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--accent)]" />
            <span className="text-xs text-white/40">Upload en cours…</span>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-400">✓</span>
            <span className="text-sm text-white/70 truncate max-w-[240px]">{fileName}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFileName(null); setUrl(""); }}
              className="ml-1 text-xs text-white/30 hover:text-white/60"
            >✕</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-white/40">
              Glisse ton justificatif ou <span className="font-semibold text-[var(--accent)]">parcourir</span>
            </span>
            <span className="text-[10px] text-white/20">PDF, JPG, PNG • max 5 Mo</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function FormMessage({ message, type }: { message?: string; type: "success" | "error" | "idle" }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          : "border-rose-400/30 bg-rose-400/10 text-rose-100"
      }`}
    >
      {message}
    </div>
  );
}

function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-[52rem] rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-7">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/62">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function CoachStepPill({
  active,
  done,
  index,
  label,
}: {
  active: boolean;
  done: boolean;
  index: number;
  label: string;
}) {
  return (
    <div
      className={`rounded-[18px] border px-3 py-3 text-left transition ${
        active
          ? "border-[var(--accent)] bg-[rgba(207,253,90,0.12)] text-white"
          : done
            ? "border-white/8 bg-white/[0.05] text-white/82"
            : "border-white/6 bg-white/[0.02] text-white/46"
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.18em]">Etape {index + 1}</div>
      <div className="mt-2 text-sm font-semibold">{label}</div>
    </div>
  );
}

const DIPLOMA_OPTIONS = [
  "Brevet d'État",
  "Brevet Professionnel",
  "BPJEPS AGFF",
  "CQP",
] as const;

function CoachApplicationFields({ categories }: { categories: { id: string; name: string }[] }) {
  const [step, setStep] = useState(0);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedDiplomas, setSelectedDiplomas] = useState<string[]>([]);
  const [customDiploma, setCustomDiploma] = useState("");
  const [discipline, setDiscipline] = useState("");

  const toggleSport = (name: string) =>
    setSelectedSports((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );

  const toggleDiploma = (name: string) =>
    setSelectedDiplomas((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  const stepRefs = useRef<Array<HTMLFieldSetElement | null>>([]);

  const stepLabels = ["Compte", "Positionnement", "Profil public", "Coordonnées"];

  const validateCurrentStep = () => {
    const fieldset = stepRefs.current[step];

    if (!fieldset) {
      return true;
    }

    const inputs = Array.from(fieldset.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"));

    for (const input of inputs) {
      if (!input.reportValidity()) {
        input.focus();
        return false;
      }
    }

    return true;
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-2 md:grid-cols-4">
        {stepLabels.map((label, index) => (
          <CoachStepPill key={label} active={step === index} done={step > index} index={index} label={label} />
        ))}
      </div>

      <fieldset ref={(node) => void (stepRefs.current[0] = node)} className={step === 0 ? "space-y-4" : "hidden"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="firstName">
              Prénom
            </label>
            <input id="firstName" name="firstName" required className="field" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="lastName">
              Nom
            </label>
            <input id="lastName" name="lastName" required className="field" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="register-email">
            Adresse email
          </label>
          <input id="register-email" name="email" type="email" required className="field" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="register-password">
              Mot de passe
            </label>
            <input id="register-password" name="password" type="password" minLength={8} required className="field" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="confirmPassword">
              Confirmation
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required className="field" />
          </div>
        </div>
      </fieldset>

      <fieldset ref={(node) => void (stepRefs.current[1] = node)} className={step === 1 ? "space-y-5" : "hidden"}>
        {/* Hidden fields storing multi-select values */}
        <input type="hidden" name="discipline" value={discipline} />
        <input
          type="hidden"
          name="specialities"
          value={selectedSports.join(", ")}
        />
        <input
          type="hidden"
          name="diplomas"
          value={JSON.stringify([
            ...selectedDiplomas,
            ...(customDiploma.trim() ? [`Autre: ${customDiploma.trim()}`] : []),
          ])}
        />

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm text-white/75" htmlFor="headline">
            Accroche professionnelle
          </label>
          <input
            id="headline"
            name="headline"
            minLength={12}
            required
            className="field"
            placeholder="Ex: Préparation physique sur mesure pour performance et transformation durable"
          />
        </div>

        {/* Sport pratiqué actuellement — champ texte libre */}
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="discipline">
            Sport pratiqué actuellement
          </label>
          <input
            id="discipline"
            name="_discipline_display"
            className="field"
            placeholder="CrossFit, Hyrox, Running..."
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          />
        </div>

        {/* Spécialité — catégories multi-select */}
        <div className="space-y-2">
          <p className="text-sm text-white/75">Spécialité</p>
          {categories.length === 0 ? (
            <p className="text-xs text-white/30">Aucune catégorie configurée pour l'instant.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleSport(cat.name)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selectedSports.includes(cat.name)
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Diplômes */}
        <div className="space-y-3">
          <p className="text-sm text-white/75">Diplômes</p>
          <div className="flex flex-wrap gap-2">
            {DIPLOMA_OPTIONS.map((diploma) => (
              <button
                key={diploma}
                type="button"
                onClick={() => toggleDiploma(diploma)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedDiplomas.includes(diploma)
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-white/15 bg-white/[0.03] text-white/60 hover:border-white/30"
                }`}
              >
                {diploma}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customDiploma}
            onChange={(e) => setCustomDiploma(e.target.value)}
            className="field"
            placeholder="Autre diplôme (saisie libre)"
          />
          <div className="space-y-1">
            <p className="text-xs text-white/40">Justificatif (optionnel)</p>
            <DiplomaDropzone />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="experienceYears">
              Années d'expérience
            </label>
            <input id="experienceYears" name="experienceYears" type="number" min={0} required className="field" placeholder="6" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="coachedClientsCount">
              Nombre de clients coachés
            </label>
            <input id="coachedClientsCount" name="coachedClientsCount" type="number" min={0} required className="field" placeholder="120" />
          </div>
        </div>
      </fieldset>

      <fieldset ref={(node) => void (stepRefs.current[2] = node)} className={step === 2 ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="bio">
            Bio publique
          </label>
          <textarea
            id="bio"
            name="bio"
            minLength={80}
            required
            className="field min-h-36"
            placeholder="Présente ton parcours, ton approche, ton type d'accompagnement et les profils que tu aides le mieux."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/75">Photo de profil</label>
          <PhotoDropzone name="photoUrl" />
        </div>
      </fieldset>

      <fieldset ref={(node) => void (stepRefs.current[3] = node)} className={step === 3 ? "space-y-4" : "hidden"}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-white/75" htmlFor="addressLine1">
              Adresse professionnelle
            </label>
            <input id="addressLine1" name="addressLine1" className="field" placeholder="12 rue du Stade" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="city">
              Ville
            </label>
            <input id="city" name="city" className="field" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="postalCode">
              Code postal
            </label>
            <input id="postalCode" name="postalCode" className="field" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="country">
              Pays
            </label>
            <input id="country" name="country" className="field" defaultValue="France" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="phone">
              Téléphone
            </label>
            <input id="phone" name="phone" className="field" placeholder="06 00 00 00 00" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-white/75" htmlFor="websiteUrl">
              Site web
            </label>
            <input id="websiteUrl" name="websiteUrl" type="url" className="field" placeholder="https://mon-site.fr" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="instagramUrl">
              Instagram
            </label>
            <input id="instagramUrl" name="instagramUrl" type="url" className="field" placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="linkedinUrl">
              LinkedIn
            </label>
            <input id="linkedinUrl" name="linkedinUrl" type="url" className="field" placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="youtubeUrl">
              YouTube
            </label>
            <input id="youtubeUrl" name="youtubeUrl" type="url" className="field" placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/75" htmlFor="tiktokUrl">
              TikTok
            </label>
            <input id="tiktokUrl" name="tiktokUrl" type="url" className="field" placeholder="https://tiktok.com/@..." />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
        <button
          type="button"
          className="app-button-ghost px-4 py-2.5 text-sm text-white transition hover:border-white/30 hover:bg-white/10 disabled:opacity-40"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
        >
          Retour
        </button>
        {step < stepLabels.length - 1 ? (
          <button
            type="button"
            className="app-button-accent px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
            onClick={() => {
              if (validateCurrentStep()) {
                setStep((current) => Math.min(stepLabels.length - 1, current + 1));
              }
            }}
          >
            Continuer
          </button>
        ) : (
          <div className="w-full max-w-[15rem]">
            <SubmitButton>Envoyer ma candidature coach</SubmitButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  return (
    <AuthCard
      title="Connexion"
      description="Accède à tes abonnements, tes programmes et ton espace 100T."
    >
      <form action={formAction} className="mx-auto max-w-[28rem] space-y-4">
        <FormMessage message={state.message} type={state.status} />
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="email">
            Adresse email
          </label>
          <input id="email" name="email" type="email" required className="field" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="password">
            Mot de passe
          </label>
          <input id="password" name="password" type="password" required className="field" />
        </div>
        <SubmitButton>Se connecter</SubmitButton>
      </form>
      <div className="mx-auto mt-6 flex max-w-[28rem] items-center justify-between text-sm text-white/62">
        <Link href="/mot-de-passe-oublie" className="hover:text-white">
          Mot de passe oublié ?
        </Link>
        <Link href="/inscription" className="hover:text-white">
          Créer un compte
        </Link>
      </div>
    </AuthCard>
  );
}

export function RegisterForm({
  initialRole,
  categories = [],
}: {
  initialRole?: "USER" | "COACH";
  categories?: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(registerAction, initialActionState);
  const [role, setRole] = useState<"USER" | "COACH" | null>(initialRole ?? null);

  // Step 1 — choose role
  if (!role) {
    return (
      <AuthCard
        title="Créer un compte"
        description="Tu es abonné ou coach ? Choisis ton profil pour commencer."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole(Role.USER)}
            className="group flex flex-col gap-4 rounded-[22px] border border-white/8 bg-white/[0.02] p-6 text-left transition hover:border-[var(--accent)] hover:bg-[rgba(207,253,90,0.06)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-2xl group-hover:bg-[rgba(207,253,90,0.15)]">
              🏃
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Abonné</div>
              <div className="mt-1 text-base font-bold text-white">Je cherche un coach</div>
              <p className="mt-2 text-xs leading-5 text-white/45">Accède aux programmes, suis tes progrès et change de coach chaque mois.</p>
            </div>
            <span className="mt-auto self-start rounded-full border border-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/60 transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
              Continuer →
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole(Role.COACH)}
            className="group flex flex-col gap-4 rounded-[22px] border border-white/8 bg-white/[0.02] p-6 text-left transition hover:border-[var(--accent)] hover:bg-[rgba(207,253,90,0.06)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-2xl group-hover:bg-[rgba(207,253,90,0.15)]">
              🎯
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">Coach</div>
              <div className="mt-1 text-base font-bold text-white">Je veux coacher</div>
              <p className="mt-2 text-xs leading-5 text-white/45">Dépose ta candidature. L'équipe 100T la valide avant la mise en ligne de ton profil.</p>
            </div>
            <span className="mt-auto self-start rounded-full border border-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/60 transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
              Continuer →
            </span>
          </button>
        </div>
        <div className="mt-6 text-sm text-white/62">
          Déjà inscrit ? <Link href="/connexion" className="hover:text-white">Se connecter</Link>
        </div>
      </AuthCard>
    );
  }

  // Step 2 — fill in the form
  return (
    <AuthCard
      title={role === Role.USER ? "Créer mon compte abonné" : "Déposer ma candidature coach"}
      description={role === Role.USER ? "Quelques informations pour configurer ton espace." : "Remplis ton profil coach complet — notre équipe le valide avant publication."}
    >
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="role" value={role} />
        <FormMessage message={state.message} type={state.status} />

        {role === Role.USER ? (
          <div className="mx-auto max-w-[32rem] space-y-4 rounded-[22px] border border-white/6 bg-white/[0.02] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/75" htmlFor="user-firstName">Prénom</label>
                <input id="user-firstName" name="firstName" required className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/75" htmlFor="user-lastName">Nom</label>
                <input id="user-lastName" name="lastName" required className="field" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/75" htmlFor="user-email">Adresse email</label>
              <input id="user-email" name="email" type="email" required className="field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-white/75" htmlFor="user-password">Mot de passe</label>
                <input id="user-password" name="password" type="password" minLength={8} required className="field" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/75" htmlFor="user-confirmPassword">Confirmation</label>
                <input id="user-confirmPassword" name="confirmPassword" type="password" minLength={8} required className="field" />
              </div>
            </div>
            <SubmitButton>Créer mon compte</SubmitButton>
          </div>
        ) : (
          <div className="rounded-[22px] border border-white/6 bg-white/[0.02] p-5">
            <CoachApplicationFields categories={categories} />
          </div>
        )}
      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-white/45">
        <button type="button" onClick={() => setRole(null)} className="flex items-center gap-1.5 transition hover:text-white">
          ← Changer de profil
        </button>
        <Link href="/connexion" className="hover:text-white">Déjà inscrit ? Se connecter</Link>
      </div>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <AuthCard
      title="Réinitialiser le mot de passe"
      description="Nous simulons l'envoi d'un email de réinitialisation en environnement local."
    >
      <form action={formAction} className="mx-auto max-w-[28rem] space-y-4">
        <FormMessage message={state.message} type={state.status} />
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="forgot-email">
            Adresse email
          </label>
          <input id="forgot-email" name="email" type="email" required className="field" />
        </div>
        <SubmitButton>Envoyer le lien</SubmitButton>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const action = resetPasswordAction.bind(null, token);
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisis un nouveau mot de passe pour récupérer l'accès à ton compte."
    >
      <form action={formAction} className="mx-auto max-w-[28rem] space-y-4">
        <FormMessage message={state.message} type={state.status} />
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="new-password">
            Nouveau mot de passe
          </label>
          <input id="new-password" name="password" type="password" required className="field" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/75" htmlFor="new-confirm-password">
            Confirmation
          </label>
          <input id="new-confirm-password" name="confirmPassword" type="password" required className="field" />
        </div>
        <SubmitButton>Mettre à jour</SubmitButton>
      </form>
    </AuthCard>
  );
}
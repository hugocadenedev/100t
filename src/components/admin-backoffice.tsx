"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminUploadProgramForm } from "@/components/admin-upload-program-form";
import {
  adminAssignCoachCategoryAction,
  adminCreateCategoryAction,
  adminDeleteCategoryAction,
  adminDeleteSubscriptionAction,
  adminReviewCoachApplicationAction,
  adminReviewProgramSubmissionFormAction,
  adminToggleProgramPublishAction,
  adminUpdateUserRoleAction,
} from "@/lib/actions";
import { EQUIPMENT_OPTIONS, PLATFORM_MONTHLY_PRICE, Role } from "@/lib/domain";
import { formatDate, formatPrice, programLevelLabels } from "@/lib/utils";

/* ─────────────────────────── types ─────────────────────────── */

type AdminData = {
  metrics: {
    totalUsers: number;
    totalSubscribers: number;
    totalCoachAccounts: number;
    approvedCoaches: number;
    pendingCoachApplications: number;
    totalAdmins: number;
    totalPrograms: number;
    publishedPrograms: number;
    unpublishedPrograms: number;
    totalSubscriptions: number;
    totalSessions: number;
  };
  users: Array<{
    id: string;
    displayName: string;
    email: string;
    role: string;
    createdAt: Date;
    coachProfile: { id: string; slug: string; discipline: string; approvalStatus: string } | null;
    _count: { subscriptions: number };
  }>;
  coaches: Array<{
    id: string;
    displayName: string;
    slug: string;
    discipline: string;
    _count: { subscriptions: number; programs: number };
  }>;
  coachOptions: Array<{ id: string; slug: string; displayName: string; discipline: string; categoryId: string | null; categoryName: string | null; approvalStatus: "PENDING" | "APPROVED" | "REJECTED" }>;
  categories: Array<{ id: string; name: string; slug: string; createdAt: Date; coachCount: number }>;
  coachApplications: Array<{
    id: string;
    displayName: string;
    approvalStatus: string;
    discipline: string;
    headline: string;
    experienceYears: number;
    coachedClientsCount: number;
    city: string;
    postalCode: string;
    country: string;
    addressLine1: string;
    specialities: string;
    reviewNotes: string | null;
    user: { email: string };
  }>;
  programs: Array<{
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
    pdfUrl: string | null;
    totalDurationMinutes: number;
    updatedAt: Date;
    coachName: string;
    _count: { workoutSessions: number };
  }>;
  subscriptions: Array<{
    id: string;
    subscriberName: string;
    coachName: string;
    cancelAtPeriodEnd: boolean;
    startedAt: Date;
    currentPeriodEnd: Date;
  }>;
  programSubmissions: Array<{
    id: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
    level: string;
    durationMonths: number;
    sessionsPerWeek: number;
    avgSessionMinutes: number;
    equipment: string;
    equipmentFreeText: string | null;
    status: string;
    adminNotes: string | null;
    createdAt: Date;
    coachName: string;
    coachSlug: string;
    pdfs: Array<{ id: string; monthNumber: number; pdfUrl: string }>;
  }>;
};

/* ─────────────────────────── icons ─────────────────────────── */

function Icon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  dashboard:     "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  applications:  "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8l2 2 4-4",
  users:         "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  coaches:       "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  submissions:   "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  programs:      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5A2.5 2.5 0 0 1 6.5 2.5H20v19H6.5A2.5 2.5 0 0 1 4 19.5z",
  subscriptions: "M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z",
  import:        "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  categories:    "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A2 2 0 0 1 3 12V7a4 4 0 0 1 4-4z",
};

/* ─────────────────────────── nav items ─────────────────────────── */

type TabId = "dashboard" | "applications" | "users" | "coaches" | "categories" | "submissions" | "programs" | "subscriptions" | "import";

interface NavItem {
  id: TabId;
  label: string;
  icon: keyof typeof ICONS;
  badge?: (data: AdminData) => number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",     label: "Vue d'ensemble",  icon: "dashboard" },
  { id: "applications",  label: "Candidatures",    icon: "applications", badge: (d) => d.metrics.pendingCoachApplications },
  { id: "users",         label: "Utilisateurs",    icon: "users" },
  { id: "coaches",       label: "Top coachs",      icon: "coaches" },
  { id: "submissions",   label: "Dépôts",          icon: "submissions", badge: (d) => d.programSubmissions.filter((s) => s.status === "PENDING").length },
  { id: "programs",      label: "Programmes",      icon: "programs" },
  { id: "categories",    label: "Catégories",      icon: "categories" },
  { id: "subscriptions", label: "Abonnements",     icon: "subscriptions" },
  { id: "import",        label: "Import PDF",      icon: "import" },
];

/* ─────────────────────────── section title ─────────────────────────── */

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b border-white/6 pb-5">
      {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent)]">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-black uppercase tracking-tighter text-white">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

/* ─────────────────────────── panels ─────────────────────────── */

function DashboardPanel({ data }: { data: AdminData }) {
  const metrics = [
    { label: "Utilisateurs",       value: data.metrics.totalUsers },
    { label: "Abonnés",            value: data.metrics.totalSubscribers },
    { label: "Comptes coach",      value: data.metrics.totalCoachAccounts },
    { label: "Coachs validés",     value: data.metrics.approvedCoaches },
    { label: "Demandes en attente",value: data.metrics.pendingCoachApplications },
    { label: "Admins",             value: data.metrics.totalAdmins },
    { label: "Programmes",         value: data.metrics.totalPrograms },
    { label: "Publiés",            value: data.metrics.publishedPrograms },
    { label: "Masqués",            value: data.metrics.unpublishedPrograms },
    { label: "Abonnements",        value: data.metrics.totalSubscriptions },
    { label: "Séances totales",    value: data.metrics.totalSessions },
  ];

  return (
    <div>
      <SectionTitle eyebrow="Administration" title="Vue d'ensemble" subtitle="Métriques globales de la plateforme." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-[18px] border border-white/5 bg-white/[0.02] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{m.label}</p>
            <div className="mt-2 font-mono text-3xl font-black tracking-tighter text-[var(--accent)]">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationsPanel({ data }: { data: AdminData }) {
  return (
    <div>
      <SectionTitle
        eyebrow="Validation coach"
        title="Candidatures à traiter"
        subtitle={`${data.coachApplications.length} candidature(s) hors statut approuvé.`}
      />
      <div className="space-y-4">
        {data.coachApplications.length ? (
          data.coachApplications.map((coach) => (
            <div key={coach.id} className="rounded-[20px] border border-white/6 bg-white/[0.01] p-5 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white">{coach.displayName}</h3>
                  <span className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${coach.approvalStatus === "PENDING" ? "bg-amber-300/14 text-amber-100" : "bg-rose-400/12 text-rose-100"}`}>
                    {coach.approvalStatus === "PENDING" ? "En attente" : "Refusée"}
                  </span>
                  <span className="app-chip px-3 py-0.5 text-[10px] font-black uppercase text-slate-300">{coach.discipline}</span>
                </div>
                <p className="mt-1 font-mono text-[11px] uppercase text-slate-500">{coach.user.email}</p>
                <p className="mt-2 text-sm text-slate-300">{coach.headline}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs xl:grid-cols-4">
                  {[
                    { label: "Expérience", value: `${coach.experienceYears} an(s)` },
                    { label: "Clients", value: coach.coachedClientsCount },
                    { label: "Ville", value: coach.city },
                    { label: "Tarif", value: formatPrice(PLATFORM_MONTHLY_PRICE) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[14px] border border-white/5 bg-white/[0.008] p-2.5">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{item.label}</div>
                      <div className="mt-1 font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  <span className="font-semibold text-white">Spécialités : </span>{coach.specialities}
                </div>
                {coach.reviewNotes && (
                  <div className="mt-3 rounded-[14px] border border-white/5 bg-white/[0.01] p-3 text-sm text-slate-300">
                    <div className="font-semibold text-white">Dernier retour admin</div>
                    <p className="mt-1 whitespace-pre-wrap">{coach.reviewNotes}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 lg:mt-0">
                <form action={adminReviewCoachApplicationAction.bind(null, coach.id)} className="space-y-3">
                  <textarea name="reviewNotes" defaultValue={coach.reviewNotes || ""} className="field min-h-28" placeholder="Retour interne ou motif de refus…" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button type="submit" name="status" value="APPROVED" className="app-button-accent py-2.5 text-xs font-black uppercase tracking-widest transition hover:bg-white">
                      Valider
                    </button>
                    <button type="submit" name="status" value="REJECTED" className="rounded-full bg-rose-400/10 py-2.5 text-xs font-black uppercase tracking-widest text-rose-100 transition hover:bg-rose-400/15">
                      Refuser
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-5 text-sm text-slate-400">
            Aucune candidature en attente ou refusée à traiter.
          </div>
        )}
      </div>
    </div>
  );
}

function UsersPanel({ data }: { data: AdminData }) {
  return (
    <div>
      <SectionTitle eyebrow="Comptes" title="Utilisateurs &amp; rôles" subtitle="Gérer les rôles des membres de la plateforme." />
      <div className="space-y-3">
        {data.users.map((member) => {
          const isLastAdmin = member.role === Role.ADMIN && data.metrics.totalAdmins <= 1;
          const allowedRoleOptions = member.coachProfile ? [Role.COACH] : [Role.USER, Role.COACH, Role.ADMIN];
          return (
            <div key={member.id} className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4 lg:grid lg:grid-cols-[1fr_auto] lg:gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold uppercase tracking-tight text-white">{member.displayName}</span>
                  <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[9px] font-black uppercase text-black">{member.role}</span>
                  {member.coachProfile && (
                    <>
                      <span className="app-chip px-2.5 py-0.5 text-[9px] font-black uppercase text-slate-300">{member.coachProfile.discipline}</span>
                      <span className="app-chip px-2.5 py-0.5 text-[9px] font-black uppercase text-slate-300">{member.coachProfile.approvalStatus}</span>
                    </>
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] uppercase text-slate-500">{member.email}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-600">Créé le {formatDate(member.createdAt)}</p>
              </div>
              <form action={adminUpdateUserRoleAction.bind(null, member.id)} className="mt-3 flex items-center gap-2 lg:mt-0">
                <select name="role" defaultValue={member.role} className="field text-xs font-black uppercase tracking-widest" disabled={isLastAdmin}>
                  {allowedRoleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button type="submit" className="app-button-accent shrink-0 px-4 py-2.5 text-xs font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50" disabled={isLastAdmin}>
                  OK
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CoachesPanel({ data }: { data: AdminData }) {
  return (
    <div>
      <SectionTitle eyebrow="Coachs" title="Top coachs" subtitle="Coachs approuvés, triés par nombre d'abonnés." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.coaches.map((coach) => (
          <div key={coach.id} className="rounded-[20px] border border-white/5 bg-white/[0.01] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold uppercase tracking-tight text-white">{coach.displayName}</h3>
                <p className="font-mono text-[11px] uppercase text-slate-500">{coach.discipline}</p>
              </div>
              <Link href={`/coach/${coach.slug}`} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase text-slate-300 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                Voir
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <div className="rounded-[14px] border border-white/4 bg-white/[0.008] p-2">
                <div className="font-mono text-xl font-black text-[var(--accent)]">{coach._count.subscriptions}</div>
                <div>Abonnés</div>
              </div>
              <div className="rounded-[14px] border border-white/4 bg-white/[0.008] p-2">
                <div className="font-mono text-xl font-black text-[var(--accent)]">{coach._count.programs}</div>
                <div>Programmes</div>
              </div>
              <div className="rounded-[14px] border border-white/4 bg-white/[0.008] p-2">
                <div className="font-mono text-base font-black text-[var(--accent)]">{formatPrice(PLATFORM_MONTHLY_PRICE)}</div>
                <div>Mensuel</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionsPanel({ data }: { data: AdminData }) {
  const pending = data.programSubmissions.filter((s) => s.status === "PENDING");
  const processed = data.programSubmissions.filter((s) => s.status !== "PENDING");

  return (
    <div>
      <SectionTitle
        eyebrow="Dépôts de programmes"
        title="Programmes à valider"
        subtitle={`${pending.length} dépôt(s) en attente`}
      />

      {pending.length === 0 ? (
        <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-5 text-sm text-slate-400">
          Aucun dépôt en attente pour le moment.
        </div>
      ) : (
        <div className="space-y-5">
          {pending.map((sub) => {
            let equipment: string[] = [];
            try { equipment = JSON.parse(sub.equipment) as string[]; } catch { /* noop */ }
            const equipmentLabels = equipment.map((v) => EQUIPMENT_OPTIONS.find((o) => o.value === v)?.label ?? v).join(", ");

            return (
              <div key={sub.id} className="rounded-[20px] border border-amber-400/20 bg-amber-400/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold uppercase tracking-tight text-white">{sub.title}</h3>
                      <span className="rounded-full bg-amber-400/15 px-3 py-0.5 text-[10px] font-black uppercase text-amber-200">En attente</span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] uppercase text-slate-400">Coach : {sub.coachName} · {formatDate(sub.createdAt)}</p>
                    <Link href={`/coach/${sub.coachSlug}`} target="_blank" className="mt-1 inline-flex text-xs text-[var(--accent)] hover:underline">→ Page publique du coach</Link>
                  </div>
                  {sub.coverImageUrl && (
                    <a href={sub.coverImageUrl} target="_blank" rel="noreferrer">
                      <img src={sub.coverImageUrl} alt="Couverture" className="h-16 w-24 rounded-[12px] object-cover ring-1 ring-white/10 transition hover:ring-[var(--accent)]" />
                    </a>
                  )}
                </div>
                <p className="mt-3 text-sm text-slate-300">{sub.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  <span className="app-chip px-2.5 py-1">{programLevelLabels[sub.level as keyof typeof programLevelLabels]}</span>
                  <span className="app-chip px-2.5 py-1">{sub.durationMonths} mois</span>
                  <span className="app-chip px-2.5 py-1">{sub.sessionsPerWeek} séances/sem.</span>
                  <span className="app-chip px-2.5 py-1">{sub.avgSessionMinutes} min/séance</span>
                  {equipmentLabels && <span className="app-chip px-2.5 py-1">{equipmentLabels}</span>}
                  {sub.equipmentFreeText && <span className="app-chip px-2.5 py-1">{sub.equipmentFreeText}</span>}
                </div>
                {sub.pdfs.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/50">PDFs ({sub.pdfs.length}/{sub.durationMonths} mois)</p>
                    {sub.pdfs.map((pdf) => (
                      <div key={pdf.id} className="flex items-center gap-3 rounded-[14px] border border-white/8 bg-white/[0.02] px-4 py-2">
                        <span className="text-base">📄</span>
                        <span className="flex-1 text-xs font-medium text-white/70">Mois {pdf.monthNumber}</span>
                        <a href={pdf.pdfUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-black uppercase text-black transition hover:opacity-90">Ouvrir</a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-amber-400/70">⚠️ Aucun PDF déposé</p>
                )}
                <div className="mt-5 grid gap-4 rounded-[16px] border border-white/5 bg-white/[0.02] p-4 lg:grid-cols-2">
                  <form action={adminReviewProgramSubmissionFormAction} className="space-y-3">
                    <input type="hidden" name="submissionId" value={sub.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <input name="adminNotes" className="field text-sm" placeholder="Note admin (optionnel)…" />
                    <button type="submit" className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-400">✓ Approuver et publier</button>
                  </form>
                  <form action={adminReviewProgramSubmissionFormAction} className="space-y-3">
                    <input type="hidden" name="submissionId" value={sub.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <input name="adminNotes" className="field text-sm" placeholder="Motif de refus…" />
                    <button type="submit" className="rounded-full bg-rose-500/80 px-5 py-2 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-500">✕ Refuser</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {processed.length > 0 && (
        <details className="mt-6 rounded-[18px] border border-white/6 bg-white/[0.008]">
          <summary className="cursor-pointer select-none px-5 py-4 text-sm font-semibold text-white/60 hover:text-white">
            Dépôts traités ({processed.length})
          </summary>
          <div className="space-y-3 border-t border-white/5 p-5">
            {processed.map((sub) => (
              <div key={sub.id} className={`rounded-[14px] border px-4 py-3 ${sub.status === "APPROVED" ? "border-emerald-400/15 bg-emerald-400/[0.03]" : "border-rose-400/15 bg-rose-400/[0.03]"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-white">{sub.title}</span>
                    <span className="ml-3 text-xs text-slate-400">{sub.coachName}</span>
                  </div>
                  <span className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${sub.status === "APPROVED" ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>
                    {sub.status === "APPROVED" ? "Approuvé" : "Refusé"}
                  </span>
                </div>
                {sub.adminNotes && <p className="mt-1.5 text-xs text-slate-400">Note : {sub.adminNotes}</p>}
                {sub.pdfs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sub.pdfs.map((pdf) => (
                      <a key={pdf.id} href={pdf.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] hover:underline">📄 Mois {pdf.monthNumber}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ProgramsPanel({ data }: { data: AdminData }) {
  return (
    <div>
      <SectionTitle eyebrow="Catalogue" title="Programmes" subtitle="Publier ou masquer les programmes de la plateforme." />
      <div className="space-y-3">
        {data.programs.map((program) => (
          <div key={program.id} className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4 lg:grid lg:grid-cols-[1fr_auto] lg:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold uppercase tracking-tight text-white">{program.title}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${program.isPublished ? "bg-[var(--accent)] text-black" : "bg-slate-800 text-slate-200"}`}>
                  {program.isPublished ? "Publié" : "Masqué"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase text-slate-500">{program.coachName}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{program.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                <span>{program._count.workoutSessions} séances</span>
                <span>{program.totalDurationMinutes} min</span>
                {program.pdfUrl && <span>PDF</span>}
                <span>Màj {formatDate(program.updatedAt)}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 lg:mt-0 lg:flex-col lg:items-end">
              <form action={adminToggleProgramPublishAction.bind(null, program.id)}>
                <button type="submit" className="app-button-accent px-4 py-2 text-[10px] font-black uppercase tracking-widest transition hover:bg-white">
                  {program.isPublished ? "Dépublier" : "Publier"}
                </button>
              </form>
              <Link href={`/programmes/${program.id}`} className="app-button-ghost px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-100 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                Ouvrir
              </Link>
              {program.pdfUrl && (
                <Link href={program.pdfUrl} target="_blank" className="app-button-ghost px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-100 transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  PDF
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionsPanel({ data }: { data: AdminData }) {
  return (
    <div>
      <SectionTitle eyebrow="Facturation" title="Abonnements" subtitle="Historique des abonnements actifs et terminés." />
      <div className="space-y-3">
        {data.subscriptions.map((sub) => (
          <div key={sub.id} className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4 lg:grid lg:grid-cols-[1fr_auto] lg:gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold uppercase tracking-tight text-white">{sub.subscriberName}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${sub.cancelAtPeriodEnd ? "bg-rose-900/40 text-rose-100" : "bg-[var(--accent)] text-black"}`}>
                  {sub.cancelAtPeriodEnd ? "Fin de période" : "Actif"}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase text-slate-500">Coach : {sub.coachName}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                <span>Début : {formatDate(sub.startedAt)}</span>
                <span>Fin : {formatDate(sub.currentPeriodEnd)}</span>
              </div>
            </div>
            <form action={adminDeleteSubscriptionAction.bind(null, sub.id)} className="mt-3 lg:mt-0 lg:self-start">
              <button type="submit" className="rounded-full bg-rose-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-100 transition hover:bg-rose-400/15">
                Supprimer
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesPanel({ data }: { data: AdminData }) {
  const [createState, setCreateState] = useState<{ status: string; message: string } | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await adminCreateCategoryAction(
      { status: "idle", message: "" },
      formData,
    );
    setCreateState({ status: result.status, message: result.message ?? "" });
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Disciplines"
        title="Catégories de coachs"
        subtitle="Créer les catégories officielles et assigner les coachs approuvés."
      />

      {/* Create category */}
      <div className="mb-8 rounded-[20px] border border-white/5 bg-white/[0.01] p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Nouvelle catégorie</p>
        <form action={handleCreate} className="flex flex-wrap items-center gap-3">
          <input
            name="name"
            required
            placeholder="Ex : Fitness, Boxe, Yoga…"
            className="field flex-1 min-w-[200px]"
          />
          <button type="submit" className="app-button-accent shrink-0 px-5 py-2.5 text-xs font-black uppercase tracking-widest">
            Créer
          </button>
        </form>
        {createState && (
          <p className={`mt-2 text-xs font-semibold ${createState.status === "success" ? "text-emerald-400" : "text-rose-400"}`}>
            {createState.message}
          </p>
        )}
      </div>

      {/* Category list */}
      <div className="mb-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          Catégories existantes ({data.categories.length})
        </p>
        {data.categories.length === 0 ? (
          <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-5 text-sm text-slate-400">
            Aucune catégorie créée pour le moment.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-white/5 bg-white/[0.01] p-4">
                <div>
                  <p className="font-bold uppercase tracking-tight text-white">{cat.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase text-slate-500">
                    {cat.coachCount} coach{cat.coachCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <form action={adminDeleteCategoryAction.bind(null, cat.id)}>
                  <button
                    type="submit"
                    className="rounded-full bg-rose-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-100 transition hover:bg-rose-400/20"
                    title="Supprimer la catégorie"
                  >
                    Suppr.
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign coaches */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          Assigner une catégorie aux coachs
        </p>
        {data.coachOptions.filter((c) => c.approvalStatus === "APPROVED").length === 0 ? (
          <div className="rounded-[18px] border border-white/5 bg-white/[0.01] p-5 text-sm text-slate-400">
            Aucun coach approuvé.
          </div>
        ) : (
          <div className="space-y-3">
            {data.coachOptions
              .filter((c) => c.approvalStatus === "APPROVED")
              .map((coach) => (
                <div
                  key={coach.id}
                  className="rounded-[18px] border border-white/5 bg-white/[0.01] p-4 lg:grid lg:grid-cols-[1fr_auto] lg:gap-4"
                >
                  <div>
                    <p className="font-bold uppercase tracking-tight text-white">{coach.displayName}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase text-slate-500">
                      Discipline déclarée : {coach.discipline}
                    </p>
                    {coach.categoryName && (
                      <span className="mt-1 inline-block rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-[var(--accent)]">
                        {coach.categoryName}
                      </span>
                    )}
                  </div>
                  <form action={adminAssignCoachCategoryAction.bind(null, coach.id)} className="mt-3 flex items-center gap-2 lg:mt-0">
                    <select name="categoryId" defaultValue={coach.categoryId ?? ""} className="field text-xs">
                      <option value="">— Aucune —</option>
                      {data.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="app-button-accent shrink-0 px-4 py-2.5 text-xs font-black uppercase tracking-widest">
                      OK
                    </button>
                  </form>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImportPanel({ data }: { data: AdminData }) {
  return (
    <div>
      <SectionTitle eyebrow="Import PDF" title="Attribuer un programme" subtitle="Importer un PDF et l'assigner directement à un coach approuvé." />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-5">
          <AdminUploadProgramForm coachOptions={data.coachOptions} />
        </div>
        <div className="rounded-[20px] border border-white/5 bg-white/[0.01] p-5 space-y-3 text-sm text-slate-400">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Règle métier</p>
          <p>Chaque import crée un programme standard rattaché au <strong className="text-white">coach sélectionné</strong>.</p>
          <p>Le programme apparaît dans la page publique du coach et reste pilotable depuis ce back office.</p>
          <p>Le PDF est stocké dans <span className="font-mono text-[var(--accent)]">public/uploads/programs</span> et peut être masqué via le statut de publication.</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */

export function AdminBackoffice({ data }: { data: AdminData }) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const pendingApplications = data.metrics.pendingCoachApplications;
  const pendingSubmissions = data.programSubmissions.filter((s) => s.status === "PENDING").length;

  const getBadge = (item: NavItem) => {
    if (!item.badge) return 0;
    return item.badge(data);
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* ── Sidebar ── */}
      <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 flex-col border-r border-white/6 bg-[#0a0a0a] lg:flex xl:w-60">
        {/* Branding */}
        <div className="border-b border-white/6 px-5 py-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--accent)]">Back Office</p>
          <p className="mt-0.5 text-sm font-black uppercase tracking-widest text-white">100T Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_ITEMS.map((item) => {
            const badge = getBadge(item);
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-slate-400 hover:bg-white/4 hover:text-white"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-[var(--accent)]" : "text-slate-600"}`}>
                  <Icon path={ICONS[item.icon]} />
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {badge > 0 && (
                  <span className="ml-auto shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-black text-black">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="border-t border-white/6 p-4 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300">
            <Icon path="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" className="h-3.5 w-3.5" />
            Marketplace
          </Link>
          <Link href="/coach-studio" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300">
            <Icon path="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" className="h-3.5 w-3.5" />
            Studio coach
          </Link>
        </div>
      </aside>

      {/* ── Mobile top tabs ── */}
      <div className="flex w-full flex-col lg:flex-1">
        <div className="flex overflow-x-auto border-b border-white/6 bg-[#0a0a0a] px-2 py-1 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const badge = getBadge(item);
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${
                  isActive ? "text-[var(--accent)]" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {item.label}
                {badge > 0 && (
                  <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[8px] font-black text-black">{badge}</span>
                )}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {activeTab === "dashboard"     && <DashboardPanel data={data} />}
          {activeTab === "applications"  && <ApplicationsPanel data={data} />}
          {activeTab === "users"         && <UsersPanel data={data} />}
          {activeTab === "coaches"       && <CoachesPanel data={data} />}
          {activeTab === "categories"    && <CategoriesPanel data={data} />}
          {activeTab === "submissions"   && <SubmissionsPanel data={data} />}
          {activeTab === "programs"      && <ProgramsPanel data={data} />}
          {activeTab === "subscriptions" && <SubscriptionsPanel data={data} />}
          {activeTab === "import"        && <ImportPanel data={data} />}
        </main>
      </div>
    </div>
  );
}

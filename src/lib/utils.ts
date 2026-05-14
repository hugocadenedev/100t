import { Difficulty, type DifficultyValue, type ProgramLevelValue } from "@/lib/domain";

export const APP_NAME = "100T";

export const difficultyLabels: Record<DifficultyValue, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
  EXPERT: "Expert",
};

export const programLevelLabels: Record<ProgramLevelValue, string> = {
  ACCESSIBLE_TOUS: "Accessible à tous",
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
  EXPERT: "Expert",
};

export function formatPrice(monthlyPrice: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(monthlyPrice);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (remainder === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainder} min`;
}

export function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || "Coach 100T";
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function difficultyOptions() {
  return Object.entries(difficultyLabels).map(([value, label]) => ({
    value,
    label,
  }));
}

/**
 * Calcule combien de mois du programme sont débloqués pour un abonné,
 * en partant de la date de début de son abonnement.
 *
 * - Mois 1 : disponible dès le premier jour d'abonnement.
 * - Mois 2 : débloqué le jour du renouvellement mensuel (1 mois après startedAt).
 * - Mois N : débloqué N-1 mois après startedAt.
 *
 * Ex : abonné le 14 mai → mois 2 débloqué le 14 juin, mois 3 le 14 juillet, etc.
 */
export function getUnlockedMonths(startedAt: Date, now: Date = new Date()): number {
  let months =
    (now.getFullYear() - startedAt.getFullYear()) * 12 +
    (now.getMonth() - startedAt.getMonth());
  // Si le jour du mois courant est avant le jour de début, le renouvellement n'a pas encore eu lieu
  if (now.getDate() < startedAt.getDate()) {
    months -= 1;
  }
  // Mois 1 est toujours disponible (months = 0 → 1 débloqué)
  return Math.max(1, months + 1);
}

/**
 * Retourne la date à laquelle le mois N d'un programme sera débloqué,
 * calculée à partir de la date de début d'abonnement.
 * Mois 1 → même jour que startedAt. Mois 2 → startedAt + 1 mois. Etc.
 */
export function getMonthUnlockDate(startedAt: Date, monthNumber: number): Date {
  const d = new Date(startedAt);
  d.setMonth(d.getMonth() + (monthNumber - 1));
  return d;
}

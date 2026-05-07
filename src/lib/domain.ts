export const Role = {
  USER: "USER",
  COACH: "COACH",
  ADMIN: "ADMIN",
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];

export const roleValues = [Role.USER, Role.COACH, Role.ADMIN] as const;

export const publicRegistrationRoleValues = [Role.USER, Role.COACH] as const;

export const CoachApplicationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type CoachApplicationStatusValue =
  (typeof CoachApplicationStatus)[keyof typeof CoachApplicationStatus];

export const coachApplicationStatusValues = [
  CoachApplicationStatus.PENDING,
  CoachApplicationStatus.APPROVED,
  CoachApplicationStatus.REJECTED,
] as const;

export const Difficulty = {
  DEBUTANT: "DEBUTANT",
  INTERMEDIAIRE: "INTERMEDIAIRE",
  AVANCE: "AVANCE",
  EXPERT: "EXPERT",
} as const;

export type DifficultyValue = (typeof Difficulty)[keyof typeof Difficulty];

export const difficultyValues = [
  Difficulty.DEBUTANT,
  Difficulty.INTERMEDIAIRE,
  Difficulty.AVANCE,
  Difficulty.EXPERT,
] as const;

export const PLATFORM_MONTHLY_PRICE = 29;

export const SubscriptionPlan = {
  ESSENTIELLE: "ESSENTIELLE",
  ESSENTIELLE_ANNUELLE: "ESSENTIELLE_ANNUELLE",
  PREMIUM: "PREMIUM",
} as const;

export type SubscriptionPlanValue = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

/** Max number of programs a user can select per month for each plan */
export const PLAN_MONTHLY_LIMIT: Record<string, number> = {
  ESSENTIELLE: 1,
  ESSENTIELLE_ANNUELLE: 1,
  PREMIUM: 3,
};

/** Stripe unit_amount in cents per plan (always monthly billing) */
export const PLAN_PRICES: Record<string, number> = {
  ESSENTIELLE: 2990,          // 29,90 €/mois, sans engagement
  ESSENTIELLE_ANNUELLE: 1990, // 19,90 €/mois, engagement 12 mois
  PREMIUM: 4990,              // 49,90 €/mois, sans engagement
};

/** Commitment duration in months (0 = none) */
export const PLAN_COMMITMENT_MONTHS: Record<string, number> = {
  ESSENTIELLE: 0,
  ESSENTIELLE_ANNUELLE: 12,
  PREMIUM: 0,
};

export const PLAN_NAMES: Record<string, string> = {
  ESSENTIELLE: "Offre Essentielle",
  ESSENTIELLE_ANNUELLE: "Offre Essentielle annuelle",
  PREMIUM: "Offre Premium",
};

export const ProgramLevel = {
  ACCESSIBLE_TOUS: "ACCESSIBLE_TOUS",
  DEBUTANT: "DEBUTANT",
  INTERMEDIAIRE: "INTERMEDIAIRE",
  AVANCE: "AVANCE",
  EXPERT: "EXPERT",
} as const;

export type ProgramLevelValue = (typeof ProgramLevel)[keyof typeof ProgramLevel];

export const programLevelValues = [
  ProgramLevel.ACCESSIBLE_TOUS,
  ProgramLevel.DEBUTANT,
  ProgramLevel.INTERMEDIAIRE,
  ProgramLevel.AVANCE,
  ProgramLevel.EXPERT,
] as const;

export const SubmissionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type SubmissionStatusValue = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const EQUIPMENT_OPTIONS = [
  { value: "club", label: "Besoin d'être abonné à un club" },
  { value: "no_equipment", label: "Sans matériel" },
  { value: "home", label: "À la maison" },
  { value: "small_equipment", label: "Petit matériel" },
] as const;

export type EquipmentOptionValue = (typeof EQUIPMENT_OPTIONS)[number]["value"];

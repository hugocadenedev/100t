import { z } from "zod";

import {
  coachApplicationStatusValues,
  difficultyValues,
  programLevelValues,
  publicRegistrationRoleValues,
  roleValues,
} from "@/lib/domain";

export const actionStateSchema = z.object({
  status: z.enum(["idle", "success", "error"]),
  message: z.string().optional(),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Le prénom est requis."),
    lastName: z.string().trim().min(2, "Le nom est requis."),
    email: z.email("Adresse email invalide.").transform((value) => value.toLowerCase()),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "La confirmation est requise."),
    role: z.enum(publicRegistrationRoleValues),
    headline: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    photoUrl: z.string().trim().refine((v) => v === "" || v.startsWith("/") || z.string().url().safeParse(v).success, "URL invalide.").optional(),
    monthlyPrice: z.coerce.number().int().min(1, "Le tarif mensuel doit être supérieur à 0.").optional(),
    discipline: z.string().trim().optional(),
    specialities: z.string().trim().optional(),
    diplomas: z.string().trim().optional(),
    diplomaFileUrl: z.string().trim().refine(
      (v) => !v || v.startsWith("/uploads/diplomas/"),
      "URL de diplôme invalide.",
    ).optional(),
    skills: z.string().trim().optional(),
    experienceYears: z.coerce.number().int().min(0, "L'expérience ne peut pas être négative.").optional(),
    coachedClientsCount: z.coerce.number().int().min(0, "Le nombre de clients ne peut pas être négatif.").optional(),
    addressLine1: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
    country: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    instagramUrl: z.string().trim().url("URL Instagram invalide.").or(z.literal("")).optional(),
    tiktokUrl: z.string().trim().url("URL TikTok invalide.").or(z.literal("")).optional(),
    youtubeUrl: z.string().trim().url("URL YouTube invalide.").or(z.literal("")).optional(),
    linkedinUrl: z.string().trim().url("URL LinkedIn invalide.").or(z.literal("")).optional(),
    websiteUrl: z.string().trim().url("URL du site invalide.").or(z.literal("")).optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  })
  .superRefine((values, ctx) => {
    if (values.role !== "COACH") {
      return;
    }

    const requiredCoachFields = [
      { key: "headline", message: "L'accroche coach est requise." },
      { key: "bio", message: "La bio coach est requise." },
      { key: "discipline", message: "Sélectionne au moins un sport pratiqué." },
      { key: "specialities", message: "La spécialité est requise." },
    ] as const;

    for (const field of requiredCoachFields) {
      const value = values[field.key];

      if (!value || value.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.key],
          message: field.message,
        });
      }
    }

    if (!values.bio || values.bio.length < 80) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bio"],
        message: "La bio coach doit contenir au moins 80 caractères.",
      });
    }

    if (!values.headline || values.headline.length < 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["headline"],
        message: "L'accroche doit contenir au moins 12 caractères.",
      });
    }

    if (values.experienceYears == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experienceYears"],
        message: "Le nombre d'années d'expérience est requis.",
      });
    }

    if (values.coachedClientsCount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coachedClientsCount"],
        message: "Le nombre de clients coachés est requis.",
      });
    }
  });

export const loginSchema = z.object({
  email: z.email("Adresse email invalide.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Adresse email invalide.").transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "La confirmation est requise."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const coachProfileSchema = z.object({
  slug: z.string().trim().min(3, "Le slug est requis."),
  headline: z.string().trim().min(8, "L'accroche est requise."),
  bio: z.string().trim().min(30, "La bio doit contenir au moins 30 caractères."),
  photoUrl: z.string().trim().refine((v) => v === "" || v.startsWith("/") || z.string().url().safeParse(v).success, "URL invalide.").optional(),
  coverImageUrl: z.string().trim().refine((v) => v === "" || v.startsWith("/") || z.string().url().safeParse(v).success, "URL invalide.").optional(),
  discipline: z.string().trim().min(2, "La discipline est requise."),
  specialities: z.string().trim().min(2, "Ajoute au moins une spécialité."),
  skills: z.string().trim().min(2, "Ajoute au moins une compétence."),
  experienceYears: z.coerce.number().int().min(0, "L'expérience ne peut pas être négative."),
  coachedClientsCount: z.coerce.number().int().min(0, "Le nombre de clients coachés ne peut pas être négatif."),
  addressLine1: z.string().trim().min(4, "L'adresse professionnelle est requise."),
  city: z.string().trim().min(2, "La ville est requise."),
  postalCode: z.string().trim().min(2, "Le code postal est requis."),
  country: z.string().trim().min(2, "Le pays est requis."),
  phone: z.string().trim().optional(),
  instagramUrl: z.string().trim().url("URL Instagram invalide.").or(z.literal("")).optional(),
  tiktokUrl: z.string().trim().url("URL TikTok invalide.").or(z.literal("")).optional(),
  youtubeUrl: z.string().trim().url("URL YouTube invalide.").or(z.literal("")).optional(),
  linkedinUrl: z.string().trim().url("URL LinkedIn invalide.").or(z.literal("")).optional(),
  websiteUrl: z.string().trim().url("URL du site invalide.").or(z.literal("")).optional(),
});

export const adminCoachApplicationReviewSchema = z.object({
  status: z.enum(coachApplicationStatusValues),
  reviewNotes: z.string().trim().optional(),
});

export const adminPdfProgramSchema = z.object({
  coachId: z.string().trim().min(1, "Sélectionne un coach."),
  title: z.string().trim().min(3, "Le titre du programme est requis."),
  description: z.string().trim().min(20, "La description doit contenir au moins 20 caractères."),
  coverImage: z.string().trim().url("URL d'image invalide.").or(z.literal("")).optional(),
  difficulty: z.enum(difficultyValues),
  totalDurationMinutes: z.coerce.number().int().min(10, "La durée totale doit être d'au moins 10 minutes."),
});

export const programSchema = z.object({
  programId: z.string().optional(),
  title: z.string().trim().min(3, "Le titre du programme est requis."),
  description: z.string().trim().min(20, "La description doit contenir au moins 20 caractères."),
  coverImage: z.string().trim().url("URL d'image invalide.").or(z.literal("")).optional(),
  difficulty: z.enum(difficultyValues),
  totalDurationMinutes: z.coerce.number().int().min(10, "La durée totale doit être d'au moins 10 minutes."),
});

export const exerciseBlockSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Le nom de l'exercice est requis."),
  sets: z.coerce.number().int().min(1, "Le nombre de séries doit être supérieur à 0."),
  reps: z.string().trim().min(1, "Le nombre de répétitions ou la durée est requis."),
  restSeconds: z.coerce.number().int().min(0, "Le repos ne peut pas être négatif."),
  notes: z.string().trim().optional(),
  videoUrl: z.string().trim().url("URL vidéo invalide.").or(z.literal("")).optional(),
});

export const workoutSessionSchema = z.object({
  sessionId: z.string().optional(),
  programId: z.string().min(1, "Programme introuvable."),
  title: z.string().trim().min(3, "Le titre de la séance est requis."),
  description: z.string().trim().min(10, "La description doit contenir au moins 10 caractères."),
  durationMinutes: z.coerce.number().int().min(5, "La durée doit être d'au moins 5 minutes."),
  difficulty: z.enum(difficultyValues),
  videoUrl: z.string().trim().url("URL vidéo invalide.").or(z.literal("")).optional(),
  exerciseBlocks: z.array(exerciseBlockSchema).min(1, "Ajoute au moins un bloc d'exercice."),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(roleValues),
});

export const programSubmissionSchema = z.object({
  submissionId: z.string().optional(),
  title: z.string().trim().min(3, "Le titre du programme est requis."),
  description: z.string().trim().min(20, "La description doit contenir au moins 20 caractères."),
  coverImageUrl: z.string().trim().url("URL d'image invalide.").or(z.literal("")).optional(),
  level: z.enum(programLevelValues, { error: "Sélectionne un niveau." }),
  durationMonths: z.coerce.number().int().min(1, "La durée doit être d'au moins 1 mois.").max(24, "La durée ne peut pas dépasser 24 mois."),
  sessionsPerWeek: z.string().trim().min(1, "Le nombre de séances par semaine est requis."),
  avgSessionMinutes: z.coerce.number().int().min(10, "La durée moyenne doit être d'au moins 10 minutes.").max(300, "Maximum 300 minutes."),
  equipment: z.array(z.string()).min(1, "Sélectionne au moins une option d'équipement."),
  equipmentFreeText: z.string().trim().optional(),
});

export const adminProgramSubmissionReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"] as const),
  adminNotes: z.string().trim().optional(),
});

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = {
  status: "idle",
};

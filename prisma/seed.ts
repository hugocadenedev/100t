import bcrypt from "bcryptjs";

import { CoachApplicationStatus, Difficulty, Role } from "../src/lib/domain";
import { prisma } from "../src/lib/prisma";
import { slugify } from "../src/lib/utils";

async function main() {
  await prisma.exerciseBlock.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.program.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.sessionToken.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("motdepasse123", 12);

  const subscriber = await prisma.user.create({
    data: {
      firstName: "Lina",
      lastName: "Martin",
      email: "abonne@100t.fr",
      role: Role.USER,
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "100T",
      email: "admin@100t.fr",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const coachSeeds = [
    {
      firstName: "Malik",
      lastName: "Renaud",
      email: "malik@100t.fr",
      experienceYears: 9,
      coachedClientsCount: 240,
      addressLine1: "14 boulevard des Athletes",
      city: "Lyon",
      postalCode: "69006",
      country: "France",
      phone: "06 11 22 33 44",
      websiteUrl: "https://100t.local/malik",
      instagramUrl: "https://instagram.com/malik100t",
      linkedinUrl: "https://linkedin.com/in/malik100t",
      discipline: "CrossFit",
      headline: "Force, engine et structure hebdomadaire pour progresser sans plateau.",
      bio: "Coach CrossFit depuis 9 ans, j'accompagne les athlètes intermédiaires et avancés avec des cycles lisibles, une charge contrôlée et des standards de mouvement exigeants.",
      specialities: "Force, conditioning, halterophilie",
      skills: "Périodisation, mobilité, technique",
      monthlyPrice: 39,
      photoUrl:
        "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1200&q=80",
      programs: [
        {
          title: "Cycle Engine + Force 6 semaines",
          description: "Un programme hybride pour construire de la puissance sur les lifts principaux tout en améliorant la capacité de travail.",
          coverImage:
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
          difficulty: Difficulty.AVANCE,
          totalDurationMinutes: 270,
          sessions: [
            {
              title: "Lower body heavy day",
              description: "Accent sur squat, tirage et finisher au rameur.",
              durationMinutes: 90,
              difficulty: Difficulty.AVANCE,
              blocks: [
                ["Back squat", 5, "5 reps", 120, "Charge progressive", ""],
                ["Romanian deadlift", 4, "8 reps", 90, "Tempo contrôlé", ""],
                ["Rameur", 6, "2 min", 60, "Pace stable", ""],
              ],
            },
            {
              title: "Gym + conditioning",
              description: "Séance mixte avec travail de gainage et AMRAP.",
              durationMinutes: 85,
              difficulty: Difficulty.INTERMEDIAIRE,
              blocks: [
                ["Toes to bar", 5, "10 reps", 60, "Qualité d'exécution", ""],
                ["Burpees over box", 4, "12 reps", 45, "Respiration contrôlée", ""],
                ["Air bike", 5, "90 sec", 45, "Intensité progressive", ""],
              ],
            },
            {
              title: "Olympic technique",
              description: "Technique épaulé-jeté et transferts de force.",
              durationMinutes: 95,
              difficulty: Difficulty.AVANCE,
              blocks: [
                ["Clean pull", 5, "3 reps", 90, "Trajectoire verticale", ""],
                ["Power clean", 6, "2 reps", 90, "Reste explosif", ""],
                ["Split jerk", 5, "3 reps", 75, "Fixe la réception", ""],
              ],
            },
          ],
        },
        {
          title: "Base compétition fonctionnelle",
          description: "Bloc de 4 semaines pour revenir sur les fondamentaux et améliorer la qualité de mouvement sous fatigue.",
          coverImage:
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
          difficulty: Difficulty.INTERMEDIAIRE,
          totalDurationMinutes: 220,
          sessions: [
            {
              title: "Strict strength",
              description: "Renforcement haut du corps et posture.",
              durationMinutes: 70,
              difficulty: Difficulty.INTERMEDIAIRE,
              blocks: [
                ["Strict press", 5, "5 reps", 90, "Rib cage verrouillée", ""],
                ["Ring row", 4, "12 reps", 60, "Traction scapulaire", ""],
                ["Farmer carry", 6, "40 m", 45, "Marche contrôlée", ""],
              ],
            },
          ],
        },
      ],
    },
    {
      firstName: "Sofia",
      lastName: "Leroy",
      email: "sofia@100t.fr",
      experienceYears: 7,
      coachedClientsCount: 180,
      addressLine1: "8 avenue du Parc",
      city: "Bordeaux",
      postalCode: "33000",
      country: "France",
      phone: "06 55 44 33 22",
      websiteUrl: "https://100t.local/sofia",
      instagramUrl: "https://instagram.com/sofia100t",
      youtubeUrl: "https://youtube.com/@sofia100t",
      discipline: "Running",
      headline: "Plans d'entraînement précis pour courir plus vite, plus loin et rester régulière.",
      bio: "Spécialiste running et trail, je structure la progression autour de la foulée, de la gestion d'effort et de la récupération active.",
      specialities: "10 km, semi-marathon, trail",
      skills: "VMA, endurance, récupération",
      monthlyPrice: 24,
      photoUrl:
        "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1200&q=80",
      programs: [
        {
          title: "Objectif 10 km sous 50 min",
          description: "8 semaines de progression avec séances de seuil, VMA et endurance fondamentale.",
          coverImage:
            "https://images.unsplash.com/photo-1486218119243-13883505764c?auto=format&fit=crop&w=1200&q=80",
          difficulty: Difficulty.DEBUTANT,
          totalDurationMinutes: 180,
          sessions: [
            {
              title: "Fractionné court",
              description: "Développer la vitesse et la relance.",
              durationMinutes: 55,
              difficulty: Difficulty.INTERMEDIAIRE,
              blocks: [
                ["Échauffement", 1, "15 min", 0, "Footing + gammes", ""],
                ["400 m rapide", 8, "400 m", 75, "Allure 5 km", ""],
                ["Retour au calme", 1, "10 min", 0, "Jog léger", ""],
              ],
            },
          ],
        },
      ],
    },
    {
      firstName: "Aya",
      lastName: "Benali",
      email: "aya@100t.fr",
      experienceYears: 5,
      coachedClientsCount: 130,
      addressLine1: "22 rue des Arts",
      city: "Paris",
      postalCode: "75011",
      country: "France",
      phone: "06 77 88 99 00",
      websiteUrl: "https://100t.local/aya",
      instagramUrl: "https://instagram.com/aya100t",
      tiktokUrl: "https://tiktok.com/@aya100t",
      discipline: "Yoga",
      headline: "Programmes guidés pour mobilité, souffle et renforcement profond.",
      bio: "J'enseigne un yoga accessible mais exigeant, pensé pour améliorer la posture, la mobilité et l'équilibre global au quotidien.",
      specialities: "Vinyasa, mobilité, récupération",
      skills: "Respiration, alignement, souplesse",
      monthlyPrice: 19,
      photoUrl:
        "https://images.unsplash.com/photo-1599447292325-32a7f66dfd41?auto=format&fit=crop&w=1200&q=80",
      programs: [
        {
          title: "Mobilité totale en 21 jours",
          description: "Un parcours progressif pour ouvrir les hanches, les épaules et améliorer le contrôle respiratoire.",
          coverImage:
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80",
          difficulty: Difficulty.DEBUTANT,
          totalDurationMinutes: 150,
          sessions: [
            {
              title: "Flow ouverture des hanches",
              description: "Routine guidée orientée amplitude et respiration.",
              durationMinutes: 45,
              difficulty: Difficulty.DEBUTANT,
              blocks: [
                ["Respiration au sol", 1, "5 min", 0, "Respiration nasale", ""],
                ["Pigeon stretch", 3, "60 sec / côté", 30, "Reste détendue", ""],
                ["Flow debout", 4, "4 min", 45, "Transitions fluides", ""],
              ],
            },
          ],
        },
      ],
    },
  ];

  let firstCoachId = "";

  for (const [coachIndex, coachSeed] of coachSeeds.entries()) {
    const coachUser = await prisma.user.create({
      data: {
        firstName: coachSeed.firstName,
        lastName: coachSeed.lastName,
        email: coachSeed.email,
        role: Role.COACH,
        passwordHash,
        coachProfile: {
          create: {
            slug: slugify(`${coachSeed.firstName}-${coachSeed.lastName}`),
            approvalStatus: CoachApplicationStatus.APPROVED,
            headline: coachSeed.headline,
            bio: coachSeed.bio,
            photoUrl: coachSeed.photoUrl,
            monthlyPrice: coachSeed.monthlyPrice,
            discipline: coachSeed.discipline,
            specialities: coachSeed.specialities,
            skills: coachSeed.skills,
            experienceYears: coachSeed.experienceYears,
            coachedClientsCount: coachSeed.coachedClientsCount,
            addressLine1: coachSeed.addressLine1,
            city: coachSeed.city,
            postalCode: coachSeed.postalCode,
            country: coachSeed.country,
            phone: coachSeed.phone,
            instagramUrl: coachSeed.instagramUrl || null,
            tiktokUrl: coachSeed.tiktokUrl || null,
            youtubeUrl: coachSeed.youtubeUrl || null,
            linkedinUrl: coachSeed.linkedinUrl || null,
            websiteUrl: coachSeed.websiteUrl || null,
          },
        },
      },
      include: {
        coachProfile: true,
      },
    });

    if (coachIndex === 0 && coachUser.coachProfile) {
      firstCoachId = coachUser.coachProfile.id;
    }

    for (const programSeed of coachSeed.programs) {
      const program = await prisma.program.create({
        data: {
          coachId: coachUser.coachProfile!.id,
          title: programSeed.title,
          description: programSeed.description,
          coverImage: programSeed.coverImage,
          difficulty: programSeed.difficulty,
          totalDurationMinutes: programSeed.totalDurationMinutes,
        },
      });

      for (const [sessionIndex, sessionSeed] of programSeed.sessions.entries()) {
        const session = await prisma.workoutSession.create({
          data: {
            programId: program.id,
            title: sessionSeed.title,
            description: sessionSeed.description,
            durationMinutes: sessionSeed.durationMinutes,
            difficulty: sessionSeed.difficulty,
            order: sessionIndex + 1,
          },
        });

        for (const [blockIndex, block] of sessionSeed.blocks.entries()) {
          const [name, sets, reps, restSeconds, notes, videoUrl] = block as [
            string,
            number,
            string,
            number,
            string,
            string,
          ];
          await prisma.exerciseBlock.create({
            data: {
              sessionId: session.id,
              name,
              sets,
              reps,
              restSeconds,
              notes,
              videoUrl: videoUrl || null,
              order: blockIndex + 1,
            },
          });
        }
      }
    }
  }

  if (firstCoachId) {
    await prisma.subscription.create({
      data: {
        subscriberId: subscriber.id,
        coachId: firstCoachId,
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Base de démonstration 100T créée.");
  console.log("Utilisateur abonné: abonne@100t.fr / motdepasse123");
  console.log("Coach: malik@100t.fr / motdepasse123");
  console.log("Admin: admin@100t.fr / motdepasse123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

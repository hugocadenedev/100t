# 100T

Marketplace française de coaching sportif par abonnement, construite avec Next.js, Prisma et SQLite.

## Fonctionnalités

- Homepage avec recherche et filtre par discipline
- Profils publics coach avec programmes verrouillés pour les non-abonnés
- Abonnement individuel par coach avec confirmation de paiement simulée
- Détail de programme sécurisé, accessible uniquement aux abonnés autorisés
- Dashboard abonné avec coachs actifs, résiliation et programmes récents
- Dashboard coach avec édition du profil, création de programmes, gestion des séances et réorganisation par glisser-déposer
- Authentification email/mot de passe, inscription par rôle et réinitialisation de mot de passe simulée
- Interface entièrement en français et responsive

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Prisma 6
- SQLite locale

## Démarrage

```bash
npm install
npx prisma db push
npm run seed
npm run dev
```

Application locale : http://localhost:3000

## Comptes de démonstration

- Abonné : abonne@100t.fr / motdepasse123
- Coach : malik@100t.fr / motdepasse123

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : build de production
- `npm run start` : serveur de production
- `npm run seed` : réinitialise et peuple la base locale

## Notes produit

- Le paiement est simulé : aucune intégration réelle n'est branchée à ce stade.
- Le contenu verrouillé n'est pas chargé côté page détail sans autorisation active.
- La base de données locale est stockée dans `prisma/dev.db` via SQLite.

## Design handoff

Le socle fonctionnel est implémenté. Pour respecter strictement l'identité visuelle demandée, il reste à injecter le code exporté depuis Stitch comme source unique de vérité pour la couche UI.

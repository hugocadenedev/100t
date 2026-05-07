# TODO — Modifications à apporter à l'app 100T

## 🔴 Priorité haute

### Stripe & Paiements
- [ ] **Offres plateforme via Stripe** : relier les boutons "Choisir cette formule" (`/offres`) à de vraies Checkout Sessions Stripe (Essentielle mensuelle, Essentielle annuelle 239 €/an, Premium)
- [ ] **Abonnement annuel** : ajouter le support `interval: "year"` dans la route `/api/stripe/checkout` et dans le schéma Prisma (`subscriptionInterval`)
- [ ] **Portail client Stripe** : ajouter un lien "Gérer mon abonnement" dans le tableau de bord qui ouvre le Stripe Customer Portal (`stripe.billingPortal.sessions.create`)
- [ ] **Résilier via Stripe Portal** plutôt que via `cancelSubscriptionAction` directement (meilleur UX + gère les remboursements pro-rata)
- [ ] **Webhook** : gérer l'événement `invoice.payment_failed` → notifier l'utilisateur et suspendre l'accès si paiement échoue
- [ ] **Webhook** : gérer `customer.subscription.trial_will_end` si une période d'essai est ajoutée plus tard

### Accès & Sécurité
- [ ] **Vérification statut abonnement Stripe** : actuellement `status` est écrit en BDD via webhook, mais `currentPeriodEnd` est utilisé pour filtrer les accès — s'assurer que les deux sont cohérents
- [ ] **Guard programmes** : vérifier côté serveur que l'abonnement a `status = "active"` (pas seulement `currentPeriodEnd > now`) avant de servir le contenu d'un programme
- [ ] **Variables d'environnement** : ajouter une validation au démarrage (ex: avec `zod`) pour toutes les variables obligatoires (`DATABASE_URL`, `SESSION_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)

---

## 🟡 Priorité moyenne

### Page /offres
- [ ] Rendre les boutons "Choisir cette formule" fonctionnels (actuellement statiques)
- [ ] Afficher l'offre souscrite par l'utilisateur connecté (badge "Actif" sur la bonne card)
- [ ] Gérer le cas où l'utilisateur a déjà un abonnement actif (bouton "Gérer" au lieu de "Choisir")

### Tableau de bord abonné
- [ ] Afficher le vrai montant débité par coach (prix `coach.monthlyPrice`) au lieu de `PLATFORM_MONTHLY_PRICE` fixe
- [ ] Afficher le statut Stripe de l'abonnement (`active`, `past_due`, `canceled`) avec badge visuel
- [ ] Ajouter une section "Factures" avec lien vers le Stripe Customer Portal
- [ ] Montrer la date de prochaine facturation (issue du webhook `currentPeriodEnd`)

### Coach Studio
- [ ] Permettre au coach de voir ses abonnés actifs et leur nombre
- [ ] Afficher les revenus estimés du coach (nb abonnés × `monthlyPrice`)
- [ ] Ajouter la gestion du `stripeProductId` / `stripePriceId` par coach pour éviter de recréer un `price_data` inline à chaque checkout

### Admin
- [ ] Afficher les revenus globaux de la plateforme (total abonnements actifs × prix)
- [ ] Ajouter un filtre/vue par statut Stripe des abonnements (`active`, `past_due`, `canceled`)
- [ ] Permettre de rembourser/annuler un abonnement depuis l'admin via l'API Stripe

---

## 🟢 Améliorations & Finitions

### UX
- [ ] **Email de confirmation** après souscription réussie (via `resend` ou `nodemailer` + template HTML)
- [ ] **Email de rappel** avant renouvellement (j-3)
- [ ] Page `/abonnement/succes` : afficher le récapitulatif de la commande (montant, coach, date de fin de période) via `stripe.checkout.sessions.retrieve`
- [ ] Animation de transition sur la modale d'abonnement (entrée/sortie)

### Performance & Code
- [ ] Remplacer les `price_data` inline dans checkout par des `Price` Stripe prédéfinis (créés une fois à l'inscription du coach)
- [ ] Paginer la liste des coachs sur `/coachs` (actuellement tout en mémoire)
- [ ] Ajouter des index Prisma sur `Subscription.status` et `Subscription.stripeSubscriptionId`
- [ ] Mettre en cache les données de la marketplace (`unstable_cache` Next.js) pour réduire les requêtes BDD

### Infrastructure
- [ ] Passer de SQLite → PostgreSQL pour la production (Supabase, Neon ou Railway)
- [ ] Configurer `NEXT_PUBLIC_APP_URL` en prod (pour les redirections Stripe)
- [ ] Ajouter une CI GitHub Actions : lint + `next build` à chaque PR
- [ ] Configurer un `.env.production` avec les clés Stripe live (`sk_live_...`)
- [ ] Mettre en place le Stripe webhook en production via le Dashboard Stripe (URL `/api/stripe/webhook`)








# Déploiement — 100T

## Infos serveur

| Élément | Valeur |
|---|---|
| IP | 72.61.97.251 |
| OS | Ubuntu 24.04 |
| Accès | `ssh root@72.61.97.251` |
| Répertoire app | `/var/www/100t` |
| Process manager | PM2 (`100t-app`) |
| Reverse proxy | Nginx (port 80 → 3000) |
| Base de données | SQLite — `/var/www/100t/prisma/prod.db` |

---

## Déploiement automatique (CI/CD)

Chaque `git push` sur la branche `main` déclenche automatiquement GitHub Actions.

Le workflow (`.github/workflows/deploy.yml`) s'exécute sur le **self-hosted runner** installé sur le serveur et effectue :

```
git pull origin main
npm ci
npx prisma generate
npx prisma db push
npm run build
pm2 restart ecosystem.config.cjs --update-env
```

### Runner GitHub Actions
- Installé dans `/home/runner/actions-runner`
- Tourne en tant que service systemd : `actions.runner.hugocadenedev-100t.srv1652639`
- Commandes utiles :
  ```bash
  systemctl status actions.runner.hugocadenedev-100t.srv1652639
  systemctl restart actions.runner.hugocadenedev-100t.srv1652639
  ```

---

## Déploiement manuel (si Actions échoue)

```bash
ssh root@72.61.97.251
cd /var/www/100t
git pull origin main
npm ci
npx prisma generate
npx prisma db push
npm run build
pm2 restart ecosystem.config.cjs --update-env
```

---

## Commandes PM2 utiles

```bash
pm2 status                          # état de l'app
pm2 logs 100t-app --lines 50        # logs en direct
pm2 logs 100t-app --lines 50 --nostream  # snapshot des logs
pm2 restart 100t-app                # redémarrage simple
pm2 restart ecosystem.config.cjs --update-env  # redémarrage + rechargement .env
```

---

## Fichier .env serveur

Chemin : `/var/www/100t/.env`

```env
DATABASE_URL="file:/var/www/100t/prisma/prod.db"
SESSION_SECRET="..."
COOKIE_SECURE=false          # false tant que pas de HTTPS
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://72.61.97.251"
```

> ⚠️ Le `.env` serveur n'est pas dans git. À recréer manuellement si le serveur est réinstallé.

---

## Nginx

Config : `/etc/nginx/sites-enabled/100t`

```nginx
server {
    listen 80;
    server_name 72.61.97.251;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Commandes :
```bash
systemctl status nginx
systemctl restart nginx
nginx -t   # tester la config avant reload
```

---

## Créer le compte admin (première installation)

```bash
cd /var/www/100t
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('./node_modules/.prisma/client');
const prisma = new PrismaClient();
bcrypt.hash('TON_MOT_DE_PASSE', 12).then(hash => {
  return prisma.user.create({
    data: { firstName: 'Admin', lastName: '100T', email: 'admin@100t.fr', role: 'ADMIN', passwordHash: hash }
  });
}).then(u => { console.log('Admin créé:', u.email); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
"
```

Connexion : `http://72.61.97.251/connexion` → redirige vers `/admin`

---

## Points d'attention

- **HTTPS** : quand un domaine + SSL sera configuré, passer `COOKIE_SECURE=true` dans le `.env` serveur
- **SQLite** : pas de `mode: "insensitive"` dans les requêtes Prisma (PostgreSQL uniquement)
- **Cookies** : après un changement du flag `secure`, les utilisateurs doivent se reconnecter
- **ecosystem.config.cjs** : fichier commité dans git, ne pas le supprimer

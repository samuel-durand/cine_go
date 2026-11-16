# Déploiement (Railway)

L'application se déploie en deux services : l'API Flask (`server/`) et le front Vite (`client/`),
plus une base MySQL.

## 1. Base MySQL

Dans le projet Railway : **New → Database → MySQL**. Railway expose `MYSQL_URL`
(`mysql://user:pass@host:port/railway`).

## 2. Service API (Flask)

- **Root Directory** : `server`
- **Build** : détecté automatiquement via `requirements.txt` (`pip install -r requirements.txt`)
- **Start Command** : `flask --app wsgi init-db && gunicorn wsgi:app --bind 0.0.0.0:$PORT`
  (`init-db` est idempotent : il ne crée que les tables manquantes)

Variables d'environnement :

```env
FLASK_ENV=production
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=<chaîne aléatoire d'au moins 32 caractères>
FRONTEND_URL=https://<url-du-front>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CURRENCY=eur
EMAIL_SERVICE=gmail
EMAIL_USER=...
EMAIL_PASSWORD=<mot de passe d'application>
```

`DATABASE_URL` peut commencer par `mysql://` : l'API ajoute automatiquement le driver PyMySQL.

Créer l'administrateur une fois déployé (shell Railway) :

```bash
flask --app wsgi create-admin admin@exemple.fr <mot-de-passe>
```

> Les images uploadées sont stockées dans `server/uploads/public/`. Sur Railway, montez un
> **volume** sur `/app/uploads` pour qu'elles survivent aux redéploiements.

## 3. Service Front (Vite)

- **Root Directory** : `client`
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm run preview`

```env
VITE_API_URL=https://<url-de-l-api>/api
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

## Variante : un seul service

Avec `FLASK_ENV=production`, Flask sert aussi le build React s'il trouve `client/build/`.
Construisez le front (`cd client && npm run build`) puis lancez l'API depuis `server/`.

## Migration depuis l'ancienne base MongoDB

```bash
cd server
pip install pymongo
python scripts/migrate_from_mongo.py "mongodb+srv://.../cinego"
```

Les mots de passe sont conservés (même format bcrypt).

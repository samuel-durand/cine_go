# Démarrage rapide

## Prérequis

- Python 3.11+
- Node.js 18+
- Un serveur MySQL 8 (local, Docker ou hébergé)

## 1. Base MySQL

```sql
CREATE DATABASE cinego CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Avec Docker :

```bash
docker run -d --name cinego-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=cinego mysql:8
```

## 2. API Flask

```bash
cd server
python -m venv .venv
.venv\Scripts\activate            # Linux/Mac : source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env            # Linux/Mac : cp .env.example .env
```

Renseignez au minimum dans `server/.env` : `MYSQL_*` (ou `DATABASE_URL`), `JWT_SECRET`, `STRIPE_SECRET_KEY`.

```bash
flask --app wsgi init-db                              # crée les tables
flask --app wsgi seed-genres                          # genres par défaut
flask --app wsgi seed-salles                          # un cinéma + 5 salles avec plans
flask --app wsgi seed-cinemas                         # (optionnel) réseau de 6 cinémas Ciné Go
flask --app wsgi create-admin admin@cinego.com admin123
flask --app wsgi import-pathe                         # films au cinéma + 30 plus attendus (pathe.fr)
flask --app wsgi seed-seances --days 7                # programme de la semaine (--reset pour refaire)
python wsgi.py                                        # API sur http://localhost:5000
```

## 3. Front React

```bash
cd client
npm install
```

Créez `client/.env` :

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

```bash
npm run dev                                           # http://localhost:3000
```

Ou depuis la racine, les deux en même temps : `npm run dev`.

## Administration

Connectez-vous avec le compte admin puis ouvrez **Admin** dans le menu.

## Tests

```bash
cd server && python -m pytest -q
```

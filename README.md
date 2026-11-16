# Ciné Go - Réservation de places de cinéma

Application de réservation de places de cinéma : films à l'affiche, séances par cinéma,
choix des sièges sur plan, paiement Stripe, billet QR code par e-mail et back-office complet.

## Technologies

| Partie | Stack |
| --- | --- |
| API | **Flask 3** (application factory + blueprints), **SQLAlchemy 2**, **MySQL** (PyMySQL), JWT (PyJWT), bcrypt, Stripe, qrcode |
| Front | **React 18** + **Vite**, React Router, Material UI, Tailwind, Axios, React Stripe.js |
| Tests | pytest (SQLite en mémoire, Stripe simulé) |

## Démarrage rapide

Voir [QUICKSTART.md](QUICKSTART.md). En résumé :

```bash
# API
cd server
python -m venv .venv && .venv\Scripts\activate      # (Linux/Mac : source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env                                # puis renseigner MySQL, JWT_SECRET, Stripe
flask --app wsgi init-db
flask --app wsgi seed-genres
flask --app wsgi seed-salles
flask --app wsgi create-admin admin@cinego.com motdepasse
flask --app wsgi import-pathe                         # films au cinéma + les plus attendus
flask --app wsgi seed-seances --days 7
python wsgi.py                                        # http://localhost:5000

# Front (autre terminal)
cd client
npm install
npm run dev                                           # http://localhost:3000
```

## Structure

```
cine_go/
├── server/                    # API Flask
│   ├── app/
│   │   ├── __init__.py        # create_app() : config, CORS, blueprints, fichiers statiques
│   │   ├── config.py          # Configuration (variables d'environnement)
│   │   ├── models.py          # Modèles SQLAlchemy + sérialisation JSON
│   │   ├── auth.py            # JWT, décorateurs login_required / admin_required
│   │   ├── errors.py          # ApiError et gestionnaires d'erreurs JSON
│   │   ├── utils.py           # Parsing des requêtes, upload d'images
│   │   ├── cli.py             # Commandes flask (init-db, seed-*, create-admin)
│   │   ├── routes/            # Un blueprint par ressource
│   │   └── services/          # Sièges, Stripe, e-mails
│   ├── scripts/
│   │   ├── import_pathe.py        # Raccourci de « flask --app wsgi import-pathe »
│   │   └── migrate_from_mongo.py  # Migration des données de l'ancienne base MongoDB
│   ├── tests/                 # Tests de l'API (pytest)
│   ├── requirements.txt
│   └── wsgi.py                # Point d'entrée (dev : python wsgi.py, prod : gunicorn wsgi:app)
└── client/                    # Front React
    └── src/
        ├── theme.js           # Thème MUI (palette Ciné Go : or #FFD700 / noir)
        ├── components/
        │   ├── common/        # Loader, EmptyState, SectionHeader, AuthLayout
        │   ├── films/         # PosterCard, FilmRail, HeroCarousel, TrailerDialog
        │   ├── seances/       # DayStrip, ShowtimeButton
        │   └── Navbar, Footer, SeatMap…
        ├── pages/             # Pages publiques + pages admin
        └── utils/             # axiosConfig (client API), format (dates, prix, images)
```

## Base de données (MySQL)

| Table | Contenu |
| --- | --- |
| `users` | Comptes (mot de passe bcrypt, rôle `user`/`admin`) |
| `genres`, `films`, `film_ratings` | Catalogue et notes des spectateurs |
| `cinemas`, `salles` | Cinémas et salles (plan de salle en JSON) |
| `seances` | Séances (copie figée du plan de la salle) |
| `reservations`, `reservation_sieges` | Commandes et sièges achetés |
| `sieges_reserves` | Occupation des sièges : contrainte unique (séance, siège) contre la double réservation |
| `commentaires` | Avis et réponse éventuelle |

Les tables sont créées par `flask --app wsgi init-db`. Pour reprendre les données de l'ancienne
version MongoDB : `python scripts/migrate_from_mongo.py "<MONGODB_URI>"` (nécessite `pip install pymongo`).

## API

Le format JSON est identique à l'ancienne API Express (`_id` en chaîne, objets liés imbriqués).

| Ressource | Routes principales |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Films | `GET /api/films`, `GET /api/films/:id`, `GET /api/films/:id/cinemas`, `POST/GET /api/films/:id/rating`, CRUD admin |
| Genres | `GET /api/genres`, CRUD admin |
| Cinémas | `GET /api/cinemas`, `GET /api/cinemas/:id` (avec salles), CRUD admin |
| Salles | `GET /api/salles?cinemaId=`, CRUD admin |
| Séances | `GET /api/seances?filmId=&cinemaId=&date=`, `GET /api/seances/dates?filmId=&cinemaId=`, `GET /api/seances/:id`, planning et blocage (admin) |
| Réservations | `GET /api/reservations/my-reservations`, `POST /api/reservations`, `PUT /api/reservations/:id/cancel`, gestion admin |
| Paiements | `POST /api/payments/create-payment-intent` |
| Billets | `GET /api/tickets/:id`, `POST /api/tickets/validate` |
| Commentaires | `GET/POST /api/commentaires/film/:filmId`, réponses `/api/commentaires/:id/reponse` |
| Utilisateurs | `PUT /api/users/profile`, gestion admin |
| Utilitaires | `POST /api/utils/test-email`, `GET /api/utils/check-salles` |

## Import des films (pathe.fr)

`flask --app wsgi import-pathe [--upcoming 30] [--now N]` importe depuis l'API publique de pathe.fr :

- **les films au cinéma** (séances dans les prochaines 24 h), avec leur ordre de mise en avant ;
- **les plus attendus** (sorties à venir classées par attente, avec le nombre de spectateurs intéressés) ;
- affiche, visuel paysage, synopsis, casting, bande-annonce (MP4), avertissement, nationalité.

Relancer la commande met les films à jour sans doublon. Les images sont chargées depuis le CDN de Pathé.
`init-db` ajoute automatiquement les nouvelles colonnes à une base existante.

## Tests

```bash
cd server
pip install pytest
python -m pytest -q
```

## E-mails

`EMAIL_SERVICE` = `gmail`, `smtp` ou `ethereal` (identifiants requis). Sans configuration, les e-mails
de confirmation sont écrits au format `.eml` dans `server/instance/outbox/` pour pouvoir les ouvrir
localement. Le QR code du billet est intégré à l'e-mail en pièce jointe inline.

## Licence

MIT

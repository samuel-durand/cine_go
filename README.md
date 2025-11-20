# Ciné Go - Système de réservation de places de cinéma

Application complète de réservation de places de cinéma avec gestion des plannings, profil utilisateur, historique des commandes et panel administrateur.

## Technologies utilisées

### Backend
- **Express.js** - Framework Node.js
- **MongoDB** avec **Mongoose** - Base de données
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe
- **Stripe (SDK Node)** - Paiements sécurisés

### Frontend
- **React** - Bibliothèque JavaScript
- **Vite** - Build tool et serveur de développement (ultra-rapide)
- **React Router** - Routing
- **Material UI** - Composants UI
- **Tailwind CSS** - Framework CSS
- **Axios** - Client HTTP
- **React Stripe.js** - Formulaire de paiement

## Installation

### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB (local ou MongoDB Atlas)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet et installer les dépendances**

```bash
npm run install-all
```

2. **Configurer l'environnement backend**

Créez un fichier `.env` dans le dossier `server/` :

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cinego
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_CURRENCY=eur
```

Créez ensuite un fichier `.env` dans `client/` (avec le préfixe `VITE_` pour Vite) :

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle
```

3. **Démarrer l'application**

Pour démarrer le backend et le frontend simultanément :

```bash
npm run dev
```

Ou séparément :

```bash
# Backend
npm run server

# Frontend (dans un autre terminal)
npm run client
```

## Structure du projet

```
cine-go/
├── server/                 # Backend Express
│   ├── models/            # Modèles Mongoose
│   ├── routes/            # Routes API
│   ├── middleware/        # Middleware (auth, etc.)
│   └── index.js           # Point d'entrée serveur
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── context/       # Context API (Auth)
│   │   └── App.js         # Composant principal
│   └── public/
└── package.json           # Configuration racine
```

## Fonctionnalités

### Utilisateur
- ✅ Inscription et connexion
- ✅ Consultation des films à l'affiche
- ✅ Détails des films avec séances disponibles
- ✅ Réservation de places
- ✅ Sélection des sièges sur un plan interactif
- ✅ Paiement en ligne sécurisé (Stripe)
- ✅ Profil utilisateur (modification des informations)
- ✅ Historique des réservations

### Administrateur
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des films (CRUD)
- ✅ Gestion des salles avec types (Classic, VIP, Premium, IMAX, 4DX)
- ✅ Gestion des séances (CRUD)
- ✅ Visualisation des plannings par salle
- ✅ Blocage/Déblocage de créneaux avec raison
- ✅ Gestion des réservations (visualisation et modification des statuts)
- ✅ Gestion des utilisateurs (visualisation et suppression)

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur connecté

### Films
- `GET /api/films` - Liste des films (public)
- `GET /api/films/:id` - Détails d'un film
- `GET /api/films/all` - Tous les films (admin)
- `POST /api/films` - Créer un film (admin)
- `PUT /api/films/:id` - Modifier un film (admin)
- `DELETE /api/films/:id` - Supprimer un film (admin)

### Salles
- `GET /api/salles` - Liste des salles (public)
- `GET /api/salles/all` - Toutes les salles (admin)
- `GET /api/salles/:id` - Détails d'une salle
- `POST /api/salles` - Créer une salle (admin)
- `PUT /api/salles/:id` - Modifier une salle (admin)
- `DELETE /api/salles/:id` - Supprimer une salle (admin)

### Séances
- `GET /api/seances` - Liste des séances (avec filtres, exclut les séances bloquées)
- `GET /api/seances/:id` - Détails d'une séance
- `GET /api/seances/all` - Toutes les séances (admin)
- `GET /api/seances/planning/:salleId` - Planning d'une salle pour une date (admin)
- `POST /api/seances` - Créer une séance (admin)
- `PUT /api/seances/:id` - Modifier une séance (admin)
- `PUT /api/seances/:id/block` - Bloquer/Débloquer une séance (admin)
- `DELETE /api/seances/:id` - Supprimer une séance (admin)

### Réservations
- `GET /api/reservations/my-reservations` - Mes réservations
- `GET /api/reservations/all` - Toutes les réservations (admin)
- `GET /api/reservations/:id` - Détails d'une réservation
- `POST /api/reservations` - Créer une réservation
- `PUT /api/reservations/:id/cancel` - Annuler une réservation
- `PUT /api/reservations/:id/status` - Modifier le statut (admin)

### Paiements
- `POST /api/payments/create-payment-intent` - Créer un Payment Intent Stripe (auth requis)

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Détails d'un utilisateur (admin)
- `GET /api/users/:id/stats` - Statistiques d'un utilisateur (admin)
- `PUT /api/users/profile` - Modifier son profil
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)

## Paiements Stripe

- Création d'un Payment Intent côté serveur avec calcul automatique du montant (prix séance × places) et métadonnées (user/seance)
- Confirmation du paiement via React Stripe Elements (carte bancaire)
- Génération de la réservation uniquement après confirmation Stripe réussie
- Annulation d'une réservation déclenche automatiquement une demande de remboursement Stripe (si le paiement a été capturé)

## Initialisation des données

### Créer un administrateur
```bash
cd server
node scripts/createAdmin.js admin@example.com motdepasse123
```

### Initialiser les salles par défaut
```bash
cd server
node scripts/initSalles.js
```

Cela créera 5 salles par défaut :
- 2 salles Classic (150 et 120 places)
- 1 salle VIP (50 places)
- 1 salle Premium (80 places)
- 1 salle IMAX (200 places)

## Notes importantes

- Assurez-vous que MongoDB est en cours d'exécution avant de démarrer le serveur
- Fournissez vos clés Stripe (`STRIPE_SECRET_KEY` côté serveur et `VITE_STRIPE_PUBLIC_KEY` côté client)
- Le premier utilisateur créé peut être promu administrateur manuellement dans la base de données
- Les images de films doivent être des URLs valides (ou vous pouvez ajouter un système d'upload)
- Les séances bloquées ne sont pas visibles pour les utilisateurs et ne peuvent pas être réservées

## Développement futur

- [ ] Upload d'images pour les films
- [ ] Système de notation des films
- [ ] Notifications par email
- [ ] Sélection de places spécifiques sur un plan de salle
- [ ] Export des données (PDF, Excel)
- [ ] Graphiques et analytics avancés

## Licence

MIT


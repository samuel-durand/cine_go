# Ciné Go - Système de réservation de places de cinéma

Application complète de réservation de places de cinéma avec gestion des plannings, profil utilisateur, historique des commandes et panel administrateur.

## Technologies utilisées

### Backend
- **Express.js** - Framework Node.js
- **MongoDB** avec **Mongoose** - Base de données
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe
- **Stripe (SDK Node)** - Paiements sécurisés
- **Multer** - Upload de fichiers (images)

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
│   ├── models/            # Modèles Mongoose (Film, Salle, Seance, Cinema, User, Reservation)
│   ├── routes/            # Routes API
│   ├── middleware/        # Middleware (auth, upload, etc.)
│   ├── scripts/           # Scripts utilitaires (createAdmin, fix-salles-cinema, etc.)
│   ├── utils/             # Utilitaires (seatHelpers)
│   ├── uploads/           # Fichiers uploadés (images)
│   └── index.js           # Point d'entrée serveur
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── admin/     # Pages administrateur
│   │   │   └── ...        # Pages publiques (Films, Cinemas, etc.)
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
- ✅ **Navigation par cinémas** - Liste des cinémas et détails
- ✅ **Filtrage par cinéma** - Voir les séances par cinéma
- ✅ **Système de notation** - Noter les films (0-10 étoiles)
- ✅ Réservation de places
- ✅ Sélection des sièges sur un plan interactif
- ✅ Paiement en ligne sécurisé (Stripe)
- ✅ Profil utilisateur (modification des informations)
- ✅ Historique des réservations

## ✨ Nouveautés récentes

### 🎬 Système de cinémas
- **Modèle Cinema** - Gestion complète des cinémas avec :
  - Informations complètes (nom, adresse, ville, code postal, téléphone, email)
  - Upload d'images pour les cinémas
  - Statut actif/inactif
- **Pages publiques** :
  - `/cinemas` - Liste de tous les cinémas disponibles
  - `/cinemas/:id` - Détails d'un cinéma avec ses séances et films à l'affiche
- **Liaison hiérarchique** : Cinema → Salle → Séance → Film
- **Filtrage intelligent** :
  - Voir les films par cinéma
  - Filtrer les séances par cinéma et par date
  - Groupement des séances par cinéma puis par salle

### 📸 Upload d'images pour les films
- **Upload via interface admin** - Ajout d'images directement depuis l'interface
- **Stockage local** - Images stockées dans `server/uploads/public/`
- **Prévisualisation** - Aperçu de l'image avant validation
- **Support des formats** : JPG, PNG, JPEG
- **Middleware Multer** - Gestion sécurisée des uploads

### ⭐ Système de notation des films
- **Notation de 0 à 10 étoiles** - Interface intuitive avec Material UI Rating
- **Note moyenne calculée automatiquement** - Mise à jour en temps réel
- **Compteur de notes** - Affichage du nombre total de notes
- **Note personnelle** - Chaque utilisateur peut voir et modifier sa propre note
- **API dédiée** :
  - `POST /api/films/:id/rating` - Ajouter/Modifier une note
  - `GET /api/films/:id/rating` - Récupérer la note de l'utilisateur et la moyenne

### 🎨 Design moderne avec Glassmorphisme
- **Effet glassmorphisme** appliqué sur toutes les cartes et divs principales
  - Fond semi-transparent avec effet de flou (`backdrop-filter: blur(10px)`)
  - Bordures subtiles et ombres élégantes
  - Application sur les pages : Films, Home, FilmDetail, Reservation, Cinemas, CinemaDetail
  - Design moderne et épuré avec une esthétique premium

### 🔄 Amélioration du processus de réservation
- **Processus en deux étapes** pour une meilleure expérience utilisateur :
  1. **Étape 1 : Choix des places** - Sélection des sièges ou nombre de places
  2. **Étape 2 : Paiement** - Saisie des informations de carte bancaire avec bouton retour
- 💳 **Amélioration du formulaire de paiement** :
  - Texte blanc pour les informations de carte bancaire
  - Design glassmorphisme pour la section de paiement
  - Interface plus claire et intuitive

### 📅 Filtrage par date amélioré
- **Filtrage robuste** - Gestion correcte des fuseaux horaires
- **Double filtrage** - Côté serveur et client pour garantir la précision
- **Normalisation UTC** - Conversion des dates en UTC pour éviter les problèmes

### Administrateur
- ✅ Tableau de bord avec statistiques
- ✅ **Gestion des cinémas (CRUD)** - Création, modification, suppression de cinémas
- ✅ **Upload d'images pour les cinémas** - Ajout d'images via interface admin
- ✅ **Gestion des films (CRUD)** - Avec upload d'images
- ✅ **Gestion des salles avec types** (Classic, VIP, Premium, IMAX, 4DX)
  - **Liaison aux cinémas** - Chaque salle est associée à un cinéma
  - **Filtrage par cinéma** - Voir les salles d'un cinéma spécifique
- ✅ **Gestion des séances (CRUD)** - Avec filtrage par cinéma
  - **Sélection du cinéma** - Filtrer les salles par cinéma lors de la création
  - **Filtrage des séances** - Voir les séances d'un cinéma spécifique
- ✅ Visualisation des plannings par salle
- ✅ Blocage/Débloquer de créneaux avec raison
- ✅ Gestion des réservations (visualisation et modification des statuts)
- ✅ Gestion des utilisateurs (visualisation et suppression)
- ✅ **Routes utilitaires** - Vérification et correction des salles sans cinéma

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur connecté

### Films
- `GET /api/films` - Liste des films (public)
- `GET /api/films/:id` - Détails d'un film (inclut les cinémas où il est projeté)
- `GET /api/films/:id/cinemas` - Liste des cinémas qui projettent un film
- `GET /api/films/all` - Tous les films (admin)
- `POST /api/films` - Créer un film avec upload d'image (admin)
- `PUT /api/films/:id` - Modifier un film avec upload d'image (admin)
- `DELETE /api/films/:id` - Supprimer un film (admin)
- `POST /api/films/:id/rating` - Noter un film (auth requis)
- `GET /api/films/:id/rating` - Récupérer la note de l'utilisateur (auth requis)

### Cinémas
- `GET /api/cinemas` - Liste des cinémas actifs (public)
- `GET /api/cinemas/:id` - Détails d'un cinéma avec ses salles
- `GET /api/cinemas/all` - Tous les cinémas (admin)
- `POST /api/cinemas` - Créer un cinéma avec upload d'image (admin)
- `PUT /api/cinemas/:id` - Modifier un cinéma avec upload d'image (admin)
- `DELETE /api/cinemas/:id` - Supprimer un cinéma (admin)

### Salles
- `GET /api/salles` - Liste des salles (public, filtre par `cinemaId` optionnel)
- `GET /api/salles/all` - Toutes les salles (admin, filtre par `cinemaId` optionnel)
- `GET /api/salles/:id` - Détails d'une salle avec son cinéma
- `POST /api/salles` - Créer une salle liée à un cinéma (admin)
- `PUT /api/salles/:id` - Modifier une salle (admin)
- `DELETE /api/salles/:id` - Supprimer une salle (admin)

### Séances
- `GET /api/seances` - Liste des séances (avec filtres `filmId` et `date`, exclut les séances bloquées)
  - **Populate automatique** : Film, Salle (avec son Cinéma)
  - **Filtrage par date robuste** - Gestion correcte des fuseaux horaires
- `GET /api/seances/:id` - Détails d'une séance avec film, salle et cinéma
- `GET /api/seances/all` - Toutes les séances (admin, avec filtrage par cinéma)
- `GET /api/seances/planning/:salleId` - Planning d'une salle pour une date (admin)
- `POST /api/seances` - Créer une séance liée à une salle (admin)
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

### Utilitaires (Admin)
- `GET /api/utils/check-salles` - Vérifier l'état des salles (sans cinéma, cinéma invalide, etc.)
- `POST /api/utils/fix-salles-cinema` - Corriger automatiquement les salles sans cinéma valide

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

**Note importante** : Ce script crée des salles sans cinéma. Vous devez ensuite :
1. Créer au moins un cinéma via l'interface admin (`/admin/cinemas`)
2. Exécuter le script de correction des salles (voir ci-dessous)

Cela créera 5 salles par défaut :
- 2 salles Classic (150 et 120 places)
- 1 salle VIP (50 places)
- 1 salle Premium (80 places)
- 1 salle IMAX (200 places)

### Corriger les salles sans cinéma
Si vous avez des salles sans cinéma ou avec un cinéma invalide, utilisez ce script :

```bash
cd server
npm run fix-salles
```

Ou directement :
```bash
cd server
node scripts/fix-salles-cinema.js
```

Ce script :
- ✅ Vérifie toutes les salles
- ✅ Détecte les salles sans cinéma
- ✅ Détecte les salles avec un cinéma invalide
- ✅ Corrige automatiquement en assignant le premier cinéma actif disponible
- ✅ Affiche un rapport détaillé des corrections

## Notes importantes

- Assurez-vous que MongoDB est en cours d'exécution avant de démarrer le serveur
- Fournissez vos clés Stripe (`STRIPE_SECRET_KEY` côté serveur et `VITE_STRIPE_PUBLIC_KEY` côté client)
- Le premier utilisateur créé peut être promu administrateur manuellement dans la base de données
- **Système de cinémas** : Toutes les salles doivent être liées à un cinéma. Utilisez le script `fix-salles-cinema.js` pour corriger les salles sans cinéma
- **Upload d'images** : Les images sont stockées localement dans `server/uploads/public/`. Ce dossier est ignoré par Git
- Les séances bloquées ne sont pas visibles pour les utilisateurs et ne peuvent pas être réservées
- **Filtrage par date** : Les dates sont normalisées en UTC pour éviter les problèmes de fuseau horaire
- **Structure hiérarchique** : Cinema → Salle → Séance → Film (chaque niveau doit être correctement lié)

## Développement futur

- [x] ✅ Upload d'images pour les films
- [x] ✅ Système de notation des films
- [x] ✅ Système de gestion des cinémas
- [ ] Notifications par email
- [ ] Sélection de places spécifiques sur un plan de salle interactif
- [ ] Export des données (PDF, Excel)
- [ ] Graphiques et analytics avancés
- [ ] Recherche avancée de films
- [ ] Favoris et listes personnalisées
- [ ] Système de recommandations

## Licence

MIT


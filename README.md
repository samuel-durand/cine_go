# CineGo - Backend API

Backend Express.js pour le système de réservation de places de cinéma.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine :

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cinego
JWT_SECRET=votre_secret_jwt_super_securise
STRIPE_SECRET_KEY=sk_test_votre_cle_stripe_secrete
FRONTEND_URL=https://votre-frontend.railway.app
```

## Démarrage

```bash
npm start
```

## Déploiement sur Railway

1. Créez un nouveau service sur Railway
2. Connectez-le à cette branche `backend`
3. **Root Directory** : laissez vide (ou `/`) - tout est à la racine maintenant
4. Railway détectera automatiquement Node.js et installera les dépendances
5. Configurez les variables d'environnement dans les paramètres Railway

Le fichier `nixpacks.toml` garantit que les dépendances sont installées correctement.


# CineGo - Frontend

Frontend React pour le système de réservation de places de cinéma.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` à la racine :

```env
VITE_API_URL=https://votre-backend.railway.app/api
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_stripe_publique
```

## Développement

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Déploiement sur Railway

1. Créez un nouveau service sur Railway
2. Connectez-le à cette branche `frontend`
3. **Root Directory** : laissez vide (ou `/`) - tout est à la racine maintenant
4. **Build Command** : `npm install && npm run build`
5. **Start Command** : `npm run preview`
6. Configurez les variables d'environnement dans les paramètres Railway :
   - `VITE_API_URL` : URL de votre backend Railway
   - `VITE_STRIPE_PUBLIC_KEY` : Clé publique Stripe

Railway détectera automatiquement Node.js et Vite grâce au `package.json` à la racine.


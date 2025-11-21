# Guide de Déploiement sur Railway

Ce guide explique comment déployer l'application CineGo (frontend et backend) sur Railway.

## 🚀 Options de Déploiement

Vous avez deux options pour déployer sur Railway :

### Option 1 : Deux Services Séparés (Recommandé)
- **Service Backend** : API Express.js
- **Service Frontend** : Application React

### Option 2 : Service Monolithique
- Un seul service qui sert à la fois le backend et le frontend

---

## 📋 Prérequis

1. Un compte Railway (https://railway.app)
2. Un compte MongoDB Atlas (ou une base de données MongoDB)
3. Un compte Stripe (pour les paiements)
4. Git (pour pousser le code)

---

## 🔧 Option 1 : Déploiement avec Deux Services Séparés

### Étape 1 : Créer le Service Backend

1. Connectez-vous à Railway et créez un nouveau projet
2. Cliquez sur "New" → "GitHub Repo" et sélectionnez votre dépôt
3. Ajoutez un nouveau service en cliquant sur "+ New"
4. Sélectionnez "GitHub Repo" et choisissez votre dépôt
5. Dans les paramètres du service :
   - **Root Directory** : `server` ⚠️ **IMPORTANT** : Ce paramètre est crucial !
   - **Build Command** : `npm install` (installe les dépendances du serveur)
   - **Start Command** : `npm start`

**Important** : 
- Le **Root Directory** doit être défini sur `server` pour que Railway sache où se trouve le `package.json`
- Railway/Nixpacks devrait détecter automatiquement Node.js et installer les dépendances, mais si ce n'est pas le cas, le fichier `server/nixpacks.toml` force l'installation
- Assurez-vous que le fichier `server/package.json` contient toutes les dépendances nécessaires
- Si les dépendances ne s'installent toujours pas, vérifiez les logs de build dans Railway

### Étape 2 : Configurer les Variables d'Environnement du Backend

Dans les paramètres du service backend, ajoutez ces variables d'environnement :

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cinego?retryWrites=true&w=majority
JWT_SECRET=votre_secret_jwt_super_securise
STRIPE_SECRET_KEY=sk_test_votre_cle_stripe_secrete
```

**Note** : Railway génère automatiquement une variable `PORT`, mais vous pouvez la définir manuellement.

### Étape 3 : Créer le Service Frontend

1. Dans le même projet Railway, ajoutez un nouveau service
2. Sélectionnez "GitHub Repo" et choisissez votre dépôt
3. Dans les paramètres du service :
   - **Root Directory** : `client`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm run preview`

### Étape 4 : Configurer les Variables d'Environnement du Frontend

Dans les paramètres du service frontend, ajoutez ces variables :

```
VITE_API_URL=https://votre-backend.railway.app/api
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_stripe_publique
```

**Important** : Remplacez `https://votre-backend.railway.app` par l'URL réelle de votre service backend (visible dans les paramètres du service backend sur Railway).

### Étape 5 : Configurer CORS sur le Backend

Le backend doit autoriser les requêtes depuis le frontend. Modifiez `server/index.js` si nécessaire :

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://votre-frontend.railway.app',
  credentials: true
}));
```

---

## 🔧 Option 2 : Déploiement Monolithique

### Étape 1 : Créer le Service

1. Connectez-vous à Railway et créez un nouveau projet
2. Cliquez sur "New" → "GitHub Repo" et sélectionnez votre dépôt
3. Dans les paramètres du service :
   - **Root Directory** : `/` (racine du projet)
   - **Build Command** : `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start Command** : `cd server && npm start`

**Note** : La commande de build installe d'abord les dépendances du frontend (`client`), construit l'application, puis installe les dépendances du serveur (`server`). Railway exécutera ces commandes automatiquement lors du déploiement.

### Étape 2 : Configurer les Variables d'Environnement

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cinego?retryWrites=true&w=majority
JWT_SECRET=votre_secret_jwt_super_securise
STRIPE_SECRET_KEY=sk_test_votre_cle_stripe_secrete
VITE_API_URL=/api
VITE_STRIPE_PUBLIC_KEY=pk_test_votre_cle_stripe_publique
```

---

## 📝 Variables d'Environnement Détaillées

### Backend

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port d'écoute du serveur | `5000` |
| `NODE_ENV` | Environnement d'exécution | `production` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb+srv://...` |
| `JWT_SECRET` | Secret pour signer les tokens JWT | `votre_secret_securise` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_test_...` |
| `FRONTEND_URL` | URL du frontend (pour CORS) | `https://...` |

### Frontend

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_URL` | URL de l'API backend | `https://backend.railway.app/api` |
| `VITE_STRIPE_PUBLIC_KEY` | Clé publique Stripe | `pk_test_...` |

---

## 🔄 Déploiement Automatique

Railway déploie automatiquement à chaque push sur la branche principale de votre dépôt GitHub.

Pour activer le déploiement automatique :
1. Allez dans les paramètres du service
2. Activez "Auto Deploy" si ce n'est pas déjà fait
3. Choisissez la branche à surveiller (généralement `main` ou `master`)

---

## 🐛 Dépannage

### Le backend ne démarre pas

- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez les logs dans Railway pour voir les erreurs
- Assurez-vous que MongoDB est accessible depuis Railway
- **Vérifiez que le Root Directory est bien défini sur `server`** dans les paramètres du service
- Vérifiez que les dépendances du serveur sont bien installées (consultez les logs de build dans Railway)
- Si les dépendances ne s'installent pas, vérifiez que le fichier `server/nixpacks.toml` est présent dans votre dépôt
- Si vous modifiez `server/package.json`, assurez-vous de pousser les changements sur GitHub pour que Railway réinstalle les dépendances

### Les dépendances ne s'installent pas

- Vérifiez que le **Root Directory** est défini sur `server` (sans slash final)
- Vérifiez que le fichier `server/package.json` existe et contient les dépendances
- Vérifiez que le fichier `server/nixpacks.toml` est présent (il force l'installation)
- Consultez les logs de build dans Railway pour voir les erreurs d'installation
- Essayez de redéployer le service après avoir vérifié la configuration

### Le frontend ne peut pas se connecter au backend

- Vérifiez que `VITE_API_URL` pointe vers la bonne URL
- Vérifiez que CORS est correctement configuré sur le backend
- Vérifiez que le backend est bien démarré et accessible

### Les images ne s'affichent pas

- Vérifiez que le dossier `server/uploads` est bien créé
- Vérifiez que les fichiers sont bien servis via `/uploads`

---

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Stripe Documentation](https://stripe.com/docs)

---

## ✅ Checklist de Déploiement

- [ ] Compte Railway créé
- [ ] Projet Railway créé
- [ ] Service(s) créé(s)
- [ ] Build Command configuré avec `npm install` pour le serveur
- [ ] Variables d'environnement configurées
- [ ] MongoDB Atlas configuré et accessible
- [ ] Clés Stripe configurées
- [ ] CORS configuré correctement
- [ ] Dépendances du serveur installées (automatique via Railway)
- [ ] Déploiement réussi
- [ ] Application testée en production

---

**Note** : Après le déploiement, Railway vous fournira des URLs publiques pour vos services. Utilisez ces URLs pour configurer les variables d'environnement et tester votre application.


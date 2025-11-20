# Guide de démarrage rapide

## Installation

1. **Installer toutes les dépendances**
```bash
npm run install-all
```

2. **Configurer MongoDB**
   - Assurez-vous que MongoDB est installé et en cours d'exécution
   - Ou utilisez MongoDB Atlas (gratuit) et mettez l'URI dans `.env`

3. **Configurer les variables d'environnement**

Créez `server/.env` :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cinego
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_CURRENCY=eur
```

Créez `client/.env` :
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_votre_cle
```

4. **Créer un utilisateur administrateur** (optionnel)
```bash
cd server
node scripts/createAdmin.js admin@example.com motdepasse123
```

5. **Initialiser les salles par défaut** (recommandé)
```bash
cd server
node scripts/initSalles.js
```

6. **Démarrer l'application**
```bash
# Depuis la racine du projet
npm run dev
```

L'application sera accessible sur :
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Première utilisation

1. **Créer un compte utilisateur** via l'interface d'inscription
2. **Se connecter** avec vos identifiants
3. **Pour devenir admin**, modifiez manuellement dans MongoDB :
   ```javascript
   db.users.updateOne(
     { email: "votre@email.com" },
     { $set: { role: "admin" } }
   )
   ```

## Structure des données

### Films
- Titre, description, durée, genre
- Réalisateur, acteurs
- Image (URL), date de sortie, note, prix

### Séances
- Film associé
- Date et heure
- Salle, nombre de places
- Prix

### Salles
- Nom, type (classic, vip, premium, imax, 4dx)
- Capacité, description, équipements
- Statut actif/inactif

### Réservations
- Utilisateur, séance
- Nombre de places, prix total
- Statut (en_attente, confirmee, annulee)
- Paiement (en_attente, paye, rembourse)
- Les séances bloquées ne peuvent pas être réservées

## Notes

- Les images de films doivent être des URLs valides
- Les paiements sont traités via Stripe (Payment Intent + Elements)
- Les places disponibles sont automatiquement mises à jour lors des réservations
- Les séances peuvent être bloquées depuis le planning admin (ex: réservation complète, maintenance)
- Les types de salles permettent de différencier les expériences (Classic, VIP, Premium, IMAX, 4DX)


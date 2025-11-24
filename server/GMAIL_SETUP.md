# Configuration Gmail pour l'envoi d'emails

Ce guide vous explique étape par étape comment configurer Gmail pour envoyer des emails de confirmation de réservation.

## 📋 Prérequis

- Un compte Gmail
- La validation en 2 étapes activée sur votre compte Google

## 🔧 Étapes de configuration

### Étape 1 : Activer la validation en 2 étapes

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur **Sécurité** dans le menu de gauche
3. Sous "Connexion à Google", trouvez **Validation en deux étapes**
4. Cliquez sur **Commencer** et suivez les instructions pour activer la validation en 2 étapes

> ⚠️ **Important** : La validation en 2 étapes est obligatoire pour créer un mot de passe d'application.

### Étape 2 : Créer un mot de passe d'application

1. Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Ou : Google Account → Sécurité → Validation en deux étapes → Mots de passe des applications
2. Sélectionnez **Application** : Choisissez "Autre (nom personnalisé)"
3. Entrez un nom : Par exemple "Ciné Go - Serveur"
4. Cliquez sur **Générer**
5. **Copiez le mot de passe généré** (16 caractères sans espaces)
   - Exemple : `abcd efgh ijkl mnop` → utilisez `abcdefghijklmnop`

> 💡 **Note** : Ce mot de passe ne s'affichera qu'une seule fois. Notez-le bien !

### Étape 3 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `server/.env` :

```env
# Configuration Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM="Ciné Go" <votre-email@gmail.com>

# Optionnel : Email pour les notifications admin
ADMIN_EMAIL=admin@example.com
```

**Exemple complet :**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=cinema.moncinema@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM="Ciné Go" <cinema.moncinema@gmail.com>
ADMIN_EMAIL=admin@moncinema.com
```

> ⚠️ **Important** : 
> - Utilisez le **mot de passe d'application** (16 caractères), PAS votre mot de passe Gmail habituel
> - Vous pouvez supprimer les espaces dans le mot de passe d'application

### Étape 4 : Redémarrer le serveur

Après avoir modifié le fichier `.env`, redémarrez votre serveur :

```bash
# Si vous utilisez nodemon, il redémarre automatiquement
# Sinon, arrêtez et relancez le serveur
npm run dev
```

### Étape 5 : Tester

1. Créez une réservation via l'interface
2. Vérifiez que l'email est bien envoyé
3. Consultez la boîte de réception (et les spams si nécessaire)

## 🔍 Vérification

Si vous voyez dans les logs :
```
✅ Email de confirmation envoyé à: client@example.com
```

Au lieu de :
```
📧 Mode local détecté : utilisation d'Ethereal Email
```

Alors Gmail est correctement configuré ! 🎉

## ❌ Dépannage

### Erreur : "Invalid login: 535-5.7.8 Username and Password not accepted"

**Causes possibles :**
1. ❌ Vous utilisez votre mot de passe Gmail au lieu du mot de passe d'application
   - ✅ **Solution** : Créez un mot de passe d'application (Étape 2)

2. ❌ La validation en 2 étapes n'est pas activée
   - ✅ **Solution** : Activez la validation en 2 étapes (Étape 1)

3. ❌ Le mot de passe d'application contient des espaces
   - ✅ **Solution** : Supprimez les espaces ou utilisez le mot de passe tel quel (les deux fonctionnent)

4. ❌ Mauvaise adresse email dans `EMAIL_USER`
   - ✅ **Solution** : Vérifiez que l'email est correct et complet

### Erreur : "Less secure app access"

Cette erreur n'apparaît plus avec les mots de passe d'application. Si vous la voyez, c'est que vous utilisez encore l'ancien système. Utilisez un mot de passe d'application à la place.

### Les emails arrivent dans les spams

1. Vérifiez que `EMAIL_FROM` est bien configuré avec votre adresse Gmail
2. Ajoutez votre adresse à la liste des contacts
3. En production, utilisez un service professionnel (SendGrid, Mailgun) pour une meilleure délivrabilité

## 🚀 Pour la production

Pour la production, il est recommandé d'utiliser un service email professionnel plutôt que Gmail :

- **SendGrid** : Gratuit jusqu'à 100 emails/jour
- **Mailgun** : Gratuit jusqu'à 5000 emails/mois
- **Amazon SES** : Très économique

Ces services offrent une meilleure délivrabilité et des statistiques détaillées.

## 📝 Exemple de fichier .env complet

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/cinego
PORT=5000

# JWT
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=eur

# Email Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM="Ciné Go" <votre-email@gmail.com>
ADMIN_EMAIL=admin@example.com

# Environnement
NODE_ENV=production
```

## ✅ Checklist

- [ ] Validation en 2 étapes activée
- [ ] Mot de passe d'application créé
- [ ] Variables d'environnement configurées dans `.env`
- [ ] Serveur redémarré
- [ ] Test d'envoi d'email effectué
- [ ] Email reçu dans la boîte de réception

---

**Besoin d'aide ?** Consultez la documentation complète dans `EMAIL_SETUP.md`


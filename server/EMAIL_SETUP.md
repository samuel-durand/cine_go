# Configuration des notifications par email

Ce document explique comment configurer l'envoi d'emails de confirmation lors des réservations.

## Installation

Installer nodemailer :

```bash
cd server
npm install nodemailer
```

## Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` du serveur :

### Option 1 : Gmail (Recommandé pour débuter)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app-gmail
EMAIL_FROM="Ciné Go" <votre-email@gmail.com>
ADMIN_EMAIL=admin@example.com
```

**📖 Guide complet :** Consultez `GMAIL_SETUP.md` pour un guide détaillé étape par étape.

**Note importante pour Gmail :** Vous devez utiliser un **"Mot de passe d'application"** et non votre mot de passe habituel :

1. **Activez la validation en 2 étapes** sur votre compte Google
   - Allez sur [myaccount.google.com](https://myaccount.google.com) → Sécurité
   - Activez "Validation en deux étapes"

2. **Créez un mot de passe d'application**
   - Allez sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Sélectionnez "Autre (nom personnalisé)" et entrez "Ciné Go"
   - Cliquez sur "Générer"
   - **Copiez le mot de passe de 16 caractères** (sans espaces)

3. **Utilisez ce mot de passe dans `EMAIL_PASSWORD`**
   - Exemple : Si vous obtenez `abcd efgh ijkl mnop`, utilisez `abcdefghijklmnop` ou gardez les espaces

> ⚠️ **Important** : Le mot de passe d'application ne s'affiche qu'une seule fois. Notez-le bien !

### Option 2 : SMTP personnalisé

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=votre-email@example.com
EMAIL_PASSWORD=votre-mot-de-passe
EMAIL_FROM="Ciné Go" <votre-email@example.com>
ADMIN_EMAIL=admin@example.com
```

### Option 3 : Services tiers (SendGrid, Mailgun, etc.)

#### SendGrid
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=votre-api-key-sendgrid
EMAIL_FROM="Ciné Go" <votre-email@example.com>
ADMIN_EMAIL=admin@example.com
```

#### Mailgun
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=postmaster@votre-domaine.mailgun.org
EMAIL_PASSWORD=votre-mot-de-passe-mailgun
EMAIL_FROM="Ciné Go" <votre-email@example.com>
ADMIN_EMAIL=admin@example.com
```

### Mode développement (Ethereal Email) - Automatique en local

**Par défaut, si aucune configuration n'est fournie, le système utilisera automatiquement Ethereal Email** (service de test gratuit). Cela permet d'envoyer des emails même en local sans configuration !

Le système créera automatiquement un compte Ethereal au premier envoi d'email. Vous verrez dans les logs :
- Un message confirmant la création du compte
- Une URL de prévisualisation pour chaque email envoyé

**Optionnel :** Vous pouvez aussi fournir vos propres credentials Ethereal pour réutiliser le même compte :

```env
# Optionnel pour Ethereal (sinon créé automatiquement)
ETHEREAL_USER=test@ethereal.email
ETHEREAL_PASS=mot-de-passe-genere
```

**Note :** Les emails Ethereal sont des emails de test - ils ne sont pas réellement envoyés aux destinataires, mais vous pouvez voir leur contenu via l'URL de prévisualisation dans les logs du serveur.

## Variables disponibles

| Variable | Description | Requis | Défaut |
|----------|-------------|--------|--------|
| `EMAIL_SERVICE` | Service email (`gmail`, `smtp`) | Non | Mode développement |
| `EMAIL_USER` | Adresse email ou nom d'utilisateur SMTP | Oui (si EMAIL_SERVICE défini) | - |
| `EMAIL_PASSWORD` | Mot de passe ou clé API | Oui (si EMAIL_SERVICE défini) | - |
| `EMAIL_FROM` | Adresse email expéditeur | Non | `"Ciné Go" <EMAIL_USER>` |
| `ADMIN_EMAIL` | Email pour notifications admin | Non | - |
| `SMTP_HOST` | Serveur SMTP (si EMAIL_SERVICE=smtp) | Oui (si smtp) | - |
| `SMTP_PORT` | Port SMTP | Non | `587` |
| `SMTP_SECURE` | Utiliser TLS/SSL | Non | `false` |

## Fonctionnalités

### Email de confirmation client

Un email est automatiquement envoyé au client après chaque réservation confirmée. Il contient :
- Détails de la réservation (film, date, heure, salle)
- Liste des sièges réservés
- Montant payé
- Numéro de réservation
- Instructions importantes

### Notification admin (optionnel)

Si `ADMIN_EMAIL` est configuré, un email est également envoyé à l'administrateur pour chaque nouvelle réservation.

## Test

Pour tester l'envoi d'emails :

1. Configurez les variables d'environnement
2. Créez une réservation via l'interface
3. Vérifiez les logs du serveur pour les erreurs éventuelles
4. Vérifiez la boîte de réception du client

## Dépannage

### Les emails ne sont pas envoyés

1. Vérifiez que `nodemailer` est installé : `npm list nodemailer`
2. Vérifiez les variables d'environnement
3. Consultez les logs du serveur pour les erreurs
4. Testez avec Ethereal Email en mode développement

### Erreur d'authentification Gmail

- Utilisez un "Mot de passe d'application" et non votre mot de passe habituel
- Vérifiez que la validation en 2 étapes est activée

### Emails dans les spams

- Vérifiez que `EMAIL_FROM` est bien configuré
- Utilisez un service email professionnel (SendGrid, Mailgun) en production


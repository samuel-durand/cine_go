# Solution pour les erreurs CORS

## Problème

L'erreur CORS se produit lorsque le client (déployé sur `http://cine-go.soqe8286.odns.fr`) essaie d'accéder à l'API (déployée sur `https://cinego-production-12de.up.railway.app`).

## Solutions appliquées

### ✅ Solution côté Client

1. **Fichier `src/utils/axiosConfig.js`** : Configuration axios centralisée avec gestion améliorée des erreurs CORS
2. **Initialisation dans `src/index.js`** : La configuration axios est chargée au démarrage de l'application

### ✅ Solution côté Serveur

Le fichier `server/index.js` a été modifié pour autoriser les requêtes depuis :
- `http://cine-go.soqe8286.odns.fr`
- `https://cine-go.soqe8286.odns.fr`
- `http://localhost:3000` (développement)
- Le domaine défini dans `FRONTEND_URL`

## Variables d'environnement

Pour le serveur Railway, vous pouvez définir (optionnel) :

```
FRONTEND_URL=http://cine-go.soqe8286.odns.fr
```

Si cette variable n'est pas définie, le serveur autorisera quand même les requêtes depuis les domaines configurés dans le code.

## Déploiement

1. **Redéployez le serveur** sur Railway pour que les changements CORS prennent effet
2. **Redéployez le client** si nécessaire (les changements côté client sont déjà appliqués)

## Vérification

Après le déploiement, les requêtes depuis `http://cine-go.soqe8286.odns.fr` vers `https://cinego-production-12de.up.railway.app/api` devraient fonctionner sans erreur CORS.


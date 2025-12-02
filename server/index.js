const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Charger le .env - essaie d'abord dans server/, puis à la racine
const fs = require('fs');
const envPathServer = path.join(__dirname, '.env');
const envPathRoot = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPathServer)) {
  require('dotenv').config({ path: envPathServer });
} else if (fs.existsSync(envPathRoot)) {
  require('dotenv').config({ path: envPathRoot });
} else {
  // Par défaut, chercher à la racine (comportement standard de dotenv)
  require('dotenv').config();
}

const app = express();

// Middleware
// Configuration CORS pour autoriser les domaines définis dans les variables d'env
const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : []),
  process.env.FRONTEND_URL,
].filter(Boolean); // Retire les valeurs undefined/null

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Utiliser les variables d'environnement pour les origines autorisées
    // Si des origines sont définies dans le .env, les utiliser
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        // En développement, si l'origine n'est pas dans la liste mais qu'on a défini des origines,
        // on autorise quand même pour plus de flexibilité
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`⚠️  Origine non autorisée dans .env: ${origin} (autorisée en dev)`);
          return callback(null, true);
        }
        return callback(new Error('Non autorisé par CORS'));
      }
    }
    
    // Si aucune origine n'est définie dans le .env, autoriser toutes les origines en développement
    // En production, il faut définir FRONTEND_URL ou ALLOWED_ORIGINS
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Aucune origine définie dans .env, toutes les origines sont autorisées en développement');
      return callback(null, true);
    } else {
      console.error('❌ FRONTEND_URL ou ALLOWED_ORIGINS doit être défini en production');
      return callback(new Error('Configuration CORS manquante'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/films', require('./routes/films'));
app.use('/api/genres', require('./routes/genres'));
app.use('/api/cinemas', require('./routes/cinemas'));
app.use('/api/utils', require('./routes/utils'));
app.use('/api/salles', require('./routes/salles'));
app.use('/api/seances', require('./routes/seances'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/commentaires', require('./routes/commentaires'));

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  
  // Toutes les routes non-API servent l'index.html (pour React Router)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Vérification des variables d'environnement obligatoires
if (!process.env.PORT) {
  console.error('❌ Erreur: PORT doit être défini dans les variables d\'environnement');
  console.error('💡 Vérifiez que le fichier .env existe dans server/ ou à la racine du projet');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ Erreur: MONGODB_URI doit être défini dans les variables d\'environnement');
  console.error('💡 Vérifiez que le fichier .env existe dans server/ ou à la racine du projet');
  process.exit(1);
}

// Connexion MongoDB
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB:', err);
    process.exit(1);
  });


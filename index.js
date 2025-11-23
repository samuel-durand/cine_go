const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
// Configuration CORS pour autoriser les requêtes depuis différents domaines
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4173', // Port par défaut de Vite preview
  'http://cine-go.soqe8286.odns.fr',
  'https://cine-go.soqe8286.odns.fr',
  process.env.FRONTEND_URL,
].filter(Boolean); // Retire les valeurs undefined/null

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      // En production, autoriser aussi si FRONTEND_URL n'est pas défini (pour compatibilité)
      if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Non autorisé par CORS'));
      }
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
app.use('/api/cinemas', require('./routes/cinemas'));
app.use('/api/utils', require('./routes/utils'));
app.use('/api/salles', require('./routes/salles'));
app.use('/api/seances', require('./routes/seances'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/tickets', require('./routes/tickets'));

// Connexion MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinego';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB:', err);
  });


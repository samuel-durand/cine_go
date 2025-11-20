const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
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


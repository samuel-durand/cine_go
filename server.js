const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4173;

// Servir les fichiers statiques du build
app.use(express.static(path.join(__dirname, 'build')));

// Toutes les routes servent index.html (pour React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📁 Servant les fichiers depuis: ${path.join(__dirname, 'build')}`);
});


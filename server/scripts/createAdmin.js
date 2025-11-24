const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');

// Charger le .env depuis le dossier server/
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Erreur: MONGODB_URI n\'est pas défini dans le fichier .env');
  console.error('   Veuillez créer un fichier .env dans le dossier server/ avec:');
  console.error('   MONGODB_URI=mongodb://localhost:27017/cinego');
  process.exit(1);
}

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const adminEmail = process.argv[2] || 'admin@cinego.com';
    const adminPassword = process.argv[3] || 'admin123';

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('❌ Un utilisateur avec cet email existe déjà.');
      process.exit(1);
    }

    // Créer l'admin
    const admin = await User.create({
      nom: 'Admin',
      prenom: 'Administrateur',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log(`Email: ${admin.email}`);
    console.log(`Mot de passe: ${adminPassword}`);
    console.log('\n⚠️  N\'oubliez pas de changer le mot de passe après la première connexion !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();


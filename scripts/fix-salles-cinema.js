const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

// Charger les modèles
const Salle = require('../models/Salle');
const Cinema = require('../models/Cinema');

// Connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinego';

async function fixSallesCinema() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les salles
    const salles = await Salle.find().lean();
    console.log(`📊 Total de salles trouvées: ${salles.length}`);

    // Récupérer tous les cinémas actifs
    const cinemas = await Cinema.find({ actif: true }).lean();
    console.log(`🎬 Total de cinémas actifs: ${cinemas.length}\n`);

    if (cinemas.length === 0) {
      console.error('❌ ERREUR: Aucun cinéma actif trouvé!');
      console.log('💡 Créez d\'abord au moins un cinéma via l\'interface admin avant d\'exécuter ce script.\n');
      process.exit(1);
    }

    const sallesSansCinema = [];
    const sallesAvecCinemaInvalide = [];
    const sallesCorrigees = [];

    // Vérifier chaque salle
    for (const salle of salles) {
      let besoinCorrection = false;
      let raison = '';

      // Vérifier si la salle a un cinéma valide
      if (!salle.cinema) {
        besoinCorrection = true;
        raison = 'SANS_CINEMA';
        sallesSansCinema.push({
          id: salle._id,
          nom: salle.nom,
          cinema: null
        });
      } else if (typeof salle.cinema === 'string') {
        // Vérifier si le cinéma existe
        const cinemaExiste = cinemas.find(c => c._id.toString() === salle.cinema.toString());
        if (!cinemaExiste) {
          besoinCorrection = true;
          raison = 'CINEMA_INVALIDE';
          sallesAvecCinemaInvalide.push({
            id: salle._id,
            nom: salle.nom,
            cinemaId: salle.cinema
          });
        }
      } else if (salle.cinema._id) {
        // Vérifier si le cinéma existe toujours
        const cinemaExiste = cinemas.find(c => c._id.toString() === salle.cinema._id.toString());
        if (!cinemaExiste) {
          besoinCorrection = true;
          raison = 'CINEMA_SUPPRIME';
          sallesAvecCinemaInvalide.push({
            id: salle._id,
            nom: salle.nom,
            cinemaId: salle.cinema._id
          });
        }
      }

      if (besoinCorrection) {
        // Utiliser le premier cinéma disponible
        const cinemaAssign = cinemas[0];
        
        await Salle.findByIdAndUpdate(salle._id, {
          cinema: cinemaAssign._id
        }, { runValidators: true });

        sallesCorrigees.push({
          id: salle._id,
          nom: salle.nom,
          raison: raison,
          cinemaAssigne: cinemaAssign.nom,
          cinemaId: cinemaAssign._id
        });

        console.log(`✅ Corrigé: ${salle.nom} → ${cinemaAssign.nom} (${raison})`);
      }
    }

    // Afficher le résumé
    console.log('\n' + '='.repeat(60));
    console.log('📋 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`Total de salles: ${salles.length}`);
    console.log(`Salles sans cinéma: ${sallesSansCinema.length}`);
    console.log(`Salles avec cinéma invalide: ${sallesAvecCinemaInvalide.length}`);
    console.log(`Salles corrigées: ${sallesCorrigees.length}`);
    console.log('='.repeat(60));

    if (sallesCorrigees.length > 0) {
      console.log('\n📝 Détails des corrections:');
      sallesCorrigees.forEach(correction => {
        console.log(`  - ${correction.nom} (${correction.raison}) → ${correction.cinemaAssigne}`);
      });
      console.log(`\n✅ ${sallesCorrigees.length} salle(s) corrigée(s) avec succès!`);
    } else {
      console.log('\n✅ Toutes les salles ont déjà un cinéma valide!');
    }

    // Si plusieurs cinémas, proposer de redistribuer
    if (cinemas.length > 1 && sallesCorrigees.length > 0) {
      console.log('\n💡 Astuce: Vous pouvez maintenant redistribuer les salles entre les cinémas via l\'interface admin.');
    }

    await mongoose.connection.close();
    console.log('\n🔌 Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Exécuter le script
fixSallesCinema();


const mongoose = require('mongoose');
const Genre = require('../models/Genre');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const genresPopulaires = [
  {
    nom: 'action',
    description: 'Films avec beaucoup d\'action, de combats et de poursuites'
  },
  {
    nom: 'aventure',
    description: 'Films d\'aventure et d\'exploration'
  },
  {
    nom: 'animation',
    description: 'Films d\'animation et dessins animés'
  },
  {
    nom: 'comedie',
    description: 'Films comiques et humoristiques'
  },
  {
    nom: 'drame',
    description: 'Films dramatiques et émotionnels'
  },
  {
    nom: 'fantastique',
    description: 'Films fantastiques avec des éléments surnaturels'
  },
  {
    nom: 'horreur',
    description: 'Films d\'horreur et de suspense'
  },
  {
    nom: 'romance',
    description: 'Films romantiques et d\'amour'
  },
  {
    nom: 'science-fiction',
    description: 'Films de science-fiction et futuristes'
  },
  {
    nom: 'thriller',
    description: 'Films à suspense et thriller'
  },
  {
    nom: 'western',
    description: 'Westerns et films de cowboys'
  },
  {
    nom: 'guerre',
    description: 'Films de guerre et militaires'
  },
  {
    nom: 'biographique',
    description: 'Films biographiques et historiques'
  },
  {
    nom: 'crime',
    description: 'Films de crime et policiers'
  },
  {
    nom: 'mystere',
    description: 'Films mystérieux et énigmatiques'
  },
  {
    nom: 'familial',
    description: 'Films familiaux pour tous les âges'
  },
  {
    nom: 'musical',
    description: 'Comédies musicales et films musicaux'
  },
  {
    nom: 'sport',
    description: 'Films sur le sport et les athlètes'
  },
  {
    nom: 'documentaire',
    description: 'Documentaires et films documentaires'
  }
];

async function initGenres() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    let created = 0;
    let skipped = 0;

    for (const genreData of genresPopulaires) {
      try {
        // Vérifier si le genre existe déjà
        const existingGenre = await Genre.findOne({ nom: genreData.nom });
        
        if (existingGenre) {
          console.log(`⏭️  Genre "${genreData.nom}" existe déjà, ignoré`);
          skipped++;
        } else {
          // Créer le genre
          await Genre.create({
            nom: genreData.nom,
            description: genreData.description,
            actif: true
          });
          console.log(`✅ Genre créé: ${genreData.nom}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création du genre "${genreData.nom}":`, error.message);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`   - Genres créés: ${created}`);
    console.log(`   - Genres déjà existants: ${skipped}`);
    console.log(`   - Total: ${genresPopulaires.length}`);
    console.log('\n✅ Initialisation terminée avec succès !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

initGenres();


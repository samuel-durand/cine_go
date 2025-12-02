const mongoose = require('mongoose');
const Film = require('../models/Film');
const Genre = require('../models/Genre');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateGenres() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les films
    const films = await Film.find({});
    console.log(`📽️  ${films.length} film(s) trouvé(s)`);

    const genreMap = new Map();
    let created = 0;
    let updated = 0;

    for (const film of films) {
      // Si le genre est déjà un ObjectId, passer au suivant
      if (mongoose.Types.ObjectId.isValid(film.genre) && film.genre.toString().length === 24) {
        console.log(`⏭️  Film "${film.titre}" a déjà un genre ObjectId, ignoré`);
        continue;
      }

      const genreName = String(film.genre).toLowerCase().trim();
      
      if (!genreName) {
        console.log(`⚠️  Film "${film.titre}" n'a pas de genre, ignoré`);
        continue;
      }

      // Vérifier si le genre existe déjà dans la map ou en BDD
      let genreId;
      if (genreMap.has(genreName)) {
        genreId = genreMap.get(genreName);
      } else {
        // Chercher le genre en BDD
        let genre = await Genre.findOne({ nom: genreName });
        
        if (!genre) {
          // Créer le genre
          genre = await Genre.create({
            nom: genreName,
            description: '',
            actif: true
          });
          created++;
          console.log(`✅ Genre créé: ${genreName}`);
        }
        
        genreId = genre._id;
        genreMap.set(genreName, genreId);
      }

      // Mettre à jour le film
      film.genre = genreId;
      await film.save();
      updated++;
      console.log(`✅ Film "${film.titre}" mis à jour avec le genre: ${genreName}`);
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   - Genres créés: ${created}`);
    console.log(`   - Films mis à jour: ${updated}`);
    console.log('✅ Migration terminée avec succès !');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateGenres();


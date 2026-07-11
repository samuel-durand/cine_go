/**
 * Génère des séances en liant les films et les salles existants.
 *
 * Pour chaque salle et chaque jour à venir, chaque créneau horaire reçoit
 * un film choisi aléatoirement parmi les films actifs. Les séances déjà
 * existantes (même salle, date et heure) sont ignorées : le script peut
 * être relancé sans créer de doublons.
 *
 * Usage :
 *   node scripts/initSeances.js              # 7 jours de séances
 *   node scripts/initSeances.js --days 14    # 14 jours
 */

const mongoose = require('mongoose');
const path = require('path');
const Film = require('../models/Film');
const Salle = require('../models/Salle');
const Seance = require('../models/Seance');
const { countPlanSeats } = require('../utils/seatHelpers');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Erreur: MONGODB_URI n\'est pas défini dans le fichier .env');
  process.exit(1);
}

const daysArgIndex = process.argv.indexOf('--days');
const DAYS = daysArgIndex !== -1 ? parseInt(process.argv[daysArgIndex + 1], 10) || 7 : 7;

const CRENEAUX = ['11:00', '14:00', '17:00', '20:00', '22:30'];

const clonePlan = (plan = { rows: [] }) => JSON.parse(JSON.stringify(plan || { rows: [] }));

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

async function initSeances() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const films = await Film.find({ actif: true });
    const salles = await Salle.find({ actif: true });

    if (!films.length) {
      console.error('❌ Aucun film actif en base. Importez des films d\'abord (ex: import_pathe.py).');
      process.exit(1);
    }
    if (!salles.length) {
      console.error('❌ Aucune salle active en base. Lancez d\'abord: node scripts/initSalles.js');
      process.exit(1);
    }

    console.log(`ℹ️  ${films.length} films, ${salles.length} salles, ${DAYS} jours, ${CRENEAUX.length} créneaux/jour\n`);

    let created = 0;
    let skipped = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 0; d < DAYS; d += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);

      for (const salle of salles) {
        for (const heure of CRENEAUX) {
          const existing = await Seance.findOne({ salle: salle._id, date, heure });
          if (existing) {
            skipped += 1;
            continue;
          }

          const film = pickRandom(films);
          const plan = clonePlan(salle.plan);
          const totalSeats = countPlanSeats(plan) || salle.capacite;

          await Seance.create({
            film: film._id,
            date,
            heure,
            salle: salle._id,
            plan,
            placesTotal: totalSeats,
            placesDisponibles: totalSeats,
            prix: film.prix,
            actif: true
          });
          created += 1;
        }
      }
      console.log(`✅ ${date.toISOString().slice(0, 10)} : séances générées`);
    }

    console.log(`\n✅ Terminé: ${created} séances créées, ${skipped} déjà existantes (ignorées).`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initSeances();

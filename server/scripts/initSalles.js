const mongoose = require('mongoose');
const path = require('path');
const Salle = require('../models/Salle');

// Charger le .env depuis le dossier server/
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Erreur: MONGODB_URI n\'est pas défini dans le fichier .env');
  process.exit(1);
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const createPlan = (rowCount, seatsPerRow, options = {}) => {
  const rows = [];
  for (let i = 0; i < rowCount; i += 1) {
    const rowName = alphabet[i] || `R${i + 1}`;
    const seats = [];
    for (let j = 0; j < seatsPerRow; j += 1) {
      const seatNumber = j + 1;
      const seatIndex = i * seatsPerRow + j;
      if (options.limit && seatIndex >= options.limit) {
        break;
      }
      const seatId = `${rowName}${seatNumber}`;
      seats.push({
        seatId,
        label: seatId,
        row: rowName,
        number: seatNumber,
        type: options.type || 'standard',
        accessible: options.accessibleRows?.includes(rowName) || false,
        priceModifier: options.priceModifier || 0,
      });
    }
    if (seats.length) {
      rows.push({ name: rowName, seats });
    }
  }
  return { rows };
};

const sallesParDefaut = [
  {
    nom: 'Salle 1',
    type: 'classic',
    capacite: 150,
    description: 'Salle classique avec son stéréo',
    equipements: ['Son stéréo', 'Écran standard'],
    actif: true,
    plan: createPlan(10, 15, { type: 'standard', limit: 150 })
  },
  {
    nom: 'Salle 2',
    type: 'classic',
    capacite: 120,
    description: 'Salle classique',
    equipements: ['Son stéréo', 'Écran standard'],
    actif: true,
    plan: createPlan(8, 15, { type: 'standard', limit: 120 })
  },
  {
    nom: 'Salle VIP',
    type: 'vip',
    capacite: 50,
    description: 'Salle VIP avec sièges inclinables et service premium',
    equipements: ['Sièges inclinables', 'Service premium', 'Son Dolby Atmos'],
    actif: true,
    plan: createPlan(5, 12, { type: 'vip', limit: 50, priceModifier: 5, accessibleRows: ['A'] })
  },
  {
    nom: 'Salle Premium',
    type: 'premium',
    capacite: 80,
    description: 'Salle premium avec confort amélioré',
    equipements: ['Sièges larges', 'Son Dolby Atmos', 'Écran 4K'],
    actif: true,
    plan: createPlan(6, 14, { type: 'premium', limit: 80, priceModifier: 2 })
  },
  {
    nom: 'IMAX',
    type: 'imax',
    capacite: 200,
    description: 'Salle IMAX avec écran géant et son immersif',
    equipements: ['Écran géant IMAX', 'Son IMAX', 'Projection 4K'],
    actif: true,
    plan: createPlan(10, 20, { type: 'premium', limit: 200, priceModifier: 3 })
  }
];

async function initSalles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    let created = 0;
    let skipped = 0;

    for (const salleData of sallesParDefaut) {
      const existingSalle = await Salle.findOne({ nom: salleData.nom });
      if (existingSalle) {
        console.log(`⏭️  Salle "${salleData.nom}" existe déjà, ignorée.`);
        skipped++;
      } else {
        await Salle.create(salleData);
        console.log(`✅ Salle "${salleData.nom}" créée (${salleData.type}, ${salleData.capacite} places)`);
        created++;
      }
    }

    console.log(`\n✅ Initialisation terminée: ${created} salles créées, ${skipped} ignorées.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initSalles();


const express = require('express');
const Seance = require('../models/Seance');
const Film = require('../models/Film');
const Salle = require('../models/Salle');
const { auth, admin } = require('../middleware/auth');
const { countPlanSeats } = require('../utils/seatHelpers');
const router = express.Router();

const clonePlan = (plan = { rows: [] }) => JSON.parse(JSON.stringify(plan || { rows: [] }));

const generatePlanFromSalle = (salle) => {
  if (salle?.plan?.rows?.length) {
    return clonePlan(salle.plan);
  }

  const capacity = salle?.capacite || 100;
  const seatsPerRow = Math.max(4, Math.min(20, Math.round(Math.sqrt(capacity))));
  const rowCount = Math.ceil(capacity / seatsPerRow);
  const rows = [];

  for (let i = 0; i < rowCount; i += 1) {
    const rowName = String.fromCharCode(65 + i);
    const seats = [];
    for (let j = 0; j < seatsPerRow; j += 1) {
      const seatNumber = j + 1;
      const seatIndex = i * seatsPerRow + j;
      if (seatIndex >= capacity) break;
      const seatId = `${rowName}${seatNumber}`;
      seats.push({
        seatId,
        label: seatId,
        row: rowName,
        number: seatNumber,
        type: salle?.type === 'vip' ? 'vip' : salle?.type === 'premium' ? 'premium' : 'standard',
        accessible: false,
        priceModifier: salle?.type === 'vip' ? 5 : salle?.type === 'premium' ? 2 : 0,
      });
    }
    rows.push({ name: rowName, seats });
  }

  return { rows };
};

// Obtenir toutes les séances (public)
router.get('/', async (req, res) => {
  try {
    const { filmId, date } = req.query;
    let query = { actif: true, bloque: { $ne: true } };
    
    if (filmId) query.film = filmId;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const seances = await Seance.find(query)
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite')
      .sort({ date: 1, heure: 1 });
    
    res.json(seances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir toutes les séances (admin)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const seances = await Seance.find()
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite')
      .sort({ date: -1, heure: 1 });
    res.json(seances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir une séance par ID
router.get('/:id', async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id)
      .populate('film')
      .populate('salle', 'nom type capacite');
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json(seance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une séance (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { film, date, heure, salle, placesTotal, prix } = req.body;
    
    // Vérifier que le film existe
    const filmExists = await Film.findById(film);
    if (!filmExists) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }

    // Vérifier que la salle existe
    const salleExists = await Salle.findById(salle);
    if (!salleExists) {
      return res.status(404).json({ message: 'Salle non trouvée.' });
    }

    const planSnapshot = generatePlanFromSalle(salleExists);
    const totalSeatsFromPlan = countPlanSeats(planSnapshot);
    const totalSeats = totalSeatsFromPlan || placesTotal || salleExists.capacite;

    const seance = await Seance.create({
      film,
      date,
      heure,
      salle,
      plan: planSnapshot,
      placesTotal: totalSeats,
      placesDisponibles: totalSeats,
      prix: prix || filmExists.prix
    });

    const seancePopulated = await Seance.findById(seance._id)
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite');

    res.status(201).json(seancePopulated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une séance (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite');
    
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json(seance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bloquer/Débloquer une séance (admin)
router.put('/:id/block', auth, admin, async (req, res) => {
  try {
    const { bloque, raisonBlocage } = req.body;
    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      { bloque, raisonBlocage: raisonBlocage || '' },
      { new: true, runValidators: true }
    )
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite');
    
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json(seance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les séances par salle et date (admin - pour planning)
router.get('/planning/:salleId', auth, admin, async (req, res) => {
  try {
    const { salleId } = req.params;
    const { date } = req.query;
    
    let query = { salle: salleId };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const seances = await Seance.find(query)
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite')
      .sort({ date: 1, heure: 1 });
    
    res.json(seances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une séance (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const seance = await Seance.findByIdAndDelete(req.params.id);
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json({ message: 'Séance supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


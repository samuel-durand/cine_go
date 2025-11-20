const express = require('express');
const Salle = require('../models/Salle');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Obtenir toutes les salles (public)
router.get('/', async (req, res) => {
  try {
    const salles = await Salle.find({ actif: true }).sort({ nom: 1 });
    res.json(salles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir toutes les salles (admin - inclut les inactives)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const salles = await Salle.find().sort({ nom: 1 });
    res.json(salles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir une salle par ID
router.get('/:id', async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);
    if (!salle) {
      return res.status(404).json({ message: 'Salle non trouvée.' });
    }
    res.json(salle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une salle (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const salle = await Salle.create(req.body);
    res.status(201).json(salle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une salle (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const salle = await Salle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!salle) {
      return res.status(404).json({ message: 'Salle non trouvée.' });
    }
    res.json(salle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une salle (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const salle = await Salle.findByIdAndDelete(req.params.id);
    if (!salle) {
      return res.status(404).json({ message: 'Salle non trouvée.' });
    }
    res.json({ message: 'Salle supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


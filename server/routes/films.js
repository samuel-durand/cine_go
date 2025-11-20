const express = require('express');
const Film = require('../models/Film');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Obtenir tous les films (public)
router.get('/', async (req, res) => {
  try {
    const films = await Film.find({ actif: true }).sort({ dateSortie: -1 });
    res.json(films);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir tous les films (admin - inclut les inactifs)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const films = await Film.find().sort({ dateSortie: -1 });
    res.json(films);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir un film par ID
router.get('/:id', async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    res.json(film);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un film (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const film = await Film.create(req.body);
    res.status(201).json(film);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour un film (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const film = await Film.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    res.json(film);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer un film (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const film = await Film.findByIdAndDelete(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    res.json({ message: 'Film supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


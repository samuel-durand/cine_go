const express = require('express');
const Cinema = require('../models/Cinema');
const Salle = require('../models/Salle');
const { auth, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Obtenir tous les cinémas (public)
router.get('/', async (req, res) => {
  try {
    const cinemas = await Cinema.find({ actif: true }).sort({ ville: 1, nom: 1 });
    res.json(cinemas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir tous les cinémas (admin - inclut les inactifs)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const cinemas = await Cinema.find().sort({ ville: 1, nom: 1 });
    res.json(cinemas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir un cinéma par ID avec ses salles
router.get('/:id', async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    if (!cinema) {
      return res.status(404).json({ message: 'Cinéma non trouvé.' });
    }
    
    // Optionnel : inclure les salles du cinéma
    const salles = await Salle.find({ cinema: cinema._id, actif: true });
    res.json({ ...cinema.toObject(), salles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les salles d'un cinéma
router.get('/:id/salles', async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id);
    if (!cinema) {
      return res.status(404).json({ message: 'Cinéma non trouvé.' });
    }
    
    const salles = await Salle.find({ cinema: cinema._id, actif: true });
    res.json(salles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un cinéma (admin)
router.post('/', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const cinemaData = { ...req.body };
    
    // Si une image est uploadée, utiliser son URL
    if (req.file) {
      cinemaData.image = `/uploads/public/${req.file.filename}`;
    }
    
    // Convertir actif en boolean
    if (cinemaData.actif !== undefined) {
      cinemaData.actif = cinemaData.actif === 'true' || cinemaData.actif === true;
    }
    
    const cinema = await Cinema.create(cinemaData);
    res.status(201).json(cinema);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour un cinéma (admin)
router.put('/:id', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const cinemaData = { ...req.body };
    
    // Si une nouvelle image est uploadée, remplacer l'ancienne
    if (req.file) {
      cinemaData.image = `/uploads/public/${req.file.filename}`;
      
      // Optionnel : supprimer l'ancienne image si elle existe
      const oldCinema = await Cinema.findById(req.params.id);
      if (oldCinema && oldCinema.image && oldCinema.image.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const oldImagePath = path.join(__dirname, '..', oldCinema.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    // Convertir actif en boolean
    if (cinemaData.actif !== undefined) {
      cinemaData.actif = cinemaData.actif === 'true' || cinemaData.actif === true;
    }
    
    const cinema = await Cinema.findByIdAndUpdate(
      req.params.id,
      cinemaData,
      { new: true, runValidators: true }
    );
    if (!cinema) {
      return res.status(404).json({ message: 'Cinéma non trouvé.' });
    }
    res.json(cinema);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer un cinéma (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    // Vérifier si le cinéma a des salles
    const salles = await Salle.find({ cinema: req.params.id });
    if (salles.length > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer ce cinéma car il contient des salles. Supprimez d\'abord les salles.' 
      });
    }
    
    const cinema = await Cinema.findByIdAndDelete(req.params.id);
    if (!cinema) {
      return res.status(404).json({ message: 'Cinéma non trouvé.' });
    }
    res.json({ message: 'Cinéma supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


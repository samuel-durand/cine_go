const express = require('express');
const Genre = require('../models/Genre');
const Film = require('../models/Film');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Obtenir tous les genres (public)
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.find({ actif: true }).sort({ nom: 1 });
    res.json(genres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir tous les genres (admin - inclut les inactifs)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const genres = await Genre.find().sort({ nom: 1 });
    res.json(genres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir un genre par ID
router.get('/:id', async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) {
      return res.status(404).json({ message: 'Genre non trouvé.' });
    }
    res.json(genre);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un genre (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { nom, description } = req.body;
    
    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: 'Le nom du genre est requis.' });
    }

    // Vérifier si le genre existe déjà
    const existingGenre = await Genre.findOne({ 
      nom: nom.trim().toLowerCase() 
    });
    
    if (existingGenre) {
      return res.status(400).json({ message: 'Ce genre existe déjà.' });
    }

    const genre = await Genre.create({
      nom: nom.trim().toLowerCase(),
      description: description?.trim() || '',
      actif: true
    });

    res.status(201).json(genre);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ce genre existe déjà.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour un genre (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { nom, description, actif } = req.body;
    
    const updateData = {};
    if (nom !== undefined) {
      updateData.nom = nom.trim().toLowerCase();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    if (actif !== undefined) {
      updateData.actif = actif === 'true' || actif === true;
    }

    // Vérifier si le nouveau nom existe déjà (sauf pour ce genre)
    if (updateData.nom) {
      const existingGenre = await Genre.findOne({ 
        nom: updateData.nom,
        _id: { $ne: req.params.id }
      });
      
      if (existingGenre) {
        return res.status(400).json({ message: 'Ce nom de genre existe déjà.' });
      }
    }

    const genre = await Genre.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!genre) {
      return res.status(404).json({ message: 'Genre non trouvé.' });
    }

    res.json(genre);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ce nom de genre existe déjà.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Supprimer un genre (admin) - seulement si aucun film ne l'utilise
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    // Vérifier si des films utilisent ce genre
    const filmsWithGenre = await Film.countDocuments({ genre: req.params.id });
    
    if (filmsWithGenre > 0) {
      return res.status(400).json({ 
        message: `Impossible de supprimer ce genre car ${filmsWithGenre} film(s) l'utilise(nt). Désactivez-le plutôt.` 
      });
    }

    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) {
      return res.status(404).json({ message: 'Genre non trouvé.' });
    }

    res.json({ message: 'Genre supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


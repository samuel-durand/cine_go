const express = require('express');
const Film = require('../models/Film');
const Seance = require('../models/Seance');
const Salle = require('../models/Salle');
const Cinema = require('../models/Cinema');
const { auth, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
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

// Obtenir les cinémas qui projettent un film (DOIT être avant /:id)
router.get('/:id/cinemas', async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    
    // Récupérer les séances actives de ce film
    const seances = await Seance.find({ 
      film: film._id, 
      actif: true, 
      bloque: { $ne: true } 
    })
      .populate({
        path: 'salle',
        select: 'cinema',
        populate: {
          path: 'cinema',
          model: Cinema,
          select: 'nom ville adresse codePostal telephone email'
        }
      })
      .lean();
    
    // Extraire les cinémas uniques
    const cinemasMap = new Map();
    seances.forEach(seance => {
      if (seance.salle?.cinema) {
        const cinemaId = seance.salle.cinema._id.toString();
        if (!cinemasMap.has(cinemaId)) {
          cinemasMap.set(cinemaId, seance.salle.cinema);
        }
      }
    });
    
    const cinemas = Array.from(cinemasMap.values());
    res.json(cinemas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir un film par ID (DOIT être après /:id/cinemas)
router.get('/:id', async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    
    // Récupérer les cinémas où ce film est projeté
    const seances = await Seance.find({ 
      film: film._id, 
      actif: true, 
      bloque: { $ne: true } 
    })
      .populate({
        path: 'salle',
        select: 'cinema',
        populate: {
          path: 'cinema',
          model: Cinema,
          select: 'nom ville adresse codePostal telephone'
        }
      })
      .lean();
    
    // Extraire les cinémas uniques
    const cinemasMap = new Map();
    seances.forEach(seance => {
      if (seance.salle?.cinema) {
        const cinemaId = seance.salle.cinema._id.toString();
        if (!cinemasMap.has(cinemaId)) {
          cinemasMap.set(cinemaId, seance.salle.cinema);
        }
      }
    });
    
    const cinemas = Array.from(cinemasMap.values());
    
    // Ajouter les cinémas au film
    const filmObj = film.toObject();
    filmObj.cinemas = cinemas;
    
    res.json(filmObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les cinémas qui projettent un film
router.get('/:id/cinemas', async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    
    // Récupérer les séances actives de ce film
    const seances = await Seance.find({ 
      film: film._id, 
      actif: true, 
      bloque: { $ne: true } 
    })
      .populate({
        path: 'salle',
        select: 'cinema',
        populate: {
          path: 'cinema',
          model: Cinema,
          select: 'nom ville adresse codePostal telephone email'
        }
      })
      .lean();
    
    // Extraire les cinémas uniques
    const cinemasMap = new Map();
    seances.forEach(seance => {
      if (seance.salle?.cinema) {
        const cinemaId = seance.salle.cinema._id.toString();
        if (!cinemasMap.has(cinemaId)) {
          cinemasMap.set(cinemaId, seance.salle.cinema);
        }
      }
    });
    
    const cinemas = Array.from(cinemasMap.values());
    res.json(cinemas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour upload d'image (admin)
router.post('/upload-image', auth, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }
    // Retourner l'URL relative de l'image
    const imageUrl = `/uploads/public/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer un film (admin)
router.post('/', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const filmData = { ...req.body };
    
    // Si une image est uploadée, utiliser son URL
    if (req.file) {
      filmData.image = `/uploads/public/${req.file.filename}`;
    }
    
    // Parser les acteurs si c'est une chaîne
    if (typeof filmData.acteurs === 'string') {
      filmData.acteurs = filmData.acteurs.split(',').map(a => a.trim()).filter(a => a);
    }
    
    // Convertir les types appropriés
    if (filmData.duree) filmData.duree = parseInt(filmData.duree);
    if (filmData.prix) filmData.prix = parseFloat(filmData.prix);
    if (filmData.note) filmData.note = parseFloat(filmData.note);
    if (filmData.actif !== undefined) filmData.actif = filmData.actif === 'true' || filmData.actif === true;
    
    const film = await Film.create(filmData);
    res.status(201).json(film);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour un film (admin)
router.put('/:id', auth, admin, upload.single('image'), async (req, res) => {
  try {
    const filmData = { ...req.body };
    
    // Si une nouvelle image est uploadée, remplacer l'ancienne
    if (req.file) {
      filmData.image = `/uploads/public/${req.file.filename}`;
      
      // Optionnel : supprimer l'ancienne image si elle existe
      const oldFilm = await Film.findById(req.params.id);
      if (oldFilm && oldFilm.image && oldFilm.image.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const oldImagePath = path.join(__dirname, '..', oldFilm.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    // Parser les acteurs si c'est une chaîne
    if (typeof filmData.acteurs === 'string') {
      filmData.acteurs = filmData.acteurs.split(',').map(a => a.trim()).filter(a => a);
    }
    
    // Convertir les types appropriés
    if (filmData.duree) filmData.duree = parseInt(filmData.duree);
    if (filmData.prix) filmData.prix = parseFloat(filmData.prix);
    if (filmData.note) filmData.note = parseFloat(filmData.note);
    if (filmData.actif !== undefined) filmData.actif = filmData.actif === 'true' || filmData.actif === true;
    
    const film = await Film.findByIdAndUpdate(
      req.params.id,
      filmData,
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

// Ajouter ou mettre à jour une note utilisateur pour un film
router.post('/:id/rating', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 0 || rating > 10) {
      return res.status(400).json({ message: 'La note doit être entre 0 et 10.' });
    }

    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }

    // Vérifier si l'utilisateur a déjà noté ce film
    const existingRatingIndex = film.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (existingRatingIndex >= 0) {
      // Mettre à jour la note existante
      film.ratings[existingRatingIndex].rating = rating;
      film.ratings[existingRatingIndex].createdAt = Date.now();
    } else {
      // Ajouter une nouvelle note
      film.ratings.push({
        user: req.user.id,
        rating: rating
      });
    }

    // Recalculer la note moyenne
    film.calculateAverageRating();
    await film.save();

    res.json({
      message: existingRatingIndex >= 0 ? 'Note mise à jour avec succès.' : 'Note ajoutée avec succès.',
      averageRating: film.averageRating,
      userRating: rating
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir la note de l'utilisateur pour un film
router.get('/:id/rating', auth, async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }

    const userRating = film.ratings.find(
      r => r.user.toString() === req.user.id
    );

    res.json({
      userRating: userRating ? userRating.rating : null,
      averageRating: film.averageRating,
      totalRatings: film.ratings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


const express = require('express');
const Commentaire = require('../models/Commentaire');
const Film = require('../models/Film');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Obtenir tous les commentaires d'un film
router.get('/film/:filmId', async (req, res) => {
  try {
    const commentaires = await Commentaire.find({ film: req.params.filmId })
      .populate('user', 'nom prenom email')
      .populate('reponse.reponduPar', 'nom prenom email')
      .sort({ createdAt: -1 });
    
    res.json(commentaires);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir un commentaire spécifique
router.get('/:id', async (req, res) => {
  try {
    const commentaire = await Commentaire.findById(req.params.id)
      .populate('user', 'nom prenom email')
      .populate('reponse.reponduPar', 'nom prenom email')
      .populate('film', 'titre');
    
    if (!commentaire) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }
    
    res.json(commentaire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer ou mettre à jour un commentaire (utilisateur authentifié)
router.post('/film/:filmId', auth, async (req, res) => {
  try {
    const { commentaire, rating } = req.body;
    
    if (!commentaire || !commentaire.trim()) {
      return res.status(400).json({ message: 'Le commentaire est requis.' });
    }
    
    if (commentaire.length > 1000) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas dépasser 1000 caractères.' });
    }
    
    if (!rating || rating < 0 || rating > 10) {
      return res.status(400).json({ message: 'La note doit être entre 0 et 10.' });
    }
    
    // Vérifier que le film existe
    const film = await Film.findById(req.params.filmId);
    if (!film) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }
    
    // Vérifier si l'utilisateur a déjà commenté ce film
    const existingCommentaire = await Commentaire.findOne({
      film: req.params.filmId,
      user: req.user.id
    });
    
    let commentaireObj;
    if (existingCommentaire) {
      // Mettre à jour le commentaire existant
      existingCommentaire.commentaire = commentaire.trim();
      existingCommentaire.rating = rating;
      existingCommentaire.updatedAt = Date.now();
      await existingCommentaire.save();
      commentaireObj = existingCommentaire;
    } else {
      // Créer un nouveau commentaire
      commentaireObj = await Commentaire.create({
        film: req.params.filmId,
        user: req.user.id,
        commentaire: commentaire.trim(),
        rating: rating
      });
    }
    
    // Peupler les données utilisateur pour la réponse
    await commentaireObj.populate('user', 'nom prenom email');
    if (commentaireObj.reponse && commentaireObj.reponse.reponduPar) {
      await commentaireObj.populate('reponse.reponduPar', 'nom prenom email');
    }
    
    res.status(existingCommentaire ? 200 : 201).json({
      message: existingCommentaire ? 'Commentaire mis à jour avec succès.' : 'Commentaire ajouté avec succès.',
      commentaire: commentaireObj
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Vous avez déjà commenté ce film.' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour son propre commentaire
router.put('/:id', auth, async (req, res) => {
  try {
    const { commentaire, rating } = req.body;
    
    const commentaireObj = await Commentaire.findById(req.params.id);
    if (!commentaireObj) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du commentaire ou admin
    if (commentaireObj.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce commentaire.' });
    }
    
    if (commentaire !== undefined) {
      if (!commentaire.trim()) {
        return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
      }
      if (commentaire.length > 1000) {
        return res.status(400).json({ message: 'Le commentaire ne peut pas dépasser 1000 caractères.' });
      }
      commentaireObj.commentaire = commentaire.trim();
    }
    
    if (rating !== undefined) {
      if (rating < 0 || rating > 10) {
        return res.status(400).json({ message: 'La note doit être entre 0 et 10.' });
      }
      commentaireObj.rating = rating;
    }
    
    commentaireObj.updatedAt = Date.now();
    await commentaireObj.save();
    
    await commentaireObj.populate('user', 'nom prenom email');
    if (commentaireObj.reponse && commentaireObj.reponse.reponduPar) {
      await commentaireObj.populate('reponse.reponduPar', 'nom prenom email');
    }
    
    res.json({
      message: 'Commentaire mis à jour avec succès.',
      commentaire: commentaireObj
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer son propre commentaire ou supprimer n'importe quel commentaire (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const commentaire = await Commentaire.findById(req.params.id);
    if (!commentaire) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire du commentaire ou admin
    if (commentaire.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire.' });
    }
    
    await Commentaire.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Commentaire supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir le commentaire de l'utilisateur connecté pour un film
router.get('/film/:filmId/my-comment', auth, async (req, res) => {
  try {
    const commentaire = await Commentaire.findOne({
      film: req.params.filmId,
      user: req.user.id
    })
      .populate('user', 'nom prenom email')
      .populate('reponse.reponduPar', 'nom prenom email');
    
    if (!commentaire) {
      return res.status(404).json({ message: 'Vous n\'avez pas encore commenté ce film.' });
    }
    
    res.json(commentaire);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Répondre à un commentaire (utilisateur authentifié)
router.post('/:id/reponse', auth, async (req, res) => {
  try {
    const { texte } = req.body;
    
    if (!texte || !texte.trim()) {
      return res.status(400).json({ message: 'Le texte de la réponse est requis.' });
    }
    
    if (texte.length > 1000) {
      return res.status(400).json({ message: 'La réponse ne peut pas dépasser 1000 caractères.' });
    }
    
    const commentaire = await Commentaire.findById(req.params.id);
    if (!commentaire) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }
    
    // Ajouter ou mettre à jour la réponse
    commentaire.reponse = {
      texte: texte.trim(),
      reponduPar: req.user.id,
      reponduLe: Date.now()
    };
    
    await commentaire.save();
    
    // Peupler les données pour la réponse
    await commentaire.populate('user', 'nom prenom email');
    await commentaire.populate('reponse.reponduPar', 'nom prenom email');
    
    res.json({
      message: 'Réponse ajoutée avec succès.',
      commentaire: commentaire
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une réponse à un commentaire (utilisateur qui a répondu ou admin)
router.put('/:id/reponse', auth, async (req, res) => {
  try {
    const { texte } = req.body;
    
    const commentaire = await Commentaire.findById(req.params.id);
    if (!commentaire) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }
    
    if (!commentaire.reponse || !commentaire.reponse.texte) {
      return res.status(400).json({ message: 'Ce commentaire n\'a pas encore de réponse.' });
    }
    
    // Vérifier que l'utilisateur est l'auteur de la réponse ou admin
    if (commentaire.reponse.reponduPar.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette réponse.' });
    }
    
    if (!texte || !texte.trim()) {
      return res.status(400).json({ message: 'Le texte de la réponse est requis.' });
    }
    
    if (texte.length > 1000) {
      return res.status(400).json({ message: 'La réponse ne peut pas dépasser 1000 caractères.' });
    }
    
    // Mettre à jour la réponse
    commentaire.reponse.texte = texte.trim();
    commentaire.reponse.reponduLe = Date.now();
    
    await commentaire.save();
    
    // Peupler les données pour la réponse
    await commentaire.populate('user', 'nom prenom email');
    await commentaire.populate('reponse.reponduPar', 'nom prenom email');
    
    res.json({
      message: 'Réponse mise à jour avec succès.',
      commentaire: commentaire
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une réponse à un commentaire (utilisateur qui a répondu ou admin)
router.delete('/:id/reponse', auth, async (req, res) => {
  try {
    const commentaire = await Commentaire.findById(req.params.id);
    if (!commentaire) {
      return res.status(404).json({ message: 'Commentaire non trouvé.' });
    }
    
    if (!commentaire.reponse || !commentaire.reponse.texte) {
      return res.status(400).json({ message: 'Ce commentaire n\'a pas de réponse.' });
    }
    
    // Vérifier que l'utilisateur est l'auteur de la réponse ou admin
    if (commentaire.reponse.reponduPar.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette réponse.' });
    }
    
    // Supprimer la réponse
    commentaire.reponse = undefined;
    await commentaire.save();
    
    await commentaire.populate('user', 'nom prenom email');
    
    res.json({
      message: 'Réponse supprimée avec succès.',
      commentaire: commentaire
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


const express = require('express');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Obtenir tous les utilisateurs (admin)
router.get('/', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir un utilisateur par ID (admin)
router.get('/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le profil utilisateur
router.put('/profile', auth, async (req, res) => {
  try {
    const { nom, prenom, telephone, dateNaissance } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { nom, prenom, telephone, dateNaissance },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les statistiques d'un utilisateur
router.get('/:id/stats', auth, admin, async (req, res) => {
  try {
    const userId = req.params.id;
    const totalReservations = await Reservation.countDocuments({ user: userId });
    const reservationsConfirmees = await Reservation.countDocuments({ 
      user: userId, 
      statut: 'confirmee' 
    });
    
    res.json({
      totalReservations,
      reservationsConfirmees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer un utilisateur (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


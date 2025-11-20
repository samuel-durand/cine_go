const express = require('express');
const Reservation = require('../models/Reservation');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Valider un billet via QR code (pour les contrôleurs)
router.post('/validate', auth, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'Données QR code manquantes.' });
    }

    let qrInfo;
    try {
      qrInfo = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return res.status(400).json({ message: 'Format QR code invalide.' });
    }

    const { reservationId, userId, seanceId } = qrInfo;

    if (!reservationId) {
      return res.status(400).json({ message: 'ID de réservation manquant.' });
    }

    // Récupérer la réservation
    const reservation = await Reservation.findById(reservationId)
      .populate('user', 'nom prenom email')
      .populate('seance')
      .populate({
        path: 'seance',
        populate: { path: 'film', select: 'titre' }
      })
      .populate({
        path: 'seance',
        populate: { path: 'salle', select: 'nom type' }
      });

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée.' });
    }

    // Vérifier que les données correspondent
    if (userId && reservation.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Utilisateur ne correspond pas.' });
    }

    if (seanceId && reservation.seance._id.toString() !== seanceId) {
      return res.status(403).json({ message: 'Séance ne correspond pas.' });
    }

    // Vérifier le statut
    if (reservation.statut !== 'confirmee') {
      return res.status(400).json({ 
        message: 'Réservation non confirmée.',
        statut: reservation.statut
      });
    }

    if (reservation.paiement !== 'paye') {
      return res.status(400).json({ 
        message: 'Paiement non effectué.',
        paiement: reservation.paiement
      });
    }

    // Vérifier que la séance n'est pas passée (optionnel)
    const now = new Date();
    const seanceDate = new Date(reservation.seance.date);
    if (seanceDate < now) {
      return res.status(400).json({ 
        message: 'Cette séance est déjà passée.',
        warning: true
      });
    }

    res.json({
      valid: true,
      reservation: {
        id: reservation._id,
        user: {
          nom: reservation.user.nom,
          prenom: reservation.user.prenom,
          email: reservation.user.email
        },
        film: reservation.seance.film?.titre,
        date: reservation.seance.date,
        heure: reservation.seance.heure,
        salle: reservation.seance.salle?.nom,
        sieges: reservation.sieges || [],
        nombrePlaces: reservation.nombrePlaces
      }
    });
  } catch (error) {
    console.error('Erreur validation billet:', error);
    res.status(500).json({ message: 'Erreur lors de la validation du billet.' });
  }
});

// Obtenir les informations d'un billet (pour affichage)
router.get('/:id', auth, async (req, res) => {
  try {
    const Salle = require('../models/Salle');
    const Cinema = require('../models/Cinema');
    
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'nom prenom email')
      .populate('seance')
      .populate({
        path: 'seance',
        populate: { path: 'film' }
      })
      .populate({
        path: 'seance',
        populate: {
          path: 'salle',
          select: 'nom type cinema',
          populate: {
            path: 'cinema',
            model: Cinema,
            select: 'nom ville adresse codePostal telephone'
          }
        }
      });

    if (!reservation) {
      return res.status(404).json({ message: 'Billet non trouvé.' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


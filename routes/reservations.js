const express = require('express');
const Stripe = require('stripe');
const Reservation = require('../models/Reservation');
const Seance = require('../models/Seance');
const { validateSeatSelection } = require('../utils/seatHelpers');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? Stripe(stripeSecretKey) : null;

const seatErrorToMessage = (error) => {
  switch (error.message) {
    case 'PLAN_NOT_AVAILABLE':
      return 'Cette salle ne dispose pas de plan de sièges.';
    case 'NO_SEATS_SELECTED':
      return 'Veuillez sélectionner au moins un siège.';
    case 'SEAT_NOT_FOUND':
      return `Siège introuvable (${error.seatId}).`;
    case 'SEAT_ALREADY_RESERVED':
      return `Le siège ${error.seat?.label || ''} n'est plus disponible.`;
    case 'DUPLICATE_SEAT':
      return `Le siège ${error.seatId} a déjà été sélectionné.`;
    case 'INVALID_SEAT':
      return 'Sélection de sièges invalide.';
    default:
      return 'Impossible de valider les sièges sélectionnés.';
  }
};

// Obtenir toutes les réservations de l'utilisateur
router.get('/my-reservations', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate({
        path: 'seance',
        populate: [
          { path: 'film', select: 'titre image duree' },
          { path: 'salle', select: 'nom type' }
        ]
      })
      .sort({ dateReservation: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir toutes les réservations (admin)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', 'nom prenom email')
      .populate({
        path: 'seance',
        populate: [
          { path: 'film', select: 'titre image' },
          { path: 'salle', select: 'nom type' }
        ]
      })
      .sort({ dateReservation: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir une réservation par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'nom prenom email')
      .populate({
        path: 'seance',
        populate: [
          { path: 'film' },
          { path: 'salle', select: 'nom type' }
        ]
      });

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée.' });
    }

    // Vérifier que l'utilisateur peut accéder à cette réservation
    if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une réservation
router.post('/', auth, async (req, res) => {
  try {
    const { seanceId, seats = [], places, nombrePlaces, paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Le paiement est requis pour confirmer la réservation.' });
    }

    if (!stripe) {
      return res.status(500).json({ message: 'Stripe n\'est pas configuré côté serveur.' });
    }

    const seance = await Seance.findById(seanceId);
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }

    if (!seance.actif) {
      return res.status(400).json({ message: 'Cette séance n\'est plus disponible.' });
    }

    if (seance.bloque) {
      return res.status(400).json({
        message: seance.raisonBlocage || 'Cette séance est bloquée et ne peut pas être réservée.'
      });
    }

    const planEnabled = seance.plan?.rows?.length;
    let seatsInfo = [];
    let nbPlaces = 0;
    let prixTotal = 0;

    if (planEnabled) {
      try {
        const validation = validateSeatSelection(seance, seats);
        seatsInfo = validation.seats;
        nbPlaces = seatsInfo.length;
        prixTotal = validation.prixTotal;
      } catch (error) {
        return res.status(400).json({ message: seatErrorToMessage(error) });
      }
    } else {
      const parsed = parseInt(nombrePlaces, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        return res.status(400).json({ message: 'Nombre de places invalide.' });
      }
      nbPlaces = parsed;
      prixTotal = seance.prix * nbPlaces;
      seatsInfo = (places || []).map((placeLabel, index) => ({
        seatId: `${placeLabel}-${index}`,
        label: placeLabel,
        row: placeLabel,
        number: index + 1,
        type: 'standard',
        priceModifier: 0
      }));
    }

    if (seance.placesDisponibles < nbPlaces) {
      return res.status(400).json({ message: 'Pas assez de places disponibles.' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Paiement non confirmé.' });
    }

    if (paymentIntent.amount !== Math.round(prixTotal * 100)) {
      return res.status(400).json({ message: 'Montant du paiement invalide.' });
    }

    if (paymentIntent.metadata?.userId !== req.user.id) {
      return res.status(400).json({ message: 'Paiement non associé à cet utilisateur.' });
    }

    if (paymentIntent.metadata?.seanceId !== seance._id.toString()) {
      return res.status(400).json({ message: 'Paiement non associé à cette séance.' });
    }

    if (Number(paymentIntent.metadata?.nombrePlaces || 0) !== nbPlaces) {
      return res.status(400).json({ message: 'Incohérence entre paiement et sélection de sièges.' });
    }

    const existingReservation = await Reservation.findOne({ paymentIntentId });
    if (existingReservation) {
      return res.status(400).json({ message: 'Ce paiement a déjà été utilisé.' });
    }

    const reservation = await Reservation.create({
      user: req.user.id,
      seance: seanceId,
      places: seatsInfo.length ? seatsInfo.map((seat) => seat.label) : (places || []),
      sieges: seatsInfo.length
        ? seatsInfo.map((seat) => ({
            seatId: seat.seatId,
            label: seat.label,
            row: seat.row,
            number: seat.number,
            type: seat.type,
            prix: (seance.prix || 0) + (seat.priceModifier || 0)
          }))
        : [],
      nombrePlaces: nbPlaces,
      prixTotal,
      paiement: 'paye',
      statut: 'confirmee',
      paymentIntentId
    });

    if (seatsInfo.length) {
      const reservedEntries = seatsInfo.map((seat) => ({
        seatId: seat.seatId,
        label: seat.label,
        row: seat.row,
        number: seat.number,
        type: seat.type,
        reservation: reservation._id
      }));
      seance.siegesReserves.push(...reservedEntries);
    }

    seance.placesDisponibles = Math.max(0, seance.placesDisponibles - nbPlaces);
    await seance.save();

    const reservationPopulated = await Reservation.findById(reservation._id)
      .populate({
        path: 'seance',
        populate: [
          { path: 'film', select: 'titre image duree' },
          { path: 'salle', select: 'nom type' }
        ]
      });

    res.status(201).json(reservationPopulated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Annuler une réservation
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée.' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    if (reservation.statut === 'annulee') {
      return res.status(400).json({ message: 'Cette réservation est déjà annulée.' });
    }

    // Mettre à jour la réservation
    reservation.statut = 'annulee';

    if (stripe && reservation.paymentIntentId && reservation.paiement === 'paye') {
      try {
        await stripe.refunds.create({ payment_intent: reservation.paymentIntentId });
        reservation.paiement = 'rembourse';
      } catch (refundError) {
        console.error('Erreur de remboursement Stripe:', refundError);
        return res.status(500).json({ message: 'Annulation effectuée, mais le remboursement Stripe a échoué.' });
      }
    } else {
      reservation.paiement = 'rembourse';
    }

    await reservation.save();

    // Remettre les places disponibles
    const seance = await Seance.findById(reservation.seance);
    if (seance) {
      if (reservation.sieges?.length) {
        const seatIdsToRelease = new Set(reservation.sieges.map((seat) => seat.seatId));
        seance.siegesReserves = (seance.siegesReserves || []).filter((seat) => {
          if (!seatIdsToRelease.has(seat.seatId)) {
            return true;
          }
          if (!seat.reservation) {
            return false;
          }
          return seat.reservation.toString() !== reservation._id.toString();
        });
      }

      const seatsToAdd = reservation.sieges?.length || reservation.nombrePlaces || 0;
      seance.placesDisponibles = Math.min(
        seance.placesTotal,
        seance.placesDisponibles + seatsToAdd
      );
      await seance.save();
    }

    res.json({ message: 'Réservation annulée avec succès.', reservation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le statut d'une réservation (admin)
router.put('/:id/status', auth, admin, async (req, res) => {
  try {
    const { statut, paiement } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { statut, paiement },
      { new: true, runValidators: true }
    ).populate('seance').populate({
      path: 'seance',
      populate: { path: 'film', select: 'titre image' }
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée.' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


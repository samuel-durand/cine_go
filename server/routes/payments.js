const express = require('express');
const Stripe = require('stripe');
const { auth } = require('../middleware/auth');
const Seance = require('../models/Seance');
const { validateSeatSelection } = require('../utils/seatHelpers');

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? Stripe(stripeSecretKey) : null;
const CURRENCY = process.env.STRIPE_CURRENCY || 'eur';

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

router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe n\'est pas configuré côté serveur.' });
    }

    const { seanceId, nombrePlaces, seats = [] } = req.body;

    if (!seanceId) {
      return res.status(400).json({ message: 'Séance requise.' });
    }

    const seance = await Seance.findById(seanceId).populate('film', 'titre');
    if (!seance || !seance.actif) {
      return res.status(404).json({ message: 'Séance introuvable.' });
    }

    if (seance.bloque) {
      return res.status(400).json({
        message: seance.raisonBlocage || 'Cette séance est bloquée et ne peut pas être réservée.'
      });
    }

    const planEnabled = seance.plan?.rows?.length;
    let nbPlaces;
    let prixTotal;
    let seatsValidation = null;

    if (planEnabled) {
      try {
        seatsValidation = validateSeatSelection(seance, seats);
      } catch (error) {
        return res.status(400).json({ message: seatErrorToMessage(error) });
      }

      nbPlaces = seatsValidation.seats.length;
      prixTotal = seatsValidation.prixTotal;
    } else {
      if (!nombrePlaces) {
        return res.status(400).json({ message: 'Nombre de places requis.' });
      }

      const parsed = parseInt(nombrePlaces, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        return res.status(400).json({ message: 'Nombre de places invalide.' });
      }

      nbPlaces = parsed;
      prixTotal = seance.prix * nbPlaces;
    }

    if (seance.placesDisponibles < nbPlaces) {
      return res.status(400).json({ message: 'Pas assez de places disponibles.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(prixTotal * 100),
      currency: CURRENCY,
      metadata: {
        userId: req.user.id,
        seanceId: seance._id.toString(),
        nombrePlaces: nbPlaces.toString(),
        seatIds: seatsValidation ? seatsValidation.seats.map((seat) => seat.seatId).join(',') : ''
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: prixTotal,
      currency: CURRENCY,
      seance: {
        id: seance._id,
        titre: seance.film?.titre || '',
        date: seance.date,
        heure: seance.heure
      }
    });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({ message: 'Erreur lors de la création du paiement.' });
  }
});

module.exports = router;


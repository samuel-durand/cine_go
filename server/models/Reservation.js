const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seance',
    required: true
  },
  places: [{
    type: String,
    required: true
  }],
  sieges: [{
    seatId: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    row: {
      type: String,
      required: true,
      trim: true
    },
    number: {
      type: Number,
      required: true,
      min: 1
    },
    type: {
      type: String,
      enum: ['standard', 'vip', 'premium', 'accessible'],
      default: 'standard'
    },
    prix: {
      type: Number,
      default: 0
    }
  }],
  nombrePlaces: {
    type: Number,
    required: true,
    min: 1
  },
  prixTotal: {
    type: Number,
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'annulee'],
    default: 'en_attente'
  },
  dateReservation: {
    type: Date,
    default: Date.now
  },
  paiement: {
    type: String,
    enum: ['en_attente', 'paye', 'rembourse'],
    default: 'en_attente'
  },
  paymentIntentId: {
    type: String,
    trim: true
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);


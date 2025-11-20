const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['standard', 'vip', 'premium', 'accessible'],
      default: 'standard',
    },
    accessible: {
      type: Boolean,
      default: false,
    },
    priceModifier: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const rowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seats: {
      type: [seatSchema],
      default: [],
    },
  },
  { _id: false }
);

const reservedSeatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['standard', 'vip', 'premium', 'accessible'],
      default: 'standard',
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
    },
  },
  { _id: false }
);

const seanceSchema = new mongoose.Schema({
  film: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Film',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  heure: {
    type: String,
    required: true
  },
  salle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salle',
    required: true
  },
  plan: {
    rows: {
      type: [rowSchema],
      default: []
    }
  },
  siegesReserves: {
    type: [reservedSeatSchema],
    default: []
  },
  bloque: {
    type: Boolean,
    default: false
  },
  raisonBlocage: {
    type: String,
    default: ''
  },
  placesTotal: {
    type: Number,
    required: true,
    default: 100
  },
  placesDisponibles: {
    type: Number,
    required: true,
    default: 100
  },
  prix: {
    type: Number,
    required: true
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Seance', seanceSchema);


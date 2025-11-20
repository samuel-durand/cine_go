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

const planSchema = new mongoose.Schema(
  {
    rows: {
      type: [rowSchema],
      default: [],
    },
  },
  { _id: false }
);

const salleSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['classic', 'vip', 'premium', 'imax', '4dx'],
    required: true,
    default: 'classic'
  },
  capacite: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    default: ''
  },
  equipements: [{
    type: String
  }],
  plan: {
    type: planSchema,
    default: { rows: [] }
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

module.exports = mongoose.model('Salle', salleSchema);


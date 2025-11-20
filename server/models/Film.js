const mongoose = require('mongoose');

const filmSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duree: {
    type: Number,
    required: true,
    min: 1
  },
  genre: {
    type: String,
    required: true
  },
  realisateur: {
    type: String,
    required: true
  },
  acteurs: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  dateSortie: {
    type: Date,
    required: true
  },
  note: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  prix: {
    type: Number,
    required: true,
    min: 0
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

module.exports = mongoose.model('Film', filmSchema);


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
  // Notes des utilisateurs
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Note moyenne calculée
  averageRating: {
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

// Méthode pour calculer la note moyenne
filmSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    return;
  }
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  this.averageRating = (sum / this.ratings.length).toFixed(1);
};

// Middleware pour recalculer la note moyenne avant la sauvegarde
filmSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    this.calculateAverageRating();
  }
  next();
});

module.exports = mongoose.model('Film', filmSchema);


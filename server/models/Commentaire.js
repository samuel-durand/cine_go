const mongoose = require('mongoose');

const commentaireSchema = new mongoose.Schema({
  film: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Film',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commentaire: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Réponse de l'admin au commentaire
  reponse: {
    texte: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    reponduPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reponduLe: {
      type: Date
    }
  }
});

// Index pour éviter les doublons (un utilisateur ne peut commenter qu'une fois par film)
commentaireSchema.index({ film: 1, user: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt avant la sauvegarde
commentaireSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Commentaire', commentaireSchema);


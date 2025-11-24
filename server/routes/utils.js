const express = require('express');
const Salle = require('../models/Salle');
const Cinema = require('../models/Cinema');
const Seance = require('../models/Seance');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// Route utilitaire pour vérifier et corriger les salles sans cinéma (admin)
router.post('/fix-salles-cinema', auth, admin, async (req, res) => {
  try {
    // Récupérer toutes les salles
    const salles = await Salle.find().lean();
    
    // Récupérer tous les cinémas
    const cinemas = await Cinema.find({ actif: true }).lean();
    
    if (cinemas.length === 0) {
      return res.status(400).json({ 
        message: 'Aucun cinéma actif trouvé. Créez d\'abord au moins un cinéma.' 
      });
    }
    
    const sallesSansCinema = [];
    const sallesCorrigees = [];
    const premierCinema = cinemas[0];
    
    // Vérifier chaque salle
    for (const salle of salles) {
      // Vérifier si la salle a un cinéma valide
      let cinemaValide = false;
      if (salle.cinema) {
        // Vérifier si le cinéma existe
        const cinemaExiste = cinemas.find(c => c._id.toString() === salle.cinema.toString());
        if (cinemaExiste) {
          cinemaValide = true;
        }
      }
      
      if (!cinemaValide) {
        sallesSansCinema.push({
          salleId: salle._id,
          salleNom: salle.nom,
          cinemaActuel: salle.cinema
        });
        
        // Corriger en assignant le premier cinéma disponible
        await Salle.findByIdAndUpdate(salle._id, {
          cinema: premierCinema._id
        });
        
        sallesCorrigees.push({
          salleId: salle._id,
          salleNom: salle.nom,
          cinemaAssigne: premierCinema.nom
        });
      }
    }
    
    res.json({
      message: `${sallesCorrigees.length} salle(s) corrigée(s)`,
      sallesSansCinema: sallesSansCinema.length,
      sallesCorrigees: sallesCorrigees,
      cinemaUtilise: premierCinema.nom
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour vérifier l'état des salles (admin)
router.get('/check-salles', auth, admin, async (req, res) => {
  try {
    const salles = await Salle.find()
      .populate('cinema', 'nom ville')
      .lean();
    
    const statut = {
      total: salles.length,
      avecCinema: 0,
      sansCinema: 0,
      cinemasInvalides: 0,
      details: []
    };
    
    const cinemas = await Cinema.find({ actif: true }).lean();
    const cinemaIds = new Set(cinemas.map(c => c._id.toString()));
    
    salles.forEach(salle => {
      if (!salle.cinema) {
        statut.sansCinema++;
        statut.details.push({
          salle: salle.nom,
          salleId: salle._id,
          statut: 'SANS_CINEMA',
          cinema: null
        });
      } else if (typeof salle.cinema === 'string') {
        if (cinemaIds.has(salle.cinema)) {
          statut.avecCinema++;
        } else {
          statut.cinemasInvalides++;
          statut.details.push({
            salle: salle.nom,
            salleId: salle._id,
            statut: 'CINEMA_INVALIDE',
            cinema: salle.cinema
          });
        }
      } else if (salle.cinema._id) {
        statut.avecCinema++;
        statut.details.push({
          salle: salle.nom,
          salleId: salle._id,
          statut: 'OK',
          cinema: salle.cinema.nom
        });
      }
    });
    
    res.json(statut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


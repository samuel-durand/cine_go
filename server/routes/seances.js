const express = require('express');
const Seance = require('../models/Seance');
const Film = require('../models/Film');
const Salle = require('../models/Salle');
const Cinema = require('../models/Cinema');
const { auth, admin } = require('../middleware/auth');
const { countPlanSeats } = require('../utils/seatHelpers');
const router = express.Router();

const clonePlan = (plan = { rows: [] }) => JSON.parse(JSON.stringify(plan || { rows: [] }));

const generatePlanFromSalle = (salle) => {
  if (salle?.plan?.rows?.length) {
    return clonePlan(salle.plan);
  }

  const capacity = salle?.capacite || 100;
  const seatsPerRow = Math.max(4, Math.min(20, Math.round(Math.sqrt(capacity))));
  const rowCount = Math.ceil(capacity / seatsPerRow);
  const rows = [];

  for (let i = 0; i < rowCount; i += 1) {
    const rowName = String.fromCharCode(65 + i);
    const seats = [];
    for (let j = 0; j < seatsPerRow; j += 1) {
      const seatNumber = j + 1;
      const seatIndex = i * seatsPerRow + j;
      if (seatIndex >= capacity) break;
      const seatId = `${rowName}${seatNumber}`;
      seats.push({
        seatId,
        label: seatId,
        row: rowName,
        number: seatNumber,
        type: salle?.type === 'vip' ? 'vip' : salle?.type === 'premium' ? 'premium' : 'standard',
        accessible: false,
        priceModifier: salle?.type === 'vip' ? 5 : salle?.type === 'premium' ? 2 : 0,
      });
    }
    rows.push({ name: rowName, seats });
  }

  return { rows };
};

// Obtenir toutes les séances (public)
router.get('/', async (req, res) => {
  try {
    const { filmId, date } = req.query;
    
    // Construire la requête de base
    const query = { actif: true, bloque: { $ne: true } };
    
    if (filmId) {
      query.film = filmId;
    }
    
    // Gérer le filtre par date
    // Récupérer toutes les séances qui correspondent aux critères de base
    // Important: pour le populate imbriqué, il faut utiliser une syntaxe différente
    let allSeances = await Seance.find(query)
      .populate({
        path: 'film',
        select: 'titre duree image'
      })
      .populate({
        path: 'salle',
        select: 'nom type capacite cinema',
        populate: {
          path: 'cinema',
          select: 'nom ville adresse codePostal telephone'
        }
      })
      .lean()
      .exec();
    
    // Re-populate le cinéma si nécessaire car le populate imbriqué peut échouer
    // On va récupérer les salles avec leurs cinémas séparément en utilisant le modèle Cinema
    if (allSeances.length > 0) {
      const salleIds = [...new Set(allSeances.map(s => {
        const salleId = s.salle?._id || s.salle;
        return salleId ? salleId.toString() : null;
      }).filter(Boolean))];
      
      // Récupérer toutes les salles avec leurs cinémas
      const sallesWithCinemas = await Salle.find({ _id: { $in: salleIds } })
        .populate({
          path: 'cinema',
          model: Cinema,
          select: 'nom ville adresse codePostal telephone'
        })
        .lean();
      
      console.log(`Récupéré ${sallesWithCinemas.length} salles sur ${salleIds.length} demandées`);
      sallesWithCinemas.forEach(salle => {
        console.log(`Salle ${salle.nom} (${salle._id}) - Cinema:`, salle.cinema ? salle.cinema.nom : 'MANQUANT');
        if (!salle.cinema || typeof salle.cinema === 'string') {
          console.log(`ATTENTION: La salle ${salle.nom} n'a pas de cinéma populé! Champ cinema:`, salle.cinema);
        }
      });
      
      // Créer un map pour accès rapide
      const sallesMap = new Map();
      sallesWithCinemas.forEach(salle => {
        sallesMap.set(salle._id.toString(), salle);
      });
      
      // Si certaines salles ont un cinema en ID string, les populer manuellement
      const cinemaIdsToFetch = new Set();
      sallesWithCinemas.forEach(salle => {
        if (salle.cinema && typeof salle.cinema === 'string') {
          cinemaIdsToFetch.add(salle.cinema);
        }
      });
      
      // Récupérer les cinémas manquants
      let cinemasMap = new Map();
      if (cinemaIdsToFetch.size > 0) {
        const cinemas = await Cinema.find({ _id: { $in: Array.from(cinemaIdsToFetch) } })
          .select('nom ville adresse codePostal telephone')
          .lean();
        cinemas.forEach(cinema => {
          cinemasMap.set(cinema._id.toString(), cinema);
        });
        
        // Remplacer les IDs par les objets cinémas dans les salles
        sallesWithCinemas.forEach(salle => {
          if (salle.cinema && typeof salle.cinema === 'string') {
            const cinema = cinemasMap.get(salle.cinema);
            if (cinema) {
              salle.cinema = cinema;
              console.log(`Cinéma populé manuellement pour la salle ${salle.nom}: ${cinema.nom}`);
            } else {
              console.log(`ATTENTION: Cinéma avec ID ${salle.cinema} non trouvé pour la salle ${salle.nom}`);
            }
          }
        });
        
        // Mettre à jour la map des salles
        sallesMap = new Map();
        sallesWithCinemas.forEach(salle => {
          sallesMap.set(salle._id.toString(), salle);
        });
      }
      
      // Remettre les salles avec cinémas populés dans les séances
      allSeances = allSeances.map(seance => {
        if (seance.salle) {
          const salleId = seance.salle._id?.toString() || seance.salle.toString();
          const salleWithCinema = sallesMap.get(salleId);
          if (salleWithCinema) {
            seance.salle = salleWithCinema;
          }
        }
        return seance;
      });
    }
    
    console.log(`Récupéré ${allSeances.length} séances avant filtrage par date`);
    
    // Log de débogage pour voir si le cinema est populé
    if (allSeances.length > 0) {
      const firstSeance = allSeances[0];
      console.log('Première séance - ID:', firstSeance._id);
      console.log('Première séance - Salle:', firstSeance.salle);
      if (firstSeance.salle) {
        console.log('Première séance - Salle ID:', firstSeance.salle._id);
        console.log('Première séance - Salle nom:', firstSeance.salle.nom);
        console.log('Première séance - Cinema:', firstSeance.salle.cinema);
        if (!firstSeance.salle.cinema || typeof firstSeance.salle.cinema === 'string') {
          console.log('ATTENTION: Le cinéma n\'est pas populé correctement!');
          console.log('Cinema value:', firstSeance.salle.cinema);
          console.log('Cinema type:', typeof firstSeance.salle.cinema);
        } else {
          console.log('Cinema populé avec succès:', firstSeance.salle.cinema.nom);
        }
      } else {
        console.log('ATTENTION: La séance n\'a pas de salle!');
      }
    }
    
    // Filtrer par date si une date est fournie
    if (date) {
      // Format attendu: YYYY-MM-DD
      // Normaliser la date cible en UTC
      const targetDate = new Date(date + 'T00:00:00.000Z');
      targetDate.setUTCHours(0, 0, 0, 0);
      
      console.log(`Filtrage par date: ${targetDate.toISOString()}`);
      
      const initialCount = allSeances.length;
      allSeances = allSeances.filter(seance => {
        if (!seance.date) {
          console.log('Séance sans date:', seance._id);
          return false;
        }
        
        // Normaliser la date de la séance en UTC
        const seanceDate = new Date(seance.date);
        seanceDate.setUTCHours(0, 0, 0, 0);
        
        const matches = seanceDate.getTime() === targetDate.getTime();
        if (!matches && initialCount < 20) {
          // Log seulement pour les premiers éléments si la liste est petite
          console.log(`Date séance: ${seanceDate.toISOString()}, Date cible: ${targetDate.toISOString()}, Match: ${matches}`);
        }
        return matches;
      });
      
      console.log(`Après filtrage: ${allSeances.length} séances (sur ${initialCount})`);
    }
    
    // Trier les séances par date puis par heure
    allSeances.sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
      }
      return a.heure.localeCompare(b.heure);
    });
    
    // Vérifier une dernière fois après filtrage si le cinéma est bien populé
    if (allSeances.length > 0) {
      const firstFiltered = allSeances[0];
      console.log('Après filtrage - Première séance - Cinema:', firstFiltered.salle?.cinema);
      if (firstFiltered.salle && (!firstFiltered.salle.cinema || typeof firstFiltered.salle.cinema === 'string')) {
        console.log('ERREUR: Le cinéma n\'est toujours pas populé après filtrage!');
      }
    }
    
    console.log(`Retour de ${allSeances.length} séances pour la date: ${date || 'toutes'}`);
    res.json(allSeances);
  } catch (error) {
    console.error('Erreur lors de la récupération des séances:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtenir toutes les séances (admin)
router.get('/all', auth, admin, async (req, res) => {
  try {
    const seances = await Seance.find()
      .populate('film', 'titre duree image')
      .populate({
        path: 'salle',
        select: 'nom type capacite cinema',
        populate: {
          path: 'cinema',
          select: 'nom ville adresse codePostal telephone'
        }
      })
      .sort({ date: -1, heure: 1 });
    res.json(seances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir une séance par ID
router.get('/:id', async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id)
      .populate('film')
      .populate({
        path: 'salle',
        select: 'nom type capacite cinema',
        populate: {
          path: 'cinema',
          select: 'nom ville adresse codePostal telephone'
        }
      });
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json(seance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une séance (admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { film, date, heure, salle, placesTotal, prix } = req.body;
    
    // Vérifier que le film existe
    const filmExists = await Film.findById(film);
    if (!filmExists) {
      return res.status(404).json({ message: 'Film non trouvé.' });
    }

    // Vérifier que la salle existe
    const salleExists = await Salle.findById(salle);
    if (!salleExists) {
      return res.status(404).json({ message: 'Salle non trouvée.' });
    }

    const planSnapshot = generatePlanFromSalle(salleExists);
    const totalSeatsFromPlan = countPlanSeats(planSnapshot);
    const totalSeats = totalSeatsFromPlan || placesTotal || salleExists.capacite;

    // Normaliser la date pour éviter les problèmes de fuseau horaire
    let normalizedDate = date;
    if (typeof date === 'string' && date.includes('T')) {
      // Si la date est au format ISO avec heure, garder telle quelle
      normalizedDate = new Date(date);
    } else if (typeof date === 'string') {
      // Si c'est juste une date YYYY-MM-DD, créer une date UTC pour le début de la journée
      normalizedDate = new Date(date + 'T00:00:00.000Z');
    }

    const seance = await Seance.create({
      film,
      date: normalizedDate,
      heure,
      salle,
      plan: planSnapshot,
      placesTotal: totalSeats,
      placesDisponibles: totalSeats,
      prix: prix || filmExists.prix
    });

    const seancePopulated = await Seance.findById(seance._id)
      .populate('film', 'titre duree image')
      .populate({
        path: 'salle',
        select: 'nom type capacite cinema',
        populate: {
          path: 'cinema',
          select: 'nom ville adresse codePostal telephone'
        }
      });

    res.status(201).json(seancePopulated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour une séance (admin)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Normaliser la date si elle est fournie
    if (updateData.date) {
      if (typeof updateData.date === 'string' && updateData.date.includes('T')) {
        updateData.date = new Date(updateData.date);
      } else if (typeof updateData.date === 'string') {
        // Si c'est juste une date YYYY-MM-DD, créer une date UTC
        updateData.date = new Date(updateData.date + 'T00:00:00.000Z');
      }
    }
    
    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('film', 'titre duree image')
      .populate({
        path: 'salle',
        select: 'nom type capacite cinema',
        populate: {
          path: 'cinema',
          select: 'nom ville adresse codePostal telephone'
        }
      });
    
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json(seance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bloquer/Débloquer une séance (admin)
router.put('/:id/block', auth, admin, async (req, res) => {
  try {
    const { bloque, raisonBlocage } = req.body;
    const seance = await Seance.findByIdAndUpdate(
      req.params.id,
      { bloque, raisonBlocage: raisonBlocage || '' },
      { new: true, runValidators: true }
    )
      .populate('film', 'titre duree image')
      .populate({
        path: 'salle',
        select: 'nom type capacite cinema',
        populate: {
          path: 'cinema',
          select: 'nom ville adresse codePostal telephone'
        }
      });
    
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json(seance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les séances par salle et date (admin - pour planning)
router.get('/planning/:salleId', auth, admin, async (req, res) => {
  try {
    const { salleId } = req.params;
    const { date } = req.query;
    
    let query = { salle: salleId };
    
    if (date) {
      // Format attendu: YYYY-MM-DD
      // Créer les dates de début et fin de journée en UTC
      const dateStr = date; // Format: YYYY-MM-DD
      const startDate = new Date(dateStr + 'T00:00:00.000Z');
      const endDate = new Date(dateStr + 'T23:59:59.999Z');
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const seances = await Seance.find(query)
      .populate('film', 'titre duree image')
      .populate('salle', 'nom type capacite')
      .sort({ date: 1, heure: 1 });
    
    res.json(seances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une séance (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const seance = await Seance.findByIdAndDelete(req.params.id);
    if (!seance) {
      return res.status(404).json({ message: 'Séance non trouvée.' });
    }
    res.json({ message: 'Séance supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  TextField,
  Rating,
  Divider
} from '@mui/material';
import { AccessTime, Room, Euro, Star, LocationOn } from '@mui/icons-material';
import { MenuItem } from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const FilmDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [film, setFilm] = useState(null);
  const [seances, setSeances] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchFilm = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/films/${id}`);
      setFilm(response.data);
      
      // Si les cinémas sont inclus dans la réponse du film, les utiliser
      if (response.data.cinemas && Array.isArray(response.data.cinemas)) {
        setCinemas(response.data.cinemas);
      }
      
      // Mettre à jour la note moyenne si elle existe
      if (response.data.averageRating !== undefined) {
        setAverageRating(response.data.averageRating);
      } else if (response.data.note) {
        setAverageRating(response.data.note);
      }
      
      if (response.data.ratings) {
        setTotalRatings(response.data.ratings.length);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du film:', error);
      setLoading(false);
    }
  }, [id]);

  const fetchUserRating = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/films/${id}/rating`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserRating(response.data.userRating);
      setAverageRating(response.data.averageRating || 0);
      setTotalRatings(response.data.totalRatings || 0);
    } catch (error) {
      // Si l'utilisateur n'a pas encore noté, ce n'est pas une erreur
      if (error.response?.status !== 404) {
        console.error('Erreur lors du chargement de la note:', error);
      }
    }
  }, [id, user]);

  const handleRatingChange = async (event, newValue) => {
    if (!user) {
      alert('Veuillez vous connecter pour noter ce film.');
      return;
    }
    
    if (!newValue) return;
    
    setRatingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/films/${id}/rating`,
        { rating: newValue },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUserRating(newValue);
      setAverageRating(response.data.averageRating);
      
      // Mettre à jour le film avec la nouvelle note moyenne
      if (film) {
        setFilm({ ...film, averageRating: response.data.averageRating });
      }
      
      // Recharger les notes pour avoir le total à jour
      fetchUserRating();
    } catch (error) {
      console.error('Erreur lors de la notation:', error);
      alert(error.response?.data?.message || 'Erreur lors de la notation');
    } finally {
      setRatingLoading(false);
    }
  };

  const fetchSeances = useCallback(async () => {
    try {
      console.log('Fetching seances avec date:', selectedDate, 'filmId:', id);
      const response = await axios.get(`${API_URL}/seances`, {
        params: { filmId: id, date: selectedDate }
      });
      console.log('Réponse reçue:', response.data.length, 'séances');
      
      // Log de débogage pour voir la structure des données
      if (response.data.length > 0) {
        const firstSeance = response.data[0];
        console.log('Première séance reçue:', firstSeance);
        console.log('Salle de la première séance:', firstSeance.salle);
        console.log('Cinema de la première séance:', firstSeance.salle?.cinema);
        console.log('Type de salle.cinema:', typeof firstSeance.salle?.cinema);
      }
      
      // Filtrer aussi côté client pour s'assurer que les dates correspondent
      // Normaliser la date sélectionnée
      const targetDate = new Date(selectedDate + 'T00:00:00.000Z');
      targetDate.setUTCHours(0, 0, 0, 0);
      
      const filteredSeances = response.data.filter(seance => {
        if (!seance.date) return false;
        const seanceDate = new Date(seance.date);
        seanceDate.setUTCHours(0, 0, 0, 0);
        const matches = seanceDate.getTime() === targetDate.getTime();
        if (!matches) {
          console.log('Séance filtrée:', seanceDate.toISOString(), 'vs', targetDate.toISOString());
        }
        return matches;
      });
      
      console.log('Séances filtrées côté client:', filteredSeances.length);
      setSeances(filteredSeances);
      
      // Extraire les cinémas uniques depuis les séances filtrées
      const cinemasMap = new Map();
      filteredSeances.forEach(seance => {
        const cinema = seance.salle?.cinema;
        if (cinema && !cinemasMap.has(cinema._id)) {
          cinemasMap.set(cinema._id, cinema);
        }
      });
      setCinemas(Array.from(cinemasMap.values()));
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
      setSeances([]);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchFilm();
    fetchSeances();
    fetchUserRating();
  }, [fetchFilm, fetchSeances, fetchUserRating]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          backgroundColor: '#121212',
        }}
      >
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  if (!film) {
    return (
      <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', py: 8 }}>
        <Container maxWidth="lg">
          <Alert
            severity="error"
            sx={{
              backgroundColor: '#1a1a1a',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 0, 0, 0.3)',
            }}
          >
            Film non trouvé
          </Alert>
        </Container>
      </Box>
    );
  }

  // Filtrer les séances par cinéma si un cinéma est sélectionné
  const filteredSeances = selectedCinema
    ? seances.filter(seance => seance.salle?.cinema?._id === selectedCinema)
    : seances;

  console.log('Total séances reçues:', seances.length);
  console.log('Séances filtrées:', filteredSeances.length);
  console.log('Première séance (si disponible):', filteredSeances[0]);

  // Grouper les séances par cinéma, puis par salle
  const groupedSeances = filteredSeances.reduce((acc, seance) => {
    const salle = seance.salle;
    
    // Vérifier si le cinéma est directement dans la salle ou s'il faut le récupérer
    let cinema = salle?.cinema;
    
    // Si le cinéma n'est pas un objet mais un ID, essayer de le trouver
    if (salle && !cinema && salle.cinema) {
      // Le cinema pourrait être juste un ID string
      if (typeof salle.cinema === 'string') {
        console.warn('Cinéma est un ID string, pas un objet:', salle.cinema);
      }
    }
    
    // Si pas de cinéma ou salle, on crée un groupe par défaut pour afficher quand même
    if (!cinema || !salle) {
      console.warn('Séance sans cinéma ou salle:', seance);
      console.warn('Détails - Salle:', salle);
      console.warn('Détails - Cinema:', cinema);
      console.warn('Détails - Salle.cinema:', salle?.cinema);
      const defaultId = 'unknown';
      if (!acc[defaultId]) {
        acc[defaultId] = {
          cinema: { _id: defaultId, nom: 'Cinéma inconnu', adresse: '', codePostal: '', ville: '' },
          salles: {}
        };
      }
      const salleId = salle?._id || 'unknown-salle';
      if (!acc[defaultId].salles[salleId]) {
        acc[defaultId].salles[salleId] = {
          salle: salle || { _id: salleId, nom: 'Salle inconnue', type: '' },
          seances: []
        };
      }
      acc[defaultId].salles[salleId].seances.push(seance);
      return acc;
    }
    
    const cinemaId = cinema._id;
    const salleId = salle._id;
    
    if (!acc[cinemaId]) {
      acc[cinemaId] = {
        cinema: cinema,
        salles: {}
      };
    }
    
    if (!acc[cinemaId].salles[salleId]) {
      acc[cinemaId].salles[salleId] = {
        salle: salle,
        seances: []
      };
    }
    
    acc[cinemaId].salles[salleId].seances.push(seance);
    return acc;
  }, {});

  console.log('Groupes créés:', Object.keys(groupedSeances).length);
  console.log('Détails des groupes:', Object.keys(groupedSeances).map(key => ({
    cinema: groupedSeances[key].cinema.nom,
    nbSalles: Object.keys(groupedSeances[key].salles).length
  })));

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
          <Box 
            className="mb-4"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              p: 2,
            }}
          >
            {film.image ? (
              <img
                src={film.image.startsWith('/') ? `${API_URL}${film.image}` : film.image}
                alt={film.titre}
                className="w-full rounded-lg"
                style={{ borderRadius: '12px' }}
              />
            ) : (
              <Box
                height="400"
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                }}
              >
                <Typography variant="h6" sx={{ color: '#CCCCCC' }}>
                  Image non disponible
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              mb: 4,
            }}
          >
            <Typography variant="h3" component="h1" className="mb-4 font-bold" sx={{ color: '#FFFFFF' }}>
              {film.titre}
            </Typography>

            <Box className="mb-4 flex flex-wrap gap-2">
              <Chip label={film.genre} color="primary" />
              <Chip label={`${film.duree} min`} />
              <Chip 
                icon={<Star sx={{ color: '#FFD700' }} />}
                label={`${averageRating}/10 (${totalRatings} avis)`}
                sx={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#FFD700' }}
              />
            </Box>

            {user && (
              <Box sx={{ mb: 4, p: 3, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                  Votre note
                </Typography>
                <Rating
                  value={userRating || 0}
                  onChange={handleRatingChange}
                  max={10}
                  size="large"
                  disabled={ratingLoading}
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#FFD700',
                    },
                    '& .MuiRating-iconEmpty': {
                      color: 'rgba(255, 215, 0, 0.3)',
                    },
                  }}
                />
                {userRating && (
                  <Typography variant="body2" sx={{ mt: 1, color: '#CCCCCC' }}>
                    Vous avez noté ce film {userRating}/10
                  </Typography>
                )}
              </Box>
            )}
            
            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            <Typography variant="h6" className="mb-2 font-semibold" sx={{ color: '#FFD700' }}>
              Description
            </Typography>
            <Typography variant="body1" className="mb-4" sx={{ color: '#CCCCCC' }}>
              {film.description}
            </Typography>

            <Grid container spacing={2} className="mb-4">
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Réalisateur
              </Typography>
              <Typography variant="body1" className="font-semibold">
                {film.realisateur}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Date de sortie
              </Typography>
              <Typography variant="body1" className="font-semibold">
                {new Date(film.dateSortie).toLocaleDateString('fr-FR')}
              </Typography>
            </Grid>
            {film.acteurs && film.acteurs.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Acteurs
                </Typography>
                <Typography variant="body1" className="font-semibold">
                  {film.acteurs.join(', ')}
                </Typography>
              </Grid>
            )}
          </Grid>
          </Box>
        </Grid>
      </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: '#FFD700',
            }}
          >
            Séances disponibles
          </Typography>

          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              type="date"
              label="Sélectionner une date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.7)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#CCCCCC',
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                  cursor: 'pointer',
                },
              }}
            />
            {cinemas.length > 0 && (
              <TextField
                select
                label="Choisir un cinéma"
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                sx={{
                  minWidth: 250,
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 215, 0, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 215, 0, 0.7)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#CCCCCC',
                  },
                }}
              >
                <MenuItem value="">
                  <em>Tous les cinémas ({cinemas.length})</em>
                </MenuItem>
                {cinemas.map((cinema) => (
                  <MenuItem key={cinema._id} value={cinema._id}>
                    {cinema.nom} - {cinema.ville}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

        {Object.keys(groupedSeances).length === 0 ? (
          <Alert severity="info">
            {selectedCinema 
              ? 'Aucune séance disponible pour ce cinéma à cette date'
              : 'Aucune séance disponible pour cette date'}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Séances reçues: {seances.length}, Séances filtrées: {filteredSeances.length}
              </Typography>
            </Box>
          </Alert>
        ) : (
          Object.entries(groupedSeances).map(([cinemaId, { cinema, salles: sallesMap }]) => (
            <Card 
              key={cinemaId} 
              className="mb-4"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 215, 0, 0.3)',
                },
              }}
            >
              <CardContent sx={{ backgroundColor: 'transparent' }}>
                <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Typography variant="h5" sx={{ mb: 1, color: '#FFD700', fontWeight: 'bold' }}>
                    <LocationOn className="mr-2" />
                    {cinema.nom}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#CCCCCC', ml: 4 }}>
                    {cinema.adresse}, {cinema.codePostal} {cinema.ville}
                    {cinema.telephone && ` • ${cinema.telephone}`}
                  </Typography>
                </Box>
                
                {Object.entries(sallesMap).map(([salleId, { salle, seances: seancesSalle }]) => (
                  <Box key={salleId} sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: '#FFFFFF' }}>
                      <Room className="mr-2" /> 
                      Salle {salle?.nom || 'Inconnue'}
                      {salle?.type && (
                        <Chip
                          label={salle.type.toUpperCase()}
                          size="small"
                          sx={{ ml: 2, backgroundColor: 'rgba(255, 215, 0, 0.2)', color: '#FFD700' }}
                        />
                      )}
                    </Typography>
                    <Box className="flex flex-wrap gap-2">
                      {seancesSalle.map((seance) => (
                        <Button
                          key={seance._id}
                          variant="outlined"
                          component={Link}
                          to={`/reservation/${seance._id}`}
                          sx={{
                            mb: 1,
                            borderColor: seance.placesDisponibles === 0 
                              ? 'rgba(255, 0, 0, 0.3)' 
                              : 'rgba(255, 215, 0, 0.3)',
                            color: seance.placesDisponibles === 0 ? '#FF6B6B' : '#FFD700',
                            '&:hover': {
                              borderColor: seance.placesDisponibles === 0 
                                ? 'rgba(255, 0, 0, 0.5)' 
                                : 'rgba(255, 215, 0, 0.5)',
                              backgroundColor: seance.placesDisponibles === 0 
                                ? 'rgba(255, 0, 0, 0.1)' 
                                : 'rgba(255, 215, 0, 0.1)',
                            },
                          }}
                          disabled={seance.placesDisponibles === 0}
                        >
                          <AccessTime sx={{ mr: 0.5, fontSize: 18 }} />
                          {seance.heure}
                          <Euro sx={{ ml: 0.5, mr: 0.5, fontSize: 18 }} />
                          {seance.prix}€
                          {seance.placesDisponibles === 0 && ' (Complet)'}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ))
        )}
        </Box>
      </Container>
    </Box>
  );
};

export default FilmDetail;


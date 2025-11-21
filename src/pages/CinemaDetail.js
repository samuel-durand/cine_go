import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Grid,
  Chip,
  Alert,
  TextField,
  Button,
  MenuItem
} from '@mui/material';
import { LocationOn, Phone, Email, AccessTime, Room, Euro, Movie, CalendarToday } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const CinemaDetail = () => {
  const { id } = useParams();
  const [cinema, setCinema] = useState(null);
  const [salles, setSalles] = useState([]);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFilm, setSelectedFilm] = useState('');

  const fetchCinema = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/cinemas/${id}`);
      setCinema(response.data);
      setSalles(response.data.salles || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du cinéma:', error);
      setLoading(false);
    }
  }, [id]);

  const fetchSeances = useCallback(async () => {
    try {
      const params = { date: selectedDate };
      if (selectedFilm) {
        params.filmId = selectedFilm;
      }
      const response = await axios.get(`${API_URL}/seances`, { params });
      
      // Filtrer les séances pour ce cinéma uniquement
      const cinemaSeances = response.data.filter(
        seance => seance.salle?.cinema?._id === id
      );
      setSeances(cinemaSeances);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    }
  }, [id, selectedDate, selectedFilm]);

  useEffect(() => {
    fetchCinema();
  }, [fetchCinema]);

  useEffect(() => {
    if (cinema) {
      fetchSeances();
    }
  }, [fetchSeances, cinema]);

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

  if (!cinema) {
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
            Cinéma non trouvé
          </Alert>
        </Container>
      </Box>
    );
  }

  // Extraire les films uniques depuis les séances
  const filmsMap = new Map();
  seances.forEach(seance => {
    const film = seance.film;
    if (film && !filmsMap.has(film._id)) {
      filmsMap.set(film._id, film);
    }
  });
  const availableFilms = Array.from(filmsMap.values());

  // Grouper les séances par film, puis par salle
  const groupedSeances = seances.reduce((acc, seance) => {
    const film = seance.film;
    const salle = seance.salle;
    
    if (!film || !salle) return acc;
    
    const filmId = film._id;
    const salleId = salle._id;
    
    if (!acc[filmId]) {
      acc[filmId] = {
        film: film,
        salles: {}
      };
    }
    
    if (!acc[filmId].salles[salleId]) {
      acc[filmId].salles[salleId] = {
        salle: salle,
        seances: []
      };
    }
    
    acc[filmId].salles[salleId].seances.push(seance);
    return acc;
  }, {});

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Informations du cinéma */}
        <Card
          sx={{
            mb: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ backgroundColor: 'transparent', p: 4 }}>
            <Grid container spacing={4}>
              {cinema.image && (
                <Grid item xs={12} md={4}>
                  <img
                    src={cinema.image.startsWith('/') ? `${API_URL}${cinema.image}` : cinema.image}
                    alt={cinema.nom}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      maxHeight: '300px',
                      objectFit: 'cover',
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={cinema.image ? 8 : 12}>
                <Typography variant="h3" component="h1" sx={{ mb: 2, color: '#FFD700', fontWeight: 'bold' }}>
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {cinema.nom}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ color: '#CCCCCC', mb: 1 }}>
                    {cinema.adresse}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                    {cinema.codePostal} {cinema.ville}
                  </Typography>
                </Box>

                {cinema.telephone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ fontSize: 20, color: '#FFD700', mr: 1 }} />
                    <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                      {cinema.telephone}
                    </Typography>
                  </Box>
                )}

                {cinema.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email sx={{ fontSize: 20, color: '#FFD700', mr: 1 }} />
                    <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                      {cinema.email}
                    </Typography>
                  </Box>
                )}

                {cinema.description && (
                  <Typography variant="body1" sx={{ color: '#CCCCCC', mt: 2 }}>
                    {cinema.description}
                  </Typography>
                )}

                {salles.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ color: '#FFD700', mb: 1 }}>
                      {salles.length} salle{salles.length > 1 ? 's' : ''} disponible{salles.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Filtres et séances */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              fontWeight: 700,
              color: '#FFD700',
            }}
          >
            Films à l'affiche
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
            {availableFilms.length > 0 && (
              <TextField
                select
                label="Filtrer par film"
                value={selectedFilm}
                onChange={(e) => setSelectedFilm(e.target.value)}
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
                  <em>Tous les films ({availableFilms.length})</em>
                </MenuItem>
                {availableFilms.map((film) => (
                  <MenuItem key={film._id} value={film._id}>
                    {film.titre}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {Object.keys(groupedSeances).length === 0 ? (
            <Alert severity="info">
              {selectedFilm 
                ? 'Aucune séance disponible pour ce film à cette date'
                : 'Aucune séance disponible pour cette date'}
            </Alert>
          ) : (
            Object.entries(groupedSeances).map(([filmId, { film, salles: sallesMap }]) => (
              <Card
                key={filmId}
                sx={{
                  mb: 4,
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
                <CardContent sx={{ backgroundColor: 'transparent', p: 3 }}>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={3}>
                      {film.image ? (
                        <img
                          src={film.image.startsWith('/') ? `${API_URL}${film.image}` : film.image}
                          alt={film.titre}
                          style={{
                            width: '100%',
                            borderRadius: '12px',
                            maxHeight: '200px',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                          }}
                        >
                          <Movie sx={{ fontSize: 60, color: '#666666' }} />
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={9}>
                      <Typography variant="h5" sx={{ mb: 1, color: '#FFFFFF', fontWeight: 'bold' }}>
                        {film.titre}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip label={film.genre} size="small" sx={{ mr: 1 }} />
                        <Chip label={`${film.duree} min`} size="small" />
                      </Box>
                      <Button
                        component={Link}
                        to={`/films/${film._id}`}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: 'rgba(255, 215, 0, 0.3)',
                          color: '#FFD700',
                          '&:hover': {
                            borderColor: '#FFD700',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                          },
                        }}
                      >
                        Voir les détails
                      </Button>
                    </Grid>
                  </Grid>

                  {Object.entries(sallesMap).map(([salleId, { salle, seances: seancesSalle }]) => (
                    <Box key={salleId} sx={{ mb: 3, pl: 2, borderLeft: '2px solid rgba(255, 215, 0, 0.3)' }}>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFFFFF' }}>
                        <Room sx={{ mr: 1, verticalAlign: 'middle' }} />
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

export default CinemaDetail;


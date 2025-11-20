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
  Button,
  Grid,
  Chip,
  Alert,
  TextField
} from '@mui/material';
import { AccessTime, Room, Euro } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const FilmDetail = () => {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchFilm = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/films/${id}`);
      setFilm(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du film:', error);
      setLoading(false);
    }
  }, [id]);

  const fetchSeances = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/seances`, {
        params: { filmId: id, date: selectedDate }
      });
      setSeances(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    fetchFilm();
    fetchSeances();
  }, [fetchFilm, fetchSeances]);

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

  const groupedSeances = seances.reduce((acc, seance) => {
    const key = seance.salle?._id || seance.salle || 'unknown';
    if (!acc[key]) acc[key] = { salle: seance.salle, seances: [] };
    acc[key].seances.push(seance);
    return acc;
  }, {});

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
                src={film.image}
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
              <Chip label={`Note: ${film.note}/10`} />
            </Box>

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

          <Box sx={{ mb: 4 }}>
            <TextField
              type="date"
              label="Sélectionner une date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
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
          </Box>

        {Object.keys(groupedSeances).length === 0 ? (
          <Alert severity="info">
            Aucune séance disponible pour cette date
          </Alert>
        ) : (
          Object.entries(groupedSeances).map(([key, { salle, seances: seancesSalle }]) => (
            <Card 
              key={key} 
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
                <Typography variant="h6" className="mb-3 font-semibold">
                  <Room className="mr-2" /> 
                  {salle?.nom || 'Salle inconnue'}
                  {salle?.type && (
                    <Chip
                      label={salle.type}
                      size="small"
                      className="ml-2"
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
                      className="mr-2 mb-2"
                      disabled={seance.placesDisponibles === 0}
                    >
                      <AccessTime className="mr-1" />
                      {seance.heure}
                      <Euro className="ml-1" />
                      {seance.prix}
                      {seance.placesDisponibles === 0 && ' (Complet)'}
                    </Button>
                  ))}
                </Box>
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


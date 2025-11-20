import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  Alert,
  Button
} from '@mui/material';
import { History as HistoryIcon, Movie, AccessTime, Room, Euro, ConfirmationNumber } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const History = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API_URL}/reservations/my-reservations`);
      setReservations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'confirmee':
        return 'success';
      case 'annulee':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'confirmee':
        return 'Confirmée';
      case 'annulee':
        return 'Annulée';
      default:
        return 'En attente';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 4,
            fontWeight: 700,
            color: '#FFD700',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <HistoryIcon />
          Historique des réservations
        </Typography>

      {reservations.length === 0 ? (
        <Alert severity="info">
          Vous n'avez aucune réservation pour le moment.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {reservations.map((reservation) => (
            <Grid item xs={12} key={reservation._id}>
              <Card
                sx={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Movie sx={{ color: '#FFD700' }} />
                        {reservation.seance?.film?.titre || 'Film'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#CCCCCC',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <AccessTime sx={{ color: '#FFD700' }} />
                          {new Date(reservation.seance?.date).toLocaleDateString('fr-FR')} à {reservation.seance?.heure}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#CCCCCC',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Room sx={{ color: '#FFD700' }} />
                          {reservation.seance?.salle?.nom || `Salle ${reservation.seance?.salle || 'N/A'}`}
                          {reservation.seance?.salle?.type && ` - ${reservation.seance.salle.type.toUpperCase()}`}
                        </Typography>
                        {reservation.sieges?.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {reservation.sieges.map((seat) => (
                              <Chip
                                key={seat.seatId}
                                label={seat.label}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                  color: '#FFD700',
                                  border: '1px solid rgba(255, 215, 0, 0.3)',
                                }}
                              />
                            ))}
                          </Box>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#FFD700',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Euro sx={{ color: '#FFD700' }} />
                          {reservation.prixTotal} € ({reservation.nombrePlaces} place{reservation.nombrePlaces > 1 ? 's' : ''})
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={getStatusLabel(reservation.statut)}
                        color={getStatusColor(reservation.statut)}
                        sx={{ mb: 2, fontWeight: 600 }}
                      />
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: '#CCCCCC', mb: 2 }}
                      >
                        {new Date(reservation.dateReservation).toLocaleDateString('fr-FR')}
                      </Typography>
                      {reservation.statut === 'confirmee' && (
                        <Button
                          component={Link}
                          to={`/ticket/${reservation._id}`}
                          variant="outlined"
                          size="small"
                          startIcon={<ConfirmationNumber />}
                          sx={{
                            borderColor: '#FFD700',
                            color: '#FFD700',
                            '&:hover': {
                              borderColor: '#FFD700',
                              backgroundColor: 'rgba(255, 215, 0, 0.1)',
                            },
                          }}
                        >
                          Voir le billet
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      </Container>
    </Box>
  );
};

export default History;


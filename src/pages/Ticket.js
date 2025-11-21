import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { QRCode } from 'react-qr-code';
import { Download, Print, ArrowBack, Movie, AccessTime, Room, ConfirmationNumber } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Ticket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservation = useCallback(async () => {
    try {
      // Utiliser la route tickets pour récupérer le billet
      const response = await axios.get(`${API_URL}/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setReservation(response.data);
      setLoading(false);
    } catch (err) {
      setError('Billet non trouvé ou accès refusé.');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  // Générer le contenu du QR code (ID de réservation + vérification)
  const qrCodeValue = reservation
    ? JSON.stringify({
        reservationId: reservation._id,
        userId: reservation.user?._id || reservation.user,
        seanceId: reservation.seance?._id || reservation.seance,
        date: reservation.dateReservation,
      })
    : '';

  if (loading) {
    return (
      <Container maxWidth="md" className="py-8">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !reservation) {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert severity="error">{error || 'Billet non trouvé'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/history')}
          className="mt-4"
        >
          Retour à l'historique
        </Button>
      </Container>
    );
  }

  const seance = reservation.seance;
  const film = seance?.film;

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', paddingY: 4 }}>
      <Container maxWidth="md">
        <Box className="mb-4 flex justify-between items-center" sx={{ marginBottom: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/history')}
            variant="outlined"
            sx={{
              color: '#FFD700',
              borderColor: 'rgba(255, 215, 0, 0.5)',
              '&:hover': {
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            Retour
          </Button>
          <Box className="flex gap-2">
            <Button
              startIcon={<Download />}
              onClick={handleDownload}
              variant="outlined"
              sx={{
                color: '#FFD700',
                borderColor: 'rgba(255, 215, 0, 0.5)',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                },
              }}
            >
              Télécharger
            </Button>
            <Button
              startIcon={<Print />}
              onClick={handlePrint}
              variant="contained"
              sx={{
                backgroundColor: '#FFD700',
                color: '#000000',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#FFA500',
                },
              }}
            >
              Imprimer
            </Button>
          </Box>
        </Box>

        <Card
          className="p-6 print:p-4"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            color: '#FFFFFF',
            '@media print': {
              background: 'white',
              color: 'black',
              boxShadow: 'none',
              border: 'none',
            },
          }}
        >
          <CardContent sx={{ backgroundColor: 'transparent' }}>
            {/* En-tête */}
            <Box className="text-center mb-6">
              <Typography 
                variant="h4" 
                className="font-bold mb-2"
                sx={{ 
                  color: '#FFD700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Movie sx={{ color: '#FFD700' }} />
                Ciné Go
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#CCCCCC',
                  opacity: 0.9,
                }}
              >
                Billet d'entrée
              </Typography>
            </Box>

            <Divider sx={{ my: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Informations du film */}
            <Grid container spacing={3} sx={{ marginBottom: 4 }}>
              <Grid item xs={12} md={8}>
                <Typography 
                  variant="h5" 
                  className="font-bold mb-3"
                  sx={{ 
                    color: '#FFFFFF',
                    marginBottom: 3,
                  }}
                >
                  {film?.titre || 'Film'}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box className="flex items-center" sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ color: '#FFD700', marginRight: 1 }} />
                    <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                      {seance?.date
                        ? new Date(seance.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : ''}{' '}
                      à {seance?.heure}
                    </Typography>
                  </Box>

                  <Box className="flex items-center" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Room sx={{ color: '#FFD700', marginRight: 1 }} />
                    <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                      {seance?.salle?.nom || 'Salle'} - {seance?.salle?.type?.toUpperCase() || 'CLASSIC'}
                      {seance?.salle?.cinema && (
                        <span> • {seance.salle.cinema.nom}</span>
                      )}
                    </Typography>
                  </Box>

                  <Box className="flex items-center" sx={{ display: 'flex', alignItems: 'center' }}>
                    <ConfirmationNumber sx={{ color: '#FFD700', marginRight: 1 }} />
                    <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                      Réservation #{reservation._id.slice(-8).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box 
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <QRCode
                    value={qrCodeValue}
                    size={150}
                    level="H"
                    style={{ marginBottom: 8 }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ 
                      color: '#CCCCCC',
                      textAlign: 'center',
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    Code de vérification
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Sièges réservés */}
            {reservation.sieges && reservation.sieges.length > 0 ? (
              <Box sx={{ marginBottom: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    marginBottom: 2,
                    fontWeight: 600,
                    color: '#FFFFFF',
                  }}
                >
                  Sièges réservés ({reservation.sieges.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {reservation.sieges.map((siege, index) => (
                    <Chip
                      key={index}
                      label={siege.label || `${siege.row}${siege.number}`}
                      sx={{
                        backgroundColor: 'rgba(255, 215, 0, 0.15)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        color: '#FFD700',
                        fontWeight: 'bold',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ marginBottom: 4 }}>
                <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                  Nombre de places: {reservation.nombrePlaces}
                </Typography>
              </Box>
            )}

            {/* Informations de paiement */}
            <Box 
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: 3,
                marginBottom: 4,
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC', opacity: 0.8 }}>
                    Prix unitaire
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFD700' }}>
                    {seance?.prix || 0} €
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: '#CCCCCC', opacity: 0.8 }}>
                    Total payé
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFD700' }}>
                    {reservation.prixTotal} €
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Statut */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#CCCCCC', opacity: 0.8, marginBottom: 1 }}>
                  Statut
                </Typography>
                <Chip
                  label={
                    reservation.statut === 'confirmee'
                      ? 'Confirmée'
                      : reservation.statut === 'annulee'
                      ? 'Annulée'
                      : 'En attente'
                  }
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: reservation.statut === 'confirmee'
                      ? 'rgba(76, 175, 80, 0.2)'
                      : reservation.statut === 'annulee'
                      ? 'rgba(244, 67, 54, 0.2)'
                      : 'rgba(255, 152, 0, 0.2)',
                    color: reservation.statut === 'confirmee'
                      ? '#4CAF50'
                      : reservation.statut === 'annulee'
                      ? '#F44336'
                      : '#FF9800',
                    border: `1px solid ${reservation.statut === 'confirmee'
                      ? 'rgba(76, 175, 80, 0.3)'
                      : reservation.statut === 'annulee'
                      ? 'rgba(244, 67, 54, 0.3)'
                      : 'rgba(255, 152, 0, 0.3)'}`,
                  }}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: '#CCCCCC', opacity: 0.8 }}>
                  Réservé le
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  {new Date(reservation.dateReservation).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </Box>

            {/* Informations utilisateur */}
            <Divider sx={{ my: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Box sx={{ textAlign: 'center', marginBottom: 4 }}>
              <Typography variant="body2" sx={{ color: '#CCCCCC', opacity: 0.8 }}>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" sx={{ color: '#CCCCCC', opacity: 0.7 }}>
                {user?.email}
              </Typography>
            </Box>

            {/* Instructions */}
            <Box 
              sx={{
                marginTop: 6,
                padding: 3,
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '16px',
              }}
            >
              <Typography variant="body2" sx={{ textAlign: 'center', color: '#FFFFFF' }}>
                <strong style={{ color: '#FFD700' }}>Important:</strong> Présentez ce billet à l'entrée de la salle. Le QR code
                sera scanné pour valider votre réservation.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Styles pour l'impression */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .print\\:p-4,
              .print\\:p-4 * {
                visibility: visible;
              }
              .print\\:p-4 {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              button {
                display: none !important;
              }
            }
          `
        }} />
      </Container>
    </Box>
  );
};

export default Ticket;


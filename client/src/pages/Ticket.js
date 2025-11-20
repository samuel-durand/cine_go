import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Container,
  Paper,
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
    <Container maxWidth="md" className="py-8">
      <Box className="mb-4 flex justify-between items-center">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/history')}
          variant="outlined"
        >
          Retour
        </Button>
        <Box className="flex gap-2">
          <Button
            startIcon={<Download />}
            onClick={handleDownload}
            variant="outlined"
          >
            Télécharger
          </Button>
          <Button
            startIcon={<Print />}
            onClick={handlePrint}
            variant="contained"
          >
            Imprimer
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={3}
        className="p-6 print:p-4"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          '@media print': {
            background: 'white',
            color: 'black',
            boxShadow: 'none',
          },
        }}
      >
        {/* En-tête */}
        <Box className="text-center mb-6">
          <Typography variant="h4" className="font-bold mb-2">
            <Movie className="mr-2" />
            Ciné Go
          </Typography>
          <Typography variant="h6" className="opacity-90">
            Billet d'entrée
          </Typography>
        </Box>

        <Divider className="my-4 bg-white opacity-30" />

        {/* Informations du film */}
        <Grid container spacing={3} className="mb-4">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" className="font-bold mb-3">
              {film?.titre || 'Film'}
            </Typography>

            <Box className="space-y-2">
              <Box className="flex items-center">
                <AccessTime className="mr-2" />
                <Typography variant="body1">
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

              <Box className="flex items-center">
                <Room className="mr-2" />
                <Typography variant="body1">
                  {seance?.salle?.nom || 'Salle'} - {seance?.salle?.type?.toUpperCase() || 'CLASSIC'}
                </Typography>
              </Box>

              <Box className="flex items-center">
                <ConfirmationNumber className="mr-2" />
                <Typography variant="body1">
                  Réservation #{reservation._id.slice(-8).toUpperCase()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box className="bg-white p-3 rounded-lg flex flex-col items-center">
              <QRCode
                value={qrCodeValue}
                size={150}
                level="H"
                className="mb-2"
              />
              <Typography
                variant="caption"
                className="text-gray-600 text-center font-semibold mt-2"
              >
                Code de vérification
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider className="my-4 bg-white opacity-30" />

        {/* Sièges réservés */}
        {reservation.sieges && reservation.sieges.length > 0 ? (
          <Box className="mb-4">
            <Typography variant="h6" className="mb-2 font-semibold">
              Sièges réservés ({reservation.sieges.length})
            </Typography>
            <Box className="flex flex-wrap gap-2">
              {reservation.sieges.map((siege, index) => (
                <Chip
                  key={index}
                  label={siege.label || `${siege.row}${siege.number}`}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Box className="mb-4">
            <Typography variant="body1">
              Nombre de places: {reservation.nombrePlaces}
            </Typography>
          </Box>
        )}

        {/* Informations de paiement */}
        <Box className="bg-white bg-opacity-20 p-4 rounded-lg mb-4">
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" className="opacity-80">
                Prix unitaire
              </Typography>
              <Typography variant="h6" className="font-bold">
                {seance?.prix || 0} €
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" className="opacity-80">
                Total payé
              </Typography>
              <Typography variant="h6" className="font-bold">
                {reservation.prixTotal} €
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Statut */}
        <Box className="flex justify-between items-center">
          <Box>
            <Typography variant="body2" className="opacity-80 mb-1">
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
              color={
                reservation.statut === 'confirmee'
                  ? 'success'
                  : reservation.statut === 'annulee'
                  ? 'error'
                  : 'warning'
              }
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          <Box className="text-right">
            <Typography variant="body2" className="opacity-80">
              Réservé le
            </Typography>
            <Typography variant="body2" className="font-semibold">
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
        <Divider className="my-4 bg-white opacity-30" />
        <Box className="text-center">
          <Typography variant="body2" className="opacity-80">
            {user?.prenom} {user?.nom}
          </Typography>
          <Typography variant="caption" className="opacity-70">
            {user?.email}
          </Typography>
        </Box>

        {/* Instructions */}
        <Box className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg">
          <Typography variant="body2" className="text-center">
            <strong>Important:</strong> Présentez ce billet à l'entrée de la salle. Le QR code
            sera scanné pour valider votre réservation.
          </Typography>
        </Box>
      </Paper>

      {/* Styles pour l'impression */}
      <style jsx global>{`
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
      `}</style>
    </Container>
  );
};

export default Ticket;


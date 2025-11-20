import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Grid,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { AccessTime, Room, CheckCircle } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import SeatMap from '../components/SeatMap';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1f2937',
      fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  }
};

const ReservationContent = () => {
  const { seanceId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [seance, setSeance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nombrePlaces, setNombrePlaces] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState('');
  const [cardError, setCardError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchSeance = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/seances/${seanceId}`);
      setSeance(response.data);
      setSelectedSeats([]);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement de la séance:', err);
      setLoading(false);
    }
  }, [seanceId]);

  useEffect(() => {
    fetchSeance();
  }, [fetchSeance]);

  const handleSeatToggle = (seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.find((item) => item.seatId === seat.seatId);
      if (exists) {
        return prev.filter((item) => item.seatId !== seat.seatId);
      }
      return [...prev, seat];
    });
    setError('');
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    setError('');
    setCardError('');

    if (!stripe || !elements) {
      setError('Le module de paiement n’est pas prêt. Veuillez réessayer.');
      return;
    }

    const hasSeatMap = seance?.plan?.rows?.length > 0;
    const seatsCount = hasSeatMap ? selectedSeats.length : nombrePlaces;

    if (hasSeatMap && selectedSeats.length === 0) {
      setError('Veuillez sélectionner au moins un siège.');
      return;
    }

    if (seatsCount > seance.placesDisponibles) {
      setError('Pas assez de places disponibles.');
      return;
    }

    const seatsPayload = hasSeatMap
      ? selectedSeats.map((seat) => ({
          seatId: seat.seatId,
          label: seat.label,
          row: seat.row,
          number: seat.number,
          type: seat.type,
          priceModifier: seat.priceModifier || 0,
          accessible: seat.accessible || false,
        }))
      : [];

    try {
      setProcessing(true);
      const { data } = await axios.post(`${API_URL}/payments/create-payment-intent`, {
        seanceId: seance._id,
        nombrePlaces: seatsCount,
        seats: seatsPayload,
      });

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Impossible de récupérer le formulaire de carte.');
        setProcessing(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email,
            email: user.email,
          },
        },
      });

      if (stripeError) {
        setCardError(stripeError.message || 'Erreur lors du paiement.');
        setProcessing(false);
        return;
      }

      const reservationResponse = await axios.post(`${API_URL}/reservations`, {
        seanceId: seance._id,
        nombrePlaces: seatsCount,
        seats: seatsPayload,
        paymentIntentId: paymentIntent.id,
      });

      setSuccess(true);
      setTimeout(() => {
        // Rediriger vers la page du billet
        navigate(`/ticket/${reservationResponse.data._id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!seance) {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert severity="error">Séance non trouvée</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" className="py-8">
        <Paper className="p-8 text-center">
          <CheckCircle className="text-green-500 text-6xl mb-4" />
          <Typography variant="h4" className="mb-4 font-bold">
            Réservation confirmée !
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Redirection vers votre historique...
          </Typography>
        </Paper>
      </Container>
    );
  }

  const hasSeatMap = seance?.plan?.rows?.length > 0;
  const reservedSeats = seance?.siegesReserves || [];
  const calculateSeatPrice = (seat) => (seance.prix || 0) + (seat.priceModifier || 0);
  const prixTotal = hasSeatMap
    ? selectedSeats.reduce((total, seat) => total + calculateSeatPrice(seat), 0)
    : seance.prix * nombrePlaces;
  const seatsCount = hasSeatMap ? selectedSeats.length : nombrePlaces;
  const canSubmit = seatsCount > 0;

  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h4" component="h1" className="mb-6 font-bold">
        Réservation
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4 font-semibold">
                {seance.film?.titre || 'Film'}
              </Typography>

              <Box className="mb-4 space-y-2">
                <Box className="flex items-center">
                  <AccessTime className="mr-2 text-gray-600" />
                  <Typography variant="body1">
                    {new Date(seance.date).toLocaleDateString('fr-FR')} à {seance.heure}
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Room className="mr-2 text-gray-600" />
                  <Typography variant="body1">
                    {seance.salle?.nom || `Salle ${seance.salle || 'N/A'}`}
                    {seance.salle?.type && ` - ${seance.salle.type.toUpperCase()}`}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Places disponibles: {seance.placesDisponibles}
                </Typography>
              </Box>

              <form onSubmit={handleReservation}>
                {hasSeatMap ? (
                  <Box className="mb-4">
                    <Typography variant="subtitle1" className="mb-2 font-semibold">
                      Choisissez vos sièges
                    </Typography>
                    <Box 
                      sx={{ 
                        width: '100%',
                        overflow: 'auto',
                        maxHeight: '70vh',
                      }}
                    >
                      <SeatMap
                        plan={seance.plan}
                        reservedSeats={reservedSeats}
                        selectedSeats={selectedSeats}
                        onToggleSeat={handleSeatToggle}
                      />
                    </Box>
                    {selectedSeats.length > 0 && (
                      <Box className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Typography variant="body2" className="mb-2 font-semibold text-green-800">
                          Sièges sélectionnés ({selectedSeats.length}):
                        </Typography>
                        <Box className="flex flex-wrap gap-2">
                          {selectedSeats.map((seat) => (
                            <Chip
                              key={seat.seatId}
                              label={`${seat.label}`}
                              onDelete={() => handleSeatToggle(seat)}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" className="mt-2 block text-green-700">
                          Vous pouvez sélectionner des sièges séparés en cliquant sur plusieurs sièges libres.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    label="Nombre de places"
                    type="number"
                    value={nombrePlaces}
                    onChange={(e) => {
                      const value = Math.max(
                        1,
                        Math.min(seance.placesDisponibles, parseInt(e.target.value, 10) || 1)
                      );
                      setNombrePlaces(value);
                    }}
                    inputProps={{ min: 1, max: seance.placesDisponibles }}
                    className="mb-4"
                    required
                  />
                )}

                <Box className="mb-4 p-4 border rounded-lg">
                  <Typography variant="subtitle1" className="mb-2 font-semibold">
                    Informations de paiement
                  </Typography>
                  <CardElement options={CARD_ELEMENT_OPTIONS} onChange={(event) => setCardError(event.error?.message || '')} />
                </Box>

                {cardError && (
                  <Alert severity="error" className="mb-4">
                    {cardError}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!canSubmit || seance.placesDisponibles === 0 || processing}
                >
                  {processing ? 'Traitement en cours...' : 'Payer et confirmer'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" className="mb-4 font-semibold">
                Récapitulatif
              </Typography>
              <Box className="space-y-3 mb-4">
                {hasSeatMap ? (
                  <>
                    <Typography variant="body2" className="font-semibold">
                      Sièges sélectionnés
                    </Typography>
                    {selectedSeats.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        Sélectionnez vos sièges pour continuer.
                      </Typography>
                    ) : (
                      <Box className="flex flex-wrap gap-1">
                        {selectedSeats.map((seat) => (
                          <Chip
                            key={seat.seatId}
                            label={`${seat.label} • ${calculateSeatPrice(seat)} €`}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <Box className="flex justify-between">
                      <Typography variant="body2">Prix unitaire:</Typography>
                      <Typography variant="body2" className="font-semibold">
                        {seance.prix} €
                      </Typography>
                    </Box>
                    <Box className="flex justify-between">
                      <Typography variant="body2">Nombre de places:</Typography>
                      <Typography variant="body2" className="font-semibold">
                        {nombrePlaces}
                      </Typography>
                    </Box>
                  </>
                )}
                <Box className="border-t pt-2 mt-2">
                  <Box className="flex justify-between">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" className="font-bold text-blue-600">
                      {prixTotal} €
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider className="my-4" />
              <Typography variant="body2" color="textSecondary">
                Les paiements sont sécurisés via Stripe. Aucune information bancaire n’est stockée sur nos serveurs.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

const Reservation = () => {
  if (!stripePromise) {
    return (
      <Container maxWidth="sm" className="py-16">
        <Alert severity="warning">
          La clé publique Stripe n&rsquo;est pas configurée. Ajoutez <code>VITE_STRIPE_PUBLIC_KEY</code> à votre environnement.
        </Alert>
      </Container>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <ReservationContent />
    </Elements>
  );
};

export default Reservation;


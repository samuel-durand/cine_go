import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Grid, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import { ArrowBack, CheckCircle, CreditCard, Lock, EventSeat, LocationOn, Schedule } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import { formatDayLong, formatDuration, formatPrice, imageUrl, SALLE_LABELS, seanceDay, endTime } from '../utils/format';
import SeatMap from '../components/SeatMap';
import Loader from '../components/common/Loader';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      color: '#ffffff',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      iconColor: '#90caf9',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

const panelSx = { p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: colors.paper, border: `1px solid ${colors.border}` };

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
  const [step, setStep] = useState(1); // 1 : choix des places, 2 : paiement
  const [cardFocused, setCardFocused] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const fetchSeance = useCallback(async () => {
    try {
      const { data } = await api.get(`/seances/${seanceId}`);
      setSeance(data);
      setSelectedSeats([]);
    } catch (err) {
      console.error('Erreur lors du chargement de la séance:', err);
    } finally {
      setLoading(false);
    }
  }, [seanceId]);

  useEffect(() => {
    fetchSeance();
  }, [fetchSeance]);

  const handleSeatToggle = (seat) => {
    setSelectedSeats((prev) =>
      prev.find((item) => item.seatId === seat.seatId) ? prev.filter((item) => item.seatId !== seat.seatId) : [...prev, seat],
    );
    setError('');
  };

  const hasSeatMap = seance?.plan?.rows?.length > 0;
  const seatsCount = hasSeatMap ? selectedSeats.length : nombrePlaces;

  const validateSelection = () => {
    if (hasSeatMap && selectedSeats.length === 0) return 'Veuillez sélectionner au moins un siège.';
    if (seatsCount === 0) return 'Veuillez sélectionner au moins une place.';
    if (seatsCount > seance.placesDisponibles) return 'Pas assez de places disponibles.';
    return '';
  };

  const handleContinueToPayment = () => {
    const message = validateSelection();
    setError(message);
    if (!message) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReservation = async (e) => {
    e.preventDefault();
    setError('');
    setCardError('');

    if (!stripe || !elements) {
      setError('Le module de paiement n’est pas prêt. Veuillez réessayer.');
      return;
    }
    const message = validateSelection();
    if (message) {
      setError(message);
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
      const { data } = await api.post('/payments/create-payment-intent', {
        seanceId: seance._id,
        nombrePlaces: seatsCount,
        seats: seatsPayload,
      });

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Impossible de récupérer le formulaire de carte.');
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
        return;
      }

      const reservationResponse = await api.post('/reservations', {
        seanceId: seance._id,
        nombrePlaces: seatsCount,
        seats: seatsPayload,
        paymentIntentId: paymentIntent.id,
      });

      setSuccess(true);
      setTimeout(() => navigate(`/ticket/${reservationResponse.data._id}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader />;

  if (!seance) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">Séance non trouvée</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Box sx={{ ...panelSx, textAlign: 'center', py: 6 }}>
          <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 1 }}>Réservation confirmée !</Typography>
          <Typography color="text.secondary">Redirection vers votre billet…</Typography>
        </Box>
      </Container>
    );
  }

  const film = seance.film || {};
  const cinema = seance.salle?.cinema;
  const reservedSeats = seance.siegesReserves || [];
  const calculateSeatPrice = (seat) => (seance.prix || 0) + (seat.priceModifier || 0);
  const prixTotal = hasSeatMap
    ? selectedSeats.reduce((total, seat) => total + calculateSeatPrice(seat), 0)
    : seance.prix * nombrePlaces;
  const fin = endTime(seance.heure, film.duree);

  return (
    <Box>
      {/* Bandeau de la séance */}
      <Box sx={{ bgcolor: colors.bgDeep, borderBottom: `1px solid ${colors.border}` }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: 3, display: 'flex', gap: 2.5, alignItems: 'center' }}>
          {film.image && (
            <Box component="img" src={imageUrl(film.image)} alt="" sx={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component={Link}
              to={`/films/${film._id}`}
              variant="h4"
              sx={{ color: '#fff', textDecoration: 'none', fontSize: { xs: '1.3rem', md: '1.6rem' }, '&:hover': { color: 'primary.main' } }}
            >
              {film.titre || 'Film'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, mt: 0.75, color: 'text.secondary', fontSize: '0.92rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule sx={{ fontSize: 17, color: 'primary.main' }} />
                {formatDayLong(seanceDay(seance))} · {seance.heure}{fin && ` – ${fin}`}
              </Box>
              {cinema && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 17, color: 'primary.main' }} />
                  {cinema.nom}
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventSeat sx={{ fontSize: 17, color: 'primary.main' }} />
                {seance.salle?.nom || 'Salle'}
                {seance.salle?.type && seance.salle.type !== 'classic' && ` · ${SALLE_LABELS[seance.salle.type] || seance.salle.type}`}
              </Box>
              {film.duree && <Box>{formatDuration(film.duree)}</Box>}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
        <Stepper activeStep={step - 1} sx={{ maxWidth: 420, mb: 4, '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': { color: 'primary.main' }, '& .MuiStepIcon-text': { fill: '#000', fontWeight: 800 } }}>
          <Step><StepLabel>Places</StepLabel></Step>
          <Step><StepLabel>Paiement</StepLabel></Step>
        </Stepper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8} lg={hasSeatMap && step === 1 ? 9 : 8}>
            <Box sx={panelSx}>
              {step === 1 ? (
                <>
                  {hasSeatMap ? (
                    <>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>Choisissez vos places</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {seance.placesDisponibles} places disponibles · cliquez sur les sièges libres
                      </Typography>
                      <SeatMap
                        plan={seance.plan}
                        reservedSeats={reservedSeats}
                        selectedSeats={selectedSeats}
                        onToggleSeat={handleSeatToggle}
                      />
                    </>
                  ) : (
                    <>
                      <Typography variant="h5" sx={{ mb: 2 }}>Nombre de places</Typography>
                      <TextField
                        fullWidth
                        label="Nombre de places"
                        type="number"
                        value={nombrePlaces}
                        onChange={(e) =>
                          setNombrePlaces(Math.max(1, Math.min(seance.placesDisponibles, parseInt(e.target.value, 10) || 1)))
                        }
                        inputProps={{ min: 1, max: seance.placesDisponibles }}
                        helperText={`${seance.placesDisponibles} places disponibles`}
                      />
                    </>
                  )}

                  {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
                </>
              ) : (
                <Box component="form" id="payment-form" onSubmit={handleReservation}>
                  <Typography variant="h5" sx={{ mb: 3 }}>Paiement</Typography>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: cardError
                        ? '1px solid rgba(239, 68, 68, 0.7)'
                        : cardFocused
                          ? '1px solid rgba(144, 202, 249, 0.8)'
                          : `1px solid ${colors.border}`,
                      boxShadow: cardFocused ? '0 0 0 3px rgba(144, 202, 249, 0.15)' : 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditCard sx={{ color: '#90caf9' }} />
                        <Typography fontWeight={700}>Carte bancaire</Typography>
                      </Box>
                      {cardComplete && <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />}
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'rgba(0, 0, 0, 0.25)', border: `1px solid ${colors.border}` }}>
                      <CardElement
                        options={CARD_ELEMENT_OPTIONS}
                        onFocus={() => setCardFocused(true)}
                        onBlur={() => setCardFocused(false)}
                        onChange={(event) => {
                          setCardError(event.error?.message || '');
                          setCardComplete(event.complete);
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                      <Lock sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Paiement chiffré et sécurisé par Stripe. Aucune donnée bancaire n'est stockée sur nos serveurs.
                      </Typography>
                    </Box>
                  </Box>

                  {cardError && <Alert severity="error" sx={{ mt: 2 }}>{cardError}</Alert>}
                  {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Récapitulatif */}
          <Grid item xs={12} md={4} lg={hasSeatMap && step === 1 ? 3 : 4}>
            <Box sx={{ ...panelSx, position: { md: 'sticky' }, top: { md: 92 } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Récapitulatif</Typography>

              {hasSeatMap ? (
                selectedSeats.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Aucun siège sélectionné.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {selectedSeats.map((seat) => (
                      <Chip
                        key={seat.seatId}
                        label={`${seat.label} · ${formatPrice(calculateSeatPrice(seat))}`}
                        onDelete={step === 1 ? () => handleSeatToggle(seat) : undefined}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{nombrePlaces} × {formatPrice(seance.prix)}</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 3, pt: 2, borderTop: `1px solid ${colors.border}` }}>
                <Typography fontWeight={700}>Total</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: 'primary.main' }}>{formatPrice(prixTotal)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {seatsCount} place{seatsCount > 1 ? 's' : ''}
              </Typography>

              {step === 1 ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleContinueToPayment}
                  disabled={seatsCount === 0 || seance.placesDisponibles === 0}
                  sx={{ mt: 3 }}
                >
                  Continuer
                </Button>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
                  <Button
                    type="submit"
                    form="payment-form"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={processing || !cardComplete}
                    startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <Lock />}
                  >
                    {processing ? 'Traitement en cours…' : `Payer ${formatPrice(prixTotal)}`}
                  </Button>
                  <Button fullWidth onClick={() => setStep(1)} disabled={processing} startIcon={<ArrowBack />} sx={{ color: 'text.secondary' }}>
                    Modifier mes places
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const Reservation = () => {
  if (!stripePromise) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
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

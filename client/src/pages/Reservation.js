import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Container, IconButton, TextField, Typography } from '@mui/material';
import { Accessible, ArrowBack, CheckCircle, ChevronRight, Close, CreditCard, Home, Lock, Movie } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { colors, headingFont } from '../theme';
import { endTime, formatDayLong, formatPrice, imageUrl, SALLE_LABELS, seanceDay } from '../utils/format';
import SeatMap, { SeatLegend, isPmr } from '../components/SeatMap';
import Loader from '../components/common/Loader';
import SeancePickerPanel from '../components/seances/SeancePickerPanel';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const MAX_PLACES = 10;
const SIDEBAR_WIDTH = 340;

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      color: '#ffffff',
      fontFamily: '"Heebo", "Helvetica Neue", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      iconColor: '#90caf9',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

const formatLabel = (salle) => (salle?.type && salle.type !== 'classic' ? SALLE_LABELS[salle.type] || salle.type : '');

// Ligne cliquable de la colonne de gauche (Cinéma / Date / Séance)
const InfoRow = ({ label, onClick, dimmed, children }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      width: '100%',
      textAlign: 'left',
      px: 2,
      py: 2,
      border: 0,
      borderTop: `1px solid ${colors.border}`,
      bgcolor: 'transparent',
      color: '#fff',
      fontFamily: 'inherit',
      cursor: 'pointer',
      opacity: dimmed ? 0.35 : 1,
      transition: 'opacity 0.2s ease',
      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ color: colors.textMuted, mb: 0.25 }}>{label}</Typography>
      {children}
    </Box>
    <ChevronRight />
  </Box>
);

// Colonne de gauche : film, cinéma, date et séance
const SeanceSidebar = ({ seance, hasPmr, onChangeSeance }) => {
  const [panel, setPanel] = useState(null); // null | 'cinema' | 'date' | 'seance'
  const film = seance.film || {};
  const cinema = seance.salle?.cinema;
  const fin = endTime(seance.heure, film.duree);
  const visuel = imageUrl(film.backdrop || film.image);

  return (
    <Box
      component="aside"
      sx={{
        width: { md: SIDEBAR_WIDTH },
        flexShrink: 0,
        bgcolor: colors.bgDeep,
        borderRight: { md: `1px solid ${colors.border}` },
        position: { md: 'sticky' },
        top: 0,
        height: { md: '100vh' },
        overflowY: { md: 'auto' },
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden', px: 2, pt: 2, pb: 3, textAlign: 'center' }}>
        {visuel && (
          <Box sx={{ position: 'absolute', inset: -30, backgroundImage: `url(${visuel})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(18px) brightness(0.45)' }} />
        )}
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(10,10,14,0.2) 0%, ${colors.bgDeep} 100%)` }} />
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton component={Link} to="/" aria-label="Accueil" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <Home />
            </IconButton>
            <Typography sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>
              CINÉ <Box component="span" sx={{ color: 'primary.main' }}>GO</Box>
            </Typography>
            <Box sx={{ width: 40 }} />
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'block' }, alignItems: 'center', gap: 2, mt: { xs: 2, md: 3 }, textAlign: { xs: 'left', md: 'center' } }}>
            <Box sx={{ width: { xs: 64, md: 140 }, aspectRatio: '2 / 3', mx: { md: 'auto' }, flexShrink: 0, borderRadius: '6px', overflow: 'hidden', bgcolor: colors.paper, boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
              {film.image ? (
                <Box component="img" src={imageUrl(film.image)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Movie sx={{ color: '#3a3b45' }} /></Box>
              )}
            </Box>
            <Box sx={{ minWidth: 0, mt: { md: 2.5 } }}>
              <Typography noWrap title={film.titre} sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.6rem' }, lineHeight: 1.15 }}>
                {film.titre}
              </Typography>
              <Typography sx={{ color: colors.textMuted }}>{cinema?.nom}</Typography>
              {/* Mobile : la séance sous le titre */}
              <Typography variant="body2" sx={{ display: { md: 'none' }, color: colors.textMuted }}>
                {formatDayLong(seanceDay(seance))} · {seance.heure}{fin ? ` – fin ${fin}` : ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { md: 'center' }, mt: 1.5 }}>
                <Button
                  component={Link}
                  to="/films"
                  size="small"
                  sx={{ borderRadius: 999, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                  Changer de film
                </Button>
                <Button
                  size="small"
                  onClick={() => setPanel('date')}
                  sx={{ display: { md: 'none' }, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                  Changer de séance
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <InfoRow label="Cinéma" onClick={() => setPanel('cinema')} dimmed={panel && panel !== 'cinema'}>
          <Typography sx={{ fontSize: '1.2rem' }} noWrap>{cinema?.nom || '—'}</Typography>
        </InfoRow>
        <InfoRow label="Date" onClick={() => setPanel('date')} dimmed={panel && panel !== 'date'}>
          <Typography sx={{ fontSize: '1.2rem' }}>{formatDayLong(seanceDay(seance))}</Typography>
        </InfoRow>
        <InfoRow label="Séance" onClick={() => setPanel('seance')} dimmed={panel && panel !== 'seance'}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 500 }}>{seance.heure}</Typography>
            {formatLabel(seance.salle) && <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatLabel(seance.salle)}</Typography>}
          </Box>
          {hasPmr && <Accessible sx={{ fontSize: 20, mt: 0.5 }} />}
          {fin && <Typography variant="body2" sx={{ color: colors.textMuted }}>Fin prévue à {fin}</Typography>}
        </InfoRow>
      </Box>

      <SeancePickerPanel
        open={Boolean(panel)}
        mode={panel || 'date'}
        onModeChange={setPanel}
        seance={seance}
        sidebarWidth={SIDEBAR_WIDTH}
        onClose={() => setPanel(null)}
        onSelect={(id) => {
          setPanel(null);
          if (id !== seance._id) onChangeSeance(id);
        }}
      />
    </Box>
  );
};

// Barre d'action fixe en bas de la zone principale
const ActionBar = ({ info, children }) => (
  <Box
    sx={{
      position: 'fixed',
      left: { xs: 0, md: SIDEBAR_WIDTH },
      right: 0,
      bottom: 0,
      zIndex: 10,
      bgcolor: 'rgba(10,10,14,0.97)',
      backdropFilter: 'blur(12px)',
      borderTop: `1px solid ${colors.border}`,
      px: { xs: 2, md: 4 },
      py: 1.75,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
    }}
  >
    <Box sx={{ minWidth: 0 }}>{info}</Box>
    {children}
  </Box>
);

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
  const [step, setStep] = useState(1);
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
    setStep(1);
    setError('');
    fetchSeance();
  }, [fetchSeance]);

  const handleSeatToggle = (seat) => {
    setError('');
    setSelectedSeats((prev) => {
      if (prev.find((s) => s.seatId === seat.seatId)) return prev.filter((s) => s.seatId !== seat.seatId);
      if (prev.length >= MAX_PLACES) {
        setError(`Vous pouvez sélectionner ${MAX_PLACES} places maximum par commande.`);
        return prev;
      }
      return [...prev, seat];
    });
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
      // Un siège a pu être pris entre-temps : on rafraîchit le plan
      if (err.response?.status === 409 || /plus disponible/.test(err.response?.data?.message || '')) fetchSeance();
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader minHeight="100vh" />;

  if (!seance) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">Séance non trouvée</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 14, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h2" sx={{ mb: 1 }}>Réservation confirmée !</Typography>
        <Typography color="text.secondary">Redirection vers votre billet…</Typography>
      </Container>
    );
  }

  const allSeats = (seance.plan?.rows || []).flatMap((r) => r.seats || []);
  const hasPmr = allSeats.some(isPmr);
  const calculateSeatPrice = (seat) => (seance.prix || 0) + (seat.priceModifier || 0);
  const prixTotal = hasSeatMap
    ? selectedSeats.reduce((total, seat) => total + calculateSeatPrice(seat), 0)
    : seance.prix * nombrePlaces;

  const selectionInfo = (
    <>
      <Typography sx={{ fontWeight: 700 }}>
        {seatsCount === 0 ? 'Aucune place sélectionnée' : `${seatsCount} place${seatsCount > 1 ? 's' : ''} · ${formatPrice(prixTotal)}`}
      </Typography>
      {hasSeatMap && selectedSeats.length > 0 && (
        <Box className="no-scrollbar" sx={{ display: 'flex', gap: 0.75, mt: 0.5, overflowX: 'auto', maxWidth: { xs: '52vw', md: 'none' } }}>
          {selectedSeats.map((seat) => (
            <Box
              key={seat.seatId}
              component="button"
              type="button"
              onClick={() => step === 1 && handleSeatToggle(seat)}
              aria-label={`Retirer ${seat.label}`}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, flexShrink: 0, px: 1, py: 0.25, borderRadius: '4px', border: 0, bgcolor: 'rgba(52,211,153,0.15)', color: '#34d399', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, cursor: step === 1 ? 'pointer' : 'default' }}
            >
              {seat.label}
              {step === 1 && <Close sx={{ fontSize: 13 }} />}
            </Box>
          ))}
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100vh' }}>
      <SeanceSidebar seance={seance} hasPmr={hasPmr} onChangeSeance={(id) => navigate(`/reservation/${id}`)} />

      <Box component="section" sx={{ flex: 1, minWidth: 0, px: { xs: 2, md: 3 }, pt: 2, pb: 14 }}>
        {step === 1 ? (
          <>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
              {seance.salle?.nom}
              {hasPmr && <Accessible sx={{ fontSize: 20 }} />}
            </Typography>
            <Typography variant="h2" sx={{ textAlign: 'center', fontSize: { xs: '2rem', md: '2.6rem' }, mt: 1 }}>
              Sélectionnez vos places
            </Typography>
            <Typography sx={{ textAlign: 'center', color: colors.textMuted, mb: 3 }}>
              {seance.placesDisponibles} places libres
            </Typography>

            <Box sx={{ p: { xs: 2, md: 4 }, borderRadius: '12px', bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
              {hasSeatMap ? (
                <SeatMap plan={seance.plan} reservedSeats={seance.siegesReserves || []} selectedSeats={selectedSeats} onToggleSeat={handleSeatToggle} />
              ) : (
                <Box sx={{ maxWidth: 320, mx: 'auto' }}>
                  <TextField
                    fullWidth
                    label="Nombre de places"
                    type="number"
                    value={nombrePlaces}
                    onChange={(e) => setNombrePlaces(Math.max(1, Math.min(seance.placesDisponibles, MAX_PLACES, parseInt(e.target.value, 10) || 1)))}
                    inputProps={{ min: 1, max: Math.min(seance.placesDisponibles, MAX_PLACES) }}
                  />
                </Box>
              )}
            </Box>

            {error && <Alert severity="error" sx={{ mt: 3, maxWidth: 560, mx: 'auto' }}>{error}</Alert>}

            {hasSeatMap && (
              <Box sx={{ mt: 3 }}>
                <SeatLegend />
              </Box>
            )}

            <ActionBar info={selectionInfo}>
              <Button variant="contained" size="large" onClick={handleContinueToPayment} disabled={seatsCount === 0 || seance.placesDisponibles === 0} sx={{ minWidth: { xs: 130, md: 220 } }}>
                Continuer
              </Button>
            </ActionBar>
          </>
        ) : (
          <Box sx={{ maxWidth: 560, mx: 'auto' }}>
            <Button startIcon={<ArrowBack />} onClick={() => !processing && setStep(1)} sx={{ color: colors.textMuted, px: 0, mb: 1 }}>
              Modifier mes places
            </Button>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, mb: 3 }}>Paiement</Typography>

            {/* Récapitulatif de la commande */}
            <Box sx={{ p: 2.5, mb: 3, borderRadius: '6px', bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
              {hasSeatMap ? (
                selectedSeats.map((seat) => (
                  <Box key={seat.seatId} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography>
                      Place {seat.label}
                      {seat.type !== 'standard' && <Box component="span" sx={{ color: colors.textMuted }}> · {seat.type.toUpperCase()}</Box>}
                    </Typography>
                    <Typography>{formatPrice(calculateSeatPrice(seat))}</Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography>{nombrePlaces} × place</Typography>
                  <Typography>{formatPrice(prixTotal)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.border}` }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: 'primary.main' }}>{formatPrice(prixTotal)}</Typography>
              </Box>
            </Box>

            <Box component="form" id="payment-form" onSubmit={handleReservation}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '6px',
                  bgcolor: colors.paper,
                  border: cardError ? '1px solid rgba(239, 68, 68, 0.7)' : cardFocused ? `1px solid ${colors.gold}` : `1px solid ${colors.border}`,
                  transition: 'border-color 0.2s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCard sx={{ color: '#90caf9' }} />
                    <Typography fontWeight={700}>Carte bancaire</Typography>
                  </Box>
                  {cardComplete && <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />}
                </Box>
                <Box sx={{ p: 2, borderRadius: '6px', bgcolor: 'rgba(0, 0, 0, 0.25)', border: `1px solid ${colors.border}` }}>
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

            <ActionBar info={selectionInfo}>
              <Button
                type="submit"
                form="payment-form"
                variant="contained"
                size="large"
                disabled={processing || !cardComplete}
                startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <Lock />}
                sx={{ minWidth: { xs: 150, md: 240 } }}
              >
                {processing ? 'Paiement…' : `Payer ${formatPrice(prixTotal)}`}
              </Button>
            </ActionBar>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Reservation = () => {
  if (!stripePromise) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="warning">
          La clé publique Stripe n&rsquo;est pas configurée. Ajoutez <code>VITE_STRIPE_PUBLIC_KEY</code> dans <code>client/.env</code>.
        </Alert>
        <Button component={Link} to="/films" sx={{ mt: 2 }}>Retour aux films</Button>
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

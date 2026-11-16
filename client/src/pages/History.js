import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Chip, Container, Tab, Tabs, Typography } from '@mui/material';
import { ConfirmationNumber, EventSeat, LocationOn, Movie, Schedule } from '@mui/icons-material';
import api from '../utils/axiosConfig';
import { colors } from '../theme';
import { formatDayLong, formatPrice, imageUrl, seanceDay } from '../utils/format';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const STATUS = {
  confirmee: { label: 'Confirmée', color: 'success' },
  annulee: { label: 'Annulée', color: 'error' },
  en_attente: { label: 'En attente', color: 'warning' },
};

const seanceTime = (seance) => {
  if (!seance?.date) return 0;
  const [y, m, d] = seance.date.slice(0, 10).split('-').map(Number);
  const [h, min] = (seance.heure || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
};

const History = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    api.get('/reservations/my-reservations')
      .then((res) => setReservations(res.data))
      .catch((error) => console.error('Erreur lors du chargement des réservations:', error))
      .finally(() => setLoading(false));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const isUpcoming = (r) => seanceTime(r.seance) >= now && r.statut !== 'annulee';
    return {
      upcoming: reservations.filter(isUpcoming).sort((a, b) => seanceTime(a.seance) - seanceTime(b.seance)),
      past: reservations.filter((r) => !isUpcoming(r)),
    };
  }, [reservations]);

  if (loading) return <Loader />;

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <Box>
      <Box sx={{ bgcolor: colors.bgDeep, borderBottom: `1px solid ${colors.border}` }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, pt: { xs: 4, md: 6 } }}>
          <Typography variant="h2" component="h1" sx={{ mb: 3 }}>Mes billets</Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" TabIndicatorProps={{ sx: { height: 3, borderRadius: 3 } }}>
            <Tab value="upcoming" label={`À venir (${upcoming.length})`} sx={{ px: 0, mr: 4, minWidth: 0, '&.Mui-selected': { color: '#fff' } }} />
            <Tab value="past" label={`Historique (${past.length})`} sx={{ px: 0, minWidth: 0, '&.Mui-selected': { color: '#fff' } }} />
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
        {list.length === 0 ? (
          <EmptyState icon={ConfirmationNumber} title={tab === 'upcoming' ? 'Aucune séance à venir' : 'Aucune réservation passée'}>
            {tab === 'upcoming' && (
              <Button component={Link} to="/films" variant="contained" sx={{ mt: 2 }}>
                Voir les films à l'affiche
              </Button>
            )}
          </EmptyState>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {list.map((r) => {
              const film = r.seance?.film;
              const status = STATUS[r.statut] || STATUS.en_attente;
              return (
                <Box
                  key={r._id}
                  sx={{
                    display: 'flex',
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: colors.paper,
                    border: `1px solid ${colors.border}`,
                    opacity: r.statut === 'annulee' ? 0.6 : 1,
                  }}
                >
                  <Box sx={{ width: { xs: 90, sm: 120 }, flexShrink: 0, bgcolor: colors.paperHigh }}>
                    {film?.image ? (
                      <Box component="img" src={imageUrl(film.image)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Movie sx={{ color: '#3a3b45', fontSize: 40 }} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 3 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" noWrap>{film?.titre || 'Film'}</Typography>
                        <Chip label={status.label} color={status.color} size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, color: 'text.secondary', fontSize: '0.92rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Schedule sx={{ fontSize: 17, color: 'primary.main' }} />
                          {r.seance?.date ? `${formatDayLong(seanceDay(r.seance))} · ${r.seance.heure}` : '—'}
                        </Box>
                        {r.seance?.salle && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <LocationOn sx={{ fontSize: 17, color: 'primary.main' }} />
                            {[r.seance.salle.cinema?.nom, r.seance.salle.nom].filter(Boolean).join(' · ')}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <EventSeat sx={{ fontSize: 17, color: 'primary.main' }} />
                          {r.sieges?.length ? r.sieges.map((s) => s.label).join(', ') : `${r.nombrePlaces} place${r.nombrePlaces > 1 ? 's' : ''}`}
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: { xs: 'center', md: 'flex-end' }, justifyContent: 'space-between', gap: 1.5, flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.25rem' }}>{formatPrice(r.prixTotal)}</Typography>
                      {r.statut === 'confirmee' && (
                        <Button component={Link} to={`/ticket/${r._id}`} variant="contained" size="small" startIcon={<ConfirmationNumber />}>
                          Voir le billet
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default History;

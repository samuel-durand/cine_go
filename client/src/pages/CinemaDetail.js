import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Box, Chip, Container, Grid, Typography } from '@mui/material';
import { Email, EventBusy, LocationOn, Movie, Phone } from '@mui/icons-material';
import api from '../utils/axiosConfig';
import { colors } from '../theme';
import { formatDayLong, formatDuration, genreName, imageUrl, SALLE_LABELS, toISODate } from '../utils/format';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import DayStrip from '../components/seances/DayStrip';
import ShowtimeButton from '../components/seances/ShowtimeButton';

// Regroupe les séances du jour par film
const groupByFilm = (seances) => {
  const groups = new Map();
  seances.forEach((s) => {
    if (!s.film) return;
    if (!groups.has(s.film._id)) groups.set(s.film._id, { film: s.film, seances: [] });
    groups.get(s.film._id).seances.push(s);
  });
  return [...groups.values()].sort((a, b) => a.film.titre.localeCompare(b.film.titre));
};

const CinemaDetail = () => {
  const { id } = useParams();
  const [cinema, setCinema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState(null);
  const [selectedDate, setSelectedDate] = useState(toISODate());
  const [seances, setSeances] = useState([]);
  const [seancesLoading, setSeancesLoading] = useState(false);

  useEffect(() => {
    api.get(`/cinemas/${id}`)
      .then((res) => setCinema(res.data))
      .catch(() => setCinema(null))
      .finally(() => setLoading(false));
    api.get('/seances/dates', { params: { cinemaId: id } })
      .then(({ data }) => {
        setAvailableDates(data);
        if (data.length && !data.includes(toISODate())) setSelectedDate(data[0]);
      })
      .catch(() => setAvailableDates(null));
  }, [id]);

  useEffect(() => {
    setSeancesLoading(true);
    api.get('/seances', { params: { cinemaId: id, date: selectedDate } })
      .then((res) => setSeances(res.data))
      .catch((error) => {
        console.error('Erreur lors du chargement des séances:', error);
        setSeances([]);
      })
      .finally(() => setSeancesLoading(false));
  }, [id, selectedDate]);

  const films = useMemo(() => groupByFilm(seances), [seances]);

  if (loading) return <Loader />;
  if (!cinema) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">Cinéma non trouvé</Alert>
      </Container>
    );
  }

  const cover = imageUrl(cinema.image);
  const formats = [...new Set((cinema.salles || []).map((s) => s.type))];

  return (
    <Box>
      {/* En-tête du cinéma */}
      <Box sx={{ position: 'relative', overflow: 'hidden', bgcolor: colors.bgDeep, borderBottom: `1px solid ${colors.border}` }}>
        {cover && (
          <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
        )}
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${colors.bg} 0%, rgba(15,16,20,0.5) 100%)` }} />
        <Container maxWidth="xl" sx={{ position: 'relative', px: { xs: 2, md: 4 }, pt: { xs: 6, md: 10 }, pb: { xs: 4, md: 6 } }}>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>{cinema.ville}</Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>{cinema.nom}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, md: 3 }, color: 'text.secondary' }}>
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <LocationOn fontSize="small" sx={{ color: 'primary.main' }} />
              {cinema.adresse}, {cinema.codePostal} {cinema.ville}
            </Typography>
            {cinema.telephone && (
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Phone fontSize="small" sx={{ color: 'primary.main' }} />
                {cinema.telephone}
              </Typography>
            )}
            {cinema.email && (
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Email fontSize="small" sx={{ color: 'primary.main' }} />
                {cinema.email}
              </Typography>
            )}
          </Box>
          {(formats.length > 0 || cinema.salles?.length > 0) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2.5 }}>
              <Chip label={`${cinema.salles.length} salle${cinema.salles.length > 1 ? 's' : ''}`} variant="outlined" />
              {formats.filter((t) => t !== 'classic').map((t) => (
                <Chip key={t} label={SALLE_LABELS[t] || t} color="primary" />
              ))}
            </Box>
          )}
          {cinema.description && (
            <Typography sx={{ color: colors.textMuted, mt: 2.5, maxWidth: 760 }}>{cinema.description}</Typography>
          )}
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, pt: 5 }}>
        <Typography variant="h3" component="h2" sx={{ mb: 3, fontSize: { xs: '1.5rem', md: '1.85rem' } }}>
          Films et séances
        </Typography>
        <DayStrip value={selectedDate} onChange={setSelectedDate} availableDates={availableDates} />
        <Typography color="text.secondary" sx={{ mt: 3, mb: 2 }}>
          {formatDayLong(selectedDate)}
        </Typography>

        {seancesLoading ? (
          <Loader minHeight={160} />
        ) : films.length === 0 ? (
          <EmptyState icon={EventBusy} title="Aucune séance ce jour-là">
            Choisissez une autre date dans le calendrier ci-dessus.
          </EmptyState>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {films.map(({ film, seances: list }) => (
              <Box key={film._id} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
                <Grid container spacing={{ xs: 2, md: 3 }}>
                  <Grid item xs={4} sm={3} md={2}>
                    <Box
                      component={Link}
                      to={`/films/${film._id}`}
                      sx={{ display: 'block', aspectRatio: '2 / 3', borderRadius: '8px', overflow: 'hidden', bgcolor: colors.paperHigh }}
                    >
                      {film.image ? (
                        <Box component="img" src={imageUrl(film.image)} alt={film.titre} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Movie sx={{ fontSize: 40, color: '#3a3b45' }} />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={8} sm={9} md={10}>
                    <Typography
                      component={Link}
                      to={`/films/${film._id}`}
                      sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.35rem' }, color: '#fff', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                    >
                      {film.titre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {[genreName(film), formatDuration(film.duree)].filter(Boolean).join(' · ')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, pt: 1 }}>
                      {list.map((s) => (
                        <ShowtimeButton key={s._id} seance={s} duree={film.duree} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CinemaDetail;

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Chip, Container, Grid, InputAdornment, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Search, MovieFilter } from '@mui/icons-material';
import api from '../utils/axiosConfig';
import { colors } from '../theme';
import { capitalize, filmsAuCinema, filmsPlusAttendus, filmsProchainement } from '../utils/format';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import PosterCard from '../components/films/PosterCard';

const TABS = [
  { value: 'affiche', label: 'Au cinéma', select: filmsAuCinema, title: 'Films actuellement au cinéma' },
  { value: 'attendus', label: 'Les plus attendus', select: filmsPlusAttendus, title: 'Les films les plus attendus' },
  { value: 'prochainement', label: 'Prochainement', select: filmsProchainement, title: 'Prochaines sorties au cinéma' },
];

const Films = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const current = TABS.find((t) => t.value === searchParams.get('tab')) || TABS[0];
  const tab = current.value;

  useEffect(() => {
    api.get('/films')
      .then((res) => setFilms(res.data))
      .catch((error) => console.error('Erreur lors du chargement des films:', error))
      .finally(() => setLoading(false));
  }, []);

  const tabFilms = useMemo(() => current.select(films), [films, current]);

  const genres = useMemo(
    () => [...new Set(tabFilms.map((f) => f.genre?.nom).filter(Boolean))].sort(),
    [tabFilms],
  );

  const filteredFilms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tabFilms.filter((film) => {
      if (genre && film.genre?.nom !== genre) return false;
      if (!q) return true;
      return [film.titre, film.genre?.nom, film.realisateur, ...(film.acteurs || [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q));
    });
  }, [tabFilms, genre, searchTerm]);

  const changeTab = (_, value) => {
    setGenre('');
    setSearchParams(value === 'affiche' ? {} : { tab: value });
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Box sx={{ bgcolor: colors.bgDeep, borderBottom: `1px solid ${colors.border}` }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, pt: { xs: 4, md: 6 } }}>
          <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            {current.title}
          </Typography>
          <Tabs value={tab} onChange={changeTab} textColor="inherit" TabIndicatorProps={{ sx: { height: 3, borderRadius: 3 } }}>
            {TABS.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} sx={{ px: 0, mr: 4, minWidth: 0, '&.Mui-selected': { color: '#fff' } }} />
            ))}
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' }, mb: 4 }}>
          <TextField
            placeholder="Rechercher un film, un acteur…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', md: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box className="no-scrollbar" sx={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
            <Chip label="Tous" onClick={() => setGenre('')} color={genre ? 'default' : 'primary'} variant={genre ? 'outlined' : 'filled'} />
            {genres.map((g) => (
              <Chip
                key={g}
                label={capitalize(g)}
                onClick={() => setGenre(g === genre ? '' : g)}
                color={g === genre ? 'primary' : 'default'}
                variant={g === genre ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredFilms.length} film{filteredFilms.length > 1 ? 's' : ''}
        </Typography>

        {filteredFilms.length === 0 ? (
          <EmptyState icon={MovieFilter} title="Aucun film trouvé">
            Essayez un autre titre ou un autre genre.
          </EmptyState>
        ) : (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {filteredFilms.map((film) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={film._id}>
                <PosterCard film={film} showEnvies={tab === 'attendus'} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Films;

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Box, Container, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import { ChevronRight, LocationOn, Search, TheaterComedy } from '@mui/icons-material';
import api from '../utils/axiosConfig';
import { colors } from '../theme';
import { imageUrl } from '../utils/format';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const Cinemas = () => {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('ville') || '');

  useEffect(() => {
    api.get('/cinemas')
      .then((res) => setCinemas(res.data))
      .catch((error) => console.error('Erreur lors du chargement des cinémas:', error))
      .finally(() => setLoading(false));
  }, []);

  // Cinémas filtrés puis regroupés par ville
  const byCity = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map();
    cinemas
      .filter((c) => !q || [c.nom, c.ville, c.codePostal].some((v) => (v || '').toLowerCase().includes(q)))
      .forEach((c) => {
        if (!groups.has(c.ville)) groups.set(c.ville, []);
        groups.get(c.ville).push(c);
      });
    return [...groups.entries()];
  }, [cinemas, query]);

  if (loading) return <Loader />;

  return (
    <Box>
      <Box sx={{ bgcolor: colors.bgDeep, borderBottom: `1px solid ${colors.border}` }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, py: { xs: 4, md: 6 } }}>
          <Typography variant="h2" component="h1" sx={{ mb: 1 }}>
            Nos cinémas
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {cinemas.length} cinéma{cinemas.length > 1 ? 's' : ''} pour découvrir les films à l'affiche
          </Typography>
          <TextField
            placeholder="Ville, code postal ou nom du cinéma"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: 460 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, py: 5 }}>
        {byCity.length === 0 ? (
          <EmptyState icon={TheaterComedy} title="Aucun cinéma trouvé">
            Essayez une autre ville ou un autre code postal.
          </EmptyState>
        ) : (
          byCity.map(([ville, list]) => (
            <Box key={ville} sx={{ mb: 5 }}>
              <Typography variant="overline" color="text.secondary">{ville}</Typography>
              <Grid container spacing={2} sx={{ mt: 0 }}>
                {list.map((cinema) => (
                  <Grid item xs={12} md={6} key={cinema._id}>
                    <Box
                      component={Link}
                      to={`/cinemas/${cinema._id}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'stretch',
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: colors.paper,
                        border: `1px solid ${colors.border}`,
                        color: '#fff',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s ease',
                        '&:hover': { borderColor: 'primary.main' },
                        '&:hover .cin-arrow': { color: 'primary.main', transform: 'translateX(3px)' },
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 96, sm: 140 },
                          flexShrink: 0,
                          bgcolor: colors.paperHigh,
                          backgroundImage: cinema.image ? `url(${imageUrl(cinema.image)})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!cinema.image && <TheaterComedy sx={{ fontSize: 40, color: '#3a3b45' }} />}
                      </Box>
                      <Box sx={{ p: 2.5, flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={800} sx={{ fontSize: '1.1rem' }} noWrap>{cinema.nom}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16 }} />
                          {cinema.adresse}, {cinema.codePostal} {cinema.ville}
                        </Typography>
                        {cinema.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {cinema.description}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                        <ChevronRight className="cin-arrow" sx={{ color: 'text.secondary', transition: 'all 0.2s ease' }} />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))
        )}
      </Container>
    </Box>
  );
};

export default Cinemas;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { FavoriteBorder } from '@mui/icons-material';
import api from '../utils/axiosConfig';
import { colors } from '../theme';
import { useWatchlist } from '../context/WatchlistContext';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import PosterCard from '../components/films/PosterCard';

// « Ma liste » : films mis de côté avec le cœur
const Watchlist = () => {
  const { ids } = useWatchlist();
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/films')
      .then((res) => setFilms(res.data))
      .catch(() => setFilms([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  const list = ids.map((id) => films.find((f) => f._id === id)).filter(Boolean);

  return (
    <Box>
      <Box sx={{ bgcolor: colors.bgDeep, borderBottom: `1px solid ${colors.border}` }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, py: { xs: 4, md: 6 } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>Ma liste</Typography>
          <Typography color="text.secondary">
            {list.length} film{list.length > 1 ? 's' : ''} mis de côté sur cet appareil
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, py: 5 }}>
        {list.length === 0 ? (
          <EmptyState icon={FavoriteBorder} title="Votre liste est vide">
            Cliquez sur le cœur d'une affiche pour retrouver le film ici.
            <Box sx={{ mt: 2 }}>
              <Button component={Link} to="/films" variant="contained">Parcourir les films</Button>
            </Box>
          </EmptyState>
        ) : (
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {list.map((film) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={film._id}>
                <PosterCard film={film} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Watchlist;

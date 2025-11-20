import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import { Movie, LocalMovies, AccessTime, Star } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Home = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      const response = await axios.get(`${API_URL}/films`);
      setFilms(response.data.slice(0, 6)); // Afficher les 6 premiers
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des films:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh' }}>
      {/* Hero Section - Style Scrapy */}
      <Box
        sx={{
          backgroundColor: '#000000',
          color: '#FFFFFF',
          padding: { xs: '60px 24px', md: '100px 24px' },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
              marginBottom: 3,
              color: '#FFD700',
              lineHeight: 1.2,
            }}
          >
            Le cinéma à portée de main
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              marginBottom: 4,
              color: '#CCCCCC',
              maxWidth: '800px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            Réservez vos places de cinéma en quelques clics. 
            Découvrez les derniers films à l'affiche et profitez d'une expérience cinématographique exceptionnelle.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/films"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: '#FFD700',
                color: '#000000',
                padding: '14px 32px',
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#FFA500',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(255, 215, 0, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Découvrir les films
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section - Style Scrapy */}
      <Box
        sx={{
          padding: { xs: '60px 24px', md: '80px 24px' },
          backgroundColor: '#1a1a1a',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <LocalMovies sx={{ fontSize: 40, color: '#000000' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, marginBottom: 2, color: '#FFFFFF' }}>
                  Large sélection
                </Typography>
                <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                  Accédez à une vaste collection de films, des dernières sorties aux classiques intemporels.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <AccessTime sx={{ fontSize: 40, color: '#000000' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, marginBottom: 2, color: '#FFFFFF' }}>
                  Réservation rapide
                </Typography>
                <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                  Réservez vos places en quelques secondes avec notre système de sélection de sièges intuitif.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <Star sx={{ fontSize: 40, color: '#000000' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, marginBottom: 2, color: '#FFFFFF' }}>
                  Expérience premium
                </Typography>
                <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
                  Profitez de salles modernes avec un confort optimal et une qualité sonore exceptionnelle.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Films Section */}
      <Box
        sx={{
          padding: { xs: '60px 24px', md: '80px 24px' },
          backgroundColor: '#121212',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              marginBottom: 1,
              color: '#FFD700',
              textAlign: 'center',
            }}
          >
            Films à l'affiche
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#CCCCCC',
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Découvrez notre sélection de films actuellement en salle
          </Typography>

          <Grid container spacing={4}>
            {films.map((film) => (
              <Grid item xs={12} sm={6} md={4} key={film._id}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: '#FFD700',
                      boxShadow: '0 12px 24px rgba(255, 215, 0, 0.2)',
                    },
                  }}
                >
                  <CardActionArea component={Link} to={`/films/${film._id}`}>
                    {film.image ? (
                      <CardMedia
                        component="img"
                        height="400"
                        image={film.image}
                        alt={film.titre}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        height="400"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ backgroundColor: '#2d2d2d' }}
                      >
                        <Movie sx={{ fontSize: 80, color: '#666666' }} />
                      </Box>
                    )}
                    <CardContent sx={{ padding: 3, backgroundColor: '#1a1a1a' }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          marginBottom: 1,
                          color: '#FFFFFF',
                        }}
                      >
                        {film.titre}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#CCCCCC',
                          marginBottom: 2,
                        }}
                      >
                        {film.genre} • {film.duree} min
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#CCCCCC',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {film.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', marginTop: 6 }}>
            <Button
              component={Link}
              to="/films"
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#FFD700',
                color: '#FFD700',
                padding: '12px 32px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: '#FFD700',
                  color: '#000000',
                },
              }}
            >
              Voir tous les films →
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

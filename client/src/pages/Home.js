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
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          color: '#FFFFFF',
          padding: { xs: '80px 24px', md: '130px 24px' },
          textAlign: 'center',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255, 215, 0, 0.12) 0%, transparent 60%), linear-gradient(180deg, #0a0a0e 0%, #0f1014 100%)',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Typography
            variant="body2"
            sx={{
              display: 'inline-block',
              px: 2,
              py: 0.75,
              mb: 3,
              borderRadius: '999px',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              backgroundColor: 'rgba(255, 215, 0, 0.08)',
              color: '#FFD700',
              fontWeight: 600,
            }}
          >
            🎬 Vos séances, en quelques clics
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4.25rem' },
              fontWeight: 800,
              marginBottom: 3,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Le cinéma à{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              portée de main
            </Box>
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.3rem' },
              marginBottom: 4,
              color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '680px',
              margin: '0 auto 40px',
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            Découvrez les derniers films à l'affiche, choisissez vos sièges sur plan
            et payez en ligne en toute sécurité.
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
            <Button
              component={Link}
              to="/cinemas"
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#FFD700',
                color: '#FFD700',
                padding: '14px 32px',
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(255, 215, 0, 0.2)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Choisir un cinéma
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        sx={{
          padding: { xs: '60px 24px', md: '80px 24px' },
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.2)',
                  }}
                >
                  <LocalMovies sx={{ fontSize: 40, color: '#FFD700' }} />
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
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.2)',
                  }}
                >
                  <AccessTime sx={{ fontSize: 40, color: '#FFD700' }} />
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
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 4px 16px rgba(255, 215, 0, 0.2)',
                  }}
                >
                  <Star sx={{ fontSize: 40, color: '#FFD700' }} />
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
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              marginBottom: 1,
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}
          >
            Films à <Box component="span" sx={{ color: '#FFD700' }}>l'affiche</Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.55)',
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
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: 'rgba(255, 215, 0, 0.5)',
                      boxShadow: '0 12px 40px rgba(255, 215, 0, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <CardActionArea component={Link} to={`/films/${film._id}`}>
                    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                      {film.image ? (
                        <CardMedia
                          component="img"
                          height="400"
                          image={film.image}
                          alt={film.titre}
                          sx={{
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease',
                            '.MuiCardActionArea-root:hover &': {
                              transform: 'scale(1.05)',
                            },
                          }}
                        />
                      ) : (
                        <Box
                          height="400"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          sx={{ backgroundColor: '#1c1d24', height: 400 }}
                        >
                          <Movie sx={{ fontSize: 80, color: '#3a3b45' }} />
                        </Box>
                      )}
                      {/* Dégradé pour la lisibilité + badge genre */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, transparent 60%, rgba(10, 10, 14, 0.9) 100%)',
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '8px',
                          backgroundColor: 'rgba(10, 10, 14, 0.75)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#FFD700',
                        }}
                      >
                        {film.genre?.nom ? film.genre.nom.charAt(0).toUpperCase() + film.genre.nom.slice(1) : 'N/A'}
                      </Box>
                    </Box>
                    <CardContent sx={{ padding: 3, backgroundColor: 'transparent' }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          marginBottom: 0.5,
                          color: '#FFFFFF',
                        }}
                      >
                        {film.titre}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, marginBottom: 1.5 }}>
                        <AccessTime sx={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.45)' }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                          {film.duree} min
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.55)',
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

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
  TextField,
  InputAdornment
} from '@mui/material';
import { Movie, Search, AccessTime } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Films = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      const response = await axios.get(`${API_URL}/films`);
      setFilms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des films:', error);
      setLoading(false);
    }
  };

  const filteredFilms = films.filter(film =>
    film.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (film.genre?.nom || film.genre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          Tous les <Box component="span" sx={{ color: '#FFD700' }}>films</Box>
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.55)',
            marginBottom: 4,
          }}
        >
          Découvrez notre collection complète de films
        </Typography>

      <TextField
        fullWidth
        placeholder="Rechercher un film..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          mb: 6,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            color: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '&:hover fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.7)',
            },
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#FFD700' }} />
            </InputAdornment>
          ),
        }}
      />

      <Box className="mt-4">
        <Grid container spacing={4}>
        {filteredFilms.length === 0 ? (
          <Box className="w-full text-center py-12">
            <Typography variant="h6" color="textSecondary">
              Aucun film trouvé
            </Typography>
          </Box>
        ) : (
          filteredFilms.map((film) => (
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
                        height="300"
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
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ backgroundColor: '#1c1d24', height: 300 }}
                      >
                        <Movie sx={{ fontSize: 80, color: '#3a3b45' }} />
                      </Box>
                    )}
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
          ))
        )}
        </Grid>
      </Box>
      </Container>
    </Box>
  );
};

export default Films;


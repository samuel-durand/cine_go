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
import { Movie, Search } from '@mui/icons-material';

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
    film.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#121212', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            color: '#FFD700',
          }}
        >
          Tous les films
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#CCCCCC',
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
            backgroundColor: '#1a1a1a',
            color: '#FFFFFF',
            '&:hover fieldset': {
              borderColor: '#FFD700',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFD700',
            },
            '& fieldset': {
              borderColor: 'rgba(255, 215, 0, 0.3)',
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
                      height="300"
                      image={film.image}
                      alt={film.titre}
                    />
                  ) : (
                    <Box
                      height="300"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor="grey.200"
                    >
                      <Movie sx={{ fontSize: 80, color: 'grey.400' }} />
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
          ))
        )}
        </Grid>
      </Box>
      </Container>
    </Box>
  );
};

export default Films;


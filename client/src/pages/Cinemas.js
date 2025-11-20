import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import { LocationOn, Phone, Email, Movie } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Cinemas = () => {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      const response = await axios.get(`${API_URL}/cinemas`);
      setCinemas(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des cinémas:', error);
      setLoading(false);
    }
  };

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
          Nos cinémas
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#CCCCCC',
            marginBottom: 4,
          }}
        >
          Choisissez un cinéma pour voir les films à l'affiche
        </Typography>

        <Grid container spacing={4}>
          {cinemas.length === 0 ? (
            <Box className="w-full text-center py-12">
              <Typography variant="h6" sx={{ color: '#CCCCCC' }}>
                Aucun cinéma disponible
              </Typography>
            </Box>
          ) : (
            cinemas.map((cinema) => (
              <Grid item xs={12} sm={6} md={4} key={cinema._id}>
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
                  <CardActionArea component={Link} to={`/cinemas/${cinema._id}`}>
                    <CardContent sx={{ padding: 3, backgroundColor: 'transparent' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationOn sx={{ color: '#FFD700', fontSize: 32, mr: 1 }} />
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: 700,
                            color: '#FFFFFF',
                          }}
                        >
                          {cinema.nom}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#CCCCCC',
                            mb: 1,
                          }}
                        >
                          {cinema.adresse}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#CCCCCC',
                          }}
                        >
                          {cinema.codePostal} {cinema.ville}
                        </Typography>
                      </Box>

                      {cinema.telephone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Phone sx={{ fontSize: 18, color: '#FFD700', mr: 1 }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#CCCCCC',
                            }}
                          >
                            {cinema.telephone}
                          </Typography>
                        </Box>
                      )}

                      {cinema.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Email sx={{ fontSize: 18, color: '#FFD700', mr: 1 }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#CCCCCC',
                            }}
                          >
                            {cinema.email}
                          </Typography>
                        </Box>
                      )}

                      {cinema.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#CCCCCC',
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {cinema.description}
                        </Typography>
                      )}

                      <Chip
                        icon={<Movie sx={{ color: '#FFD700' }} />}
                        label="Voir les séances"
                        sx={{
                          backgroundColor: 'rgba(255, 215, 0, 0.2)',
                          color: '#FFD700',
                          fontWeight: 'bold',
                        }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Cinemas;


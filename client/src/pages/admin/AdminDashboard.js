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
  Paper,
  Divider,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  Dashboard,
  Movie,
  Event,
  Receipt,
  People,
  CalendarToday,
  Room,
  TrendingUp,
  Euro,
  AccessTime,
  ArrowForward
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    films: 0,
    cinemas: 0,
    salles: 0,
    seances: 0,
    reservations: 0,
    users: 0,
    revenus: 0,
    reservationsAujourdhui: 0
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentReservations();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [filmsRes, cinemasRes, sallesRes, seancesRes, reservationsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/films/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/cinemas/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/salles/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/seances/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/reservations/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const reservations = reservationsRes.data;
      const revenus = reservations
        .filter(r => r.paiement === 'paye')
        .reduce((sum, r) => sum + (r.prixTotal || 0), 0);
      
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);
      const reservationsAujourdhui = reservations.filter(r => {
        const dateReservation = new Date(r.dateReservation);
        dateReservation.setHours(0, 0, 0, 0);
        return dateReservation.getTime() === aujourdhui.getTime();
      }).length;

      setStats({
        films: filmsRes.data.length,
        cinemas: cinemasRes.data.length,
        salles: sallesRes.data.length,
        seances: seancesRes.data.length,
        reservations: reservations.length,
        users: usersRes.data.length,
        revenus: revenus,
        reservationsAujourdhui: reservationsAujourdhui
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setLoading(false);
    }
  };

  const fetchRecentReservations = async () => {
    try {
      const response = await axios.get(`${API_URL}/reservations/all`);
      const sorted = response.data
        .sort((a, b) => new Date(b.dateReservation) - new Date(a.dateReservation))
        .slice(0, 5);
      setRecentReservations(sorted);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          backgroundColor: '#121212',
        }}
      >
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Films',
      value: stats.films,
      icon: Movie,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/films'
    },
    {
      title: 'Cinémas',
      value: stats.cinemas || 0,
      icon: Room,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/cinemas'
    },
    {
      title: 'Salles',
      value: stats.salles,
      icon: Room,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/salles'
    },
    {
      title: 'Séances',
      value: stats.seances,
      icon: Event,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/seances'
    },
    {
      title: 'Réservations',
      value: stats.reservations,
      icon: Receipt,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/reservations',
      subtitle: `${stats.reservationsAujourdhui} aujourd'hui`
    },
    {
      title: 'Utilisateurs',
      value: stats.users,
      icon: People,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/users'
    },
    {
      title: 'Revenus',
      value: `${stats.revenus.toFixed(2)} €`,
      icon: Euro,
      color: '#FFD700',
      bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      link: '/admin/reservations',
      iconBg: 'rgba(255, 215, 0, 0.1)'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#FFFFFF',
        padding: { xs: '24px', md: '40px' },
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ marginBottom: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: '#FFD700',
              marginBottom: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Dashboard sx={{ fontSize: 40 }} />
            Tableau de bord administrateur
          </Typography>
          <Typography variant="body1" sx={{ color: '#CCCCCC' }}>
            Vue d'ensemble de votre cinéma
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ marginBottom: 4 }}>
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid item xs={12} sm={6} md={4} lg={2} key={stat.title}>
                <Card
                  sx={{
                    background: stat.bgGradient,
                    border: '1px solid rgba(255, 215, 0, 0.15)',
                    borderRadius: '12px',
                    height: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <CardActionArea
                    component={Link}
                    to={stat.link}
                    sx={{
                      height: '100%',
                      display: 'block',
                      textDecoration: 'none',
                      position: 'relative',
                      padding: 3,
                      '&:hover .stat-card__glow': {
                        opacity: 1,
                        transform: 'scale(1.2)',
                      },
                    }}
                  >
                    <Box
                      className="stat-card__glow"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at top right, rgba(255,215,0,0.2), transparent 55%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        pointerEvents: 'none',
                      }}
                    />
                    <CardContent sx={{ position: 'relative', padding: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            backgroundColor: stat.iconBg || 'rgba(255, 215, 0, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'inset 0 0 12px rgba(255, 215, 0, 0.15)',
                          }}
                        >
                          <Icon sx={{ fontSize: 30, color: stat.color }} />
                        </Box>
                        <Chip
                          icon={<ArrowForward sx={{ fontSize: 16 }} />}
                          label="Ouvrir"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 215, 0, 0.12)',
                            color: '#FFD700',
                            fontWeight: 600,
                            borderRadius: '999px',
                            '& .MuiChip-icon': { color: '#FFD700', marginLeft: 0 },
                          }}
                        />
                      </Stack>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: '#FFFFFF',
                          marginBottom: 0.5,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#CCCCCC',
                          fontWeight: 500,
                        }}
                      >
                        {stat.title}
                      </Typography>
                      {stat.subtitle && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#FFD700',
                            display: 'block',
                            marginTop: 0.5,
                          }}
                        >
                          {stat.subtitle}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Planning Card */}
        <Grid container spacing={3} sx={{ marginBottom: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #181818 0%, #2c2300 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <CardActionArea
                component={Link}
                to="/admin/planning"
                sx={{
                  padding: 3,
                  display: 'block',
                  '&:hover .planning-card__glow': { opacity: 1, transform: 'scale(1.1)' },
                }}
              >
                <Box
                  className="planning-card__glow"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 80% 20%, rgba(255,215,0,0.2), transparent 50%)',
                    opacity: 0,
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}
                />
                <CardContent sx={{ position: 'relative', padding: 0 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 215, 0, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'inset 0 0 18px rgba(255, 215, 0, 0.2)',
                      }}
                    >
                      <CalendarToday sx={{ fontSize: 30, color: '#FFD700' }} />
                    </Box>
                    <Chip
                      label="Voir les plannings"
                      icon={<ArrowForward sx={{ fontSize: 16 }} />}
                      sx={{
                        bgcolor: 'rgba(255, 215, 0, 0.12)',
                        color: '#FFD700',
                        fontWeight: 600,
                        borderRadius: '999px',
                        '& .MuiChip-icon': { color: '#FFD700', marginLeft: 0 },
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginBottom: 1,
                    }}
                  >
                    Planning des salles
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#CCCCCC',
                      marginBottom: 2,
                    }}
                  >
                    Accédez à la vue calendrier pour gérer les séances et bloquer les dates en un clic.
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: '#FFD700',
                      fontWeight: 600,
                    }}
                  >
                    <ArrowForward sx={{ fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      Gérer les plannings
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Reservations */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '12px',
                padding: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#FFD700',
                  marginBottom: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <TrendingUp />
                Réservations récentes
              </Typography>
              <Box>
                {recentReservations.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#CCCCCC', textAlign: 'center', py: 4 }}>
                    Aucune réservation récente
                  </Typography>
                ) : (
                  recentReservations.map((reservation, index) => (
                    <Box key={reservation._id}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 2,
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          marginBottom: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 215, 0, 0.05)',
                          },
                        }}
                      >
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: '#FFFFFF',
                              marginBottom: 0.5,
                            }}
                          >
                            {reservation.seance?.film?.titre || 'Film inconnu'}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#CCCCCC',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <AccessTime sx={{ fontSize: 16 }} />
                            {new Date(reservation.dateReservation).toLocaleString('fr-FR')}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: '#FFD700',
                            }}
                          >
                            {reservation.prixTotal} €
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#CCCCCC',
                            }}
                          >
                            {reservation.nombrePlaces} place{reservation.nombrePlaces > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>
                      {index < recentReservations.length - 1 && (
                        <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)', marginY: 1 }} />
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '12px',
                padding: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#FFD700',
                  marginBottom: 3,
                }}
              >
                Statistiques rapides
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box sx={{ marginBottom: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Taux d'occupation
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      {stats.seances > 0
                        ? Math.round((stats.reservations / (stats.seances * 100)) * 100)
                        : 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.seances > 0 ? Math.min((stats.reservations / (stats.seances * 100)) * 100, 100) : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#FFD700',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ marginBottom: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Revenus moyens
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      {stats.reservations > 0
                        ? (stats.revenus / stats.reservations).toFixed(2)
                        : 0} €
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Réservations aujourd'hui
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      {stats.reservationsAujourdhui}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;

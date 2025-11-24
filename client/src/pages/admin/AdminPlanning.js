import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Popover
} from '@mui/material';
import { 
  CalendarToday, 
  Block, 
  CheckCircle, 
  Movie, 
  AccessTime,
  ChevronLeft,
  ChevronRight,
  Event,
  EventBusy
} from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminPlanning = () => {
  const [salles, setSalles] = useState([]);
  const [selectedSalle, setSelectedSalle] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [seances, setSeances] = useState([]);
  const [seancesByDate, setSeancesByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [raisonBlocage, setRaisonBlocage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDaySeances, setSelectedDaySeances] = useState([]);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [openBlockDateDialog, setOpenBlockDateDialog] = useState(false);
  const [blockDateRaison, setBlockDateRaison] = useState('');
  const [blockingDate, setBlockingDate] = useState(null);

  const fetchSalles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/salles/all`);
      setSalles(response.data);
      if (response.data.length > 0 && !selectedSalle) {
        setSelectedSalle(response.data[0]._id);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, [selectedSalle]);

  const fetchPlanning = useCallback(async () => {
    if (!selectedSalle) return;
    setLoading(true);
    try {
      // Calculer le début et la fin du mois
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await axios.get(`${API_URL}/seances/planning/${selectedSalle}`, {
        params: { 
          startDate: startDateStr,
          endDate: endDateStr
        }
      });
      
      setSeances(response.data);
      
      // Grouper les séances par date
      const grouped = {};
      response.data.forEach(seance => {
        const dateKey = new Date(seance.date).toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(seance);
      });
      setSeancesByDate(grouped);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  }, [selectedSalle, currentDate]);

  useEffect(() => {
    fetchSalles();
  }, [fetchSalles]);

  useEffect(() => {
    if (selectedSalle) {
      fetchPlanning();
    }
  }, [selectedSalle, fetchPlanning]);

  const handleBlock = (seance) => {
    setSelectedSeance(seance);
    setRaisonBlocage(seance.raisonBlocage || '');
    setOpenBlockDialog(true);
    setAnchorEl(null);
  };

  const handleBlockConfirm = async () => {
    try {
      await axios.put(`${API_URL}/seances/${selectedSeance._id}/block`, {
        bloque: !selectedSeance.bloque,
        raisonBlocage: raisonBlocage
      });
      fetchPlanning();
      setOpenBlockDialog(false);
      setSelectedSeance(null);
      setRaisonBlocage('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDayClick = (event, date) => {
    const dateKey = date.toISOString().split('T')[0];
    const daySeances = seancesByDate[dateKey] || [];
    
    if (daySeances.length > 0) {
      setSelectedDaySeances(daySeances);
      setSelectedDayDate(date);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleBlockDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const daySeances = seancesByDate[dateKey] || [];
    const allBlocked = daySeances.length > 0 && daySeances.every(s => s.bloque);
    
    setBlockingDate(date);
    setBlockDateRaison(daySeances[0]?.raisonBlocage || '');
    setOpenBlockDateDialog(true);
    setAnchorEl(null);
  };

  const handleBlockDateConfirm = async () => {
    if (!blockingDate || !selectedSalle) return;
    
    try {
      const dateKey = blockingDate.toISOString().split('T')[0];
      const daySeances = seancesByDate[dateKey] || [];
      const allBlocked = daySeances.length > 0 && daySeances.every(s => s.bloque);
      
      await axios.put(`${API_URL}/seances/planning/${selectedSalle}/block-date`, {
        date: dateKey,
        bloque: !allBlocked,
        raisonBlocage: blockDateRaison
      });
      
      fetchPlanning();
      setOpenBlockDateDialog(false);
      setBlockingDate(null);
      setBlockDateRaison('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedDaySeances([]);
    setSelectedDayDate(null);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'vip':
        return 'warning';
      case 'premium':
        return 'primary';
      case 'imax':
        return 'info';
      case '4dx':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      classic: 'Classic',
      vip: 'VIP',
      premium: 'Premium',
      imax: 'IMAX',
      '4dx': '4DX'
    };
    return labels[type] || type;
  };

  // Fonction pour générer le calendrier
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Ajuster pour que lundi = 0
    const adjustedStartingDay = (startingDayOfWeek + 6) % 7;
    
    const calendar = [];
    let day = 1;
    
    // Générer les semaines
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        if (week === 0 && dayOfWeek < adjustedStartingDay) {
          // Jours du mois précédent
          const prevMonth = new Date(year, month, 0);
          const prevMonthDay = prevMonth.getDate() - (adjustedStartingDay - dayOfWeek - 1);
          weekDays.push({
            date: new Date(year, month - 1, prevMonthDay),
            isCurrentMonth: false,
            day: prevMonthDay
          });
        } else if (day > daysInMonth) {
          // Jours du mois suivant
          const nextMonthDay = day - daysInMonth;
          weekDays.push({
            date: new Date(year, month + 1, nextMonthDay),
            isCurrentMonth: false,
            day: nextMonthDay
          });
          day++;
        } else {
          // Jours du mois actuel
          weekDays.push({
            date: new Date(year, month, day),
            isCurrentMonth: true,
            day: day
          });
          day++;
        }
      }
      
      calendar.push(weekDays);
      
      if (day > daysInMonth) break;
    }
    
    return calendar;
  };

  const getSeancesForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return seancesByDate[dateKey] || [];
  };

  const getBlockedCount = (dateSeances) => {
    return dateSeances.filter(s => s.bloque).length;
  };

  const isDateFullyBlocked = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const daySeances = seancesByDate[dateKey] || [];
    return daySeances.length > 0 && daySeances.every(s => s.bloque);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const selectedSalleData = salles.find(s => s._id === selectedSalle);
  const calendar = generateCalendar();
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <Container maxWidth="xl" className="py-8">
      <Typography variant="h4" className="mb-6 font-bold" sx={{ color: '#FFD700' }}>
        <CalendarToday className="mr-2" />
        Planning des salles
      </Typography>

      <Paper className="p-4 mb-4" sx={{ backgroundColor: '#1a1a1a' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#CCCCCC' }}>Salle</InputLabel>
              <Select
                value={selectedSalle}
                onChange={(e) => setSelectedSalle(e.target.value)}
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FFD700',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FFD700',
                  },
                }}
              >
                {salles.map((salle) => (
                  <MenuItem key={salle._id} value={salle._id}>
                    {salle.nom} - {getTypeLabel(salle.type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedSalleData && (
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                  Capacité: {selectedSalleData.capacite} places
                </Typography>
                <Chip
                  label={getTypeLabel(selectedSalleData.type)}
                  color={getTypeColor(selectedSalleData.type)}
                  size="small"
                  className="mt-1"
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" className="py-8">
          <CircularProgress sx={{ color: '#FFD700' }} />
        </Box>
      ) : (
        <Paper sx={{ backgroundColor: '#1a1a1a', padding: 3 }}>
          {/* En-tête du calendrier */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <IconButton 
              onClick={() => navigateMonth(-1)}
              sx={{ color: '#FFD700' }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton 
              onClick={() => navigateMonth(1)}
              sx={{ color: '#FFD700' }}
            >
              <ChevronRight />
            </IconButton>
          </Box>

          {/* En-têtes des jours de la semaine */}
          <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((dayName) => (
              <Grid item xs key={dayName}>
                <Box
                  sx={{
                    textAlign: 'center',
                    padding: 1,
                    backgroundColor: '#2a2a2a',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                    {dayName}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Calendrier */}
          <Grid container spacing={0.5}>
            {calendar.map((week, weekIndex) => (
              <Grid container item xs={12} key={weekIndex} spacing={0.5}>
                {week.map((day, dayIndex) => {
                  if (!day || !day.date) return null;
                  
                  const dateSeances = getSeancesForDate(day.date);
                  const blockedCount = getBlockedCount(dateSeances);
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const fullyBlocked = isDateFullyBlocked(day.date);
                  
                  return (
                    <Grid item xs key={`${weekIndex}-${dayIndex}`}>
                      <Card
                        onClick={(e) => handleDayClick(e, day.date)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (dateSeances.length > 0) {
                            handleBlockDate(day.date);
                          }
                        }}
                        sx={{
                          minHeight: 100,
                          backgroundColor: fullyBlocked ? '#3a1a1a' : (day.isCurrentMonth ? '#2a2a2a' : '#1a1a1a'),
                          border: fullyBlocked 
                            ? '2px solid #d32f2f' 
                            : (isToday ? '2px solid #FFD700' : '1px solid rgba(255, 215, 0, 0.1)'),
                          cursor: dateSeances.length > 0 ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: fullyBlocked ? '#4a1a1a' : (day.isCurrentMonth ? '#3a3a3a' : '#2a2a2a'),
                            borderColor: dateSeances.length > 0 ? '#FFD700' : 'rgba(255, 215, 0, 0.3)',
                            transform: dateSeances.length > 0 ? 'scale(1.02)' : 'none',
                          },
                          opacity: day.isCurrentMonth ? 1 : 0.5,
                        }}
                      >
                        <CardContent sx={{ padding: '8px !important' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: fullyBlocked 
                                  ? '#d32f2f' 
                                  : (isToday ? '#FFD700' : (day.isCurrentMonth ? '#FFFFFF' : '#666666')),
                                fontWeight: (isToday || fullyBlocked) ? 'bold' : 'normal'
                              }}
                            >
                              {day.day}
                            </Typography>
                            {dateSeances.length > 0 && (
                              <Chip
                                label={dateSeances.length}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  backgroundColor: fullyBlocked ? '#d32f2f' : (blockedCount > 0 ? '#ff9800' : '#4caf50'),
                                  color: '#FFFFFF'
                                }}
                              />
                            )}
                          </Box>
                          {fullyBlocked && (
                            <Box display="flex" alignItems="center" mb={0.5}>
                              <EventBusy sx={{ fontSize: 12, color: '#d32f2f', mr: 0.5 }} />
                              <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                                Journée bloquée
                              </Typography>
                            </Box>
                          )}
                          
                          {dateSeances.length > 0 && (
                            <Box mt={0.5}>
                              {blockedCount > 0 && (
                                <Box display="flex" alignItems="center" mb={0.5}>
                                  <EventBusy sx={{ fontSize: 12, color: '#d32f2f', mr: 0.5 }} />
                                  <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                                    {blockedCount} bloqué{blockedCount > 1 ? 's' : ''}
                                  </Typography>
                                </Box>
                              )}
                              <Box display="flex" alignItems="center">
                                <Event sx={{ fontSize: 12, color: '#4caf50', mr: 0.5 }} />
                                <Typography variant="caption" sx={{ color: '#4caf50' }}>
                                  {dateSeances.length - blockedCount} disponible{dateSeances.length - blockedCount > 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Popover avec les séances du jour */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#FFFFFF',
            minWidth: 400,
            maxWidth: 600,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
      >
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ color: '#FFD700' }}>
              Séances du {selectedDayDate?.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            {selectedDaySeances.length > 0 && (
              <Button
                variant="outlined"
                color={selectedDaySeances.every(s => s.bloque) ? 'success' : 'error'}
                startIcon={selectedDaySeances.every(s => s.bloque) ? <CheckCircle /> : <Block />}
                onClick={() => handleBlockDate(selectedDayDate)}
                size="small"
                sx={{
                  '&.MuiButton-outlined': {
                    borderColor: selectedDaySeances.every(s => s.bloque) ? '#4caf50' : '#d32f2f',
                    color: selectedDaySeances.every(s => s.bloque) ? '#4caf50' : '#d32f2f',
                    '&:hover': { 
                      borderColor: selectedDaySeances.every(s => s.bloque) ? '#4caf50' : '#d32f2f',
                      backgroundColor: selectedDaySeances.every(s => s.bloque) ? 'rgba(76, 175, 80, 0.1)' : 'rgba(211, 47, 47, 0.1)'
                    }
                  }
                }}
              >
                {selectedDaySeances.every(s => s.bloque) ? 'Débloquer la journée' : 'Bloquer la journée'}
              </Button>
            )}
          </Box>
          {selectedDaySeances.length === 0 ? (
            <Alert severity="info">Aucune séance programmée</Alert>
          ) : (
            <Grid container spacing={2}>
              {selectedDaySeances.map((seance) => (
                <Grid item xs={12} key={seance._id}>
                  <Card 
                    sx={{ 
                      backgroundColor: seance.bloque ? '#3a1a1a' : '#2a2a2a',
                      border: seance.bloque ? '2px solid #d32f2f' : '1px solid rgba(255, 215, 0, 0.3)'
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                            <Movie sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                            {seance.film?.titre || 'N/A'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#CCCCCC', mt: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {seance.heure}
                          </Typography>
                        </Box>
                        {seance.bloque && (
                          <Chip
                            label="Bloqué"
                            color="error"
                            size="small"
                            icon={<Block />}
                          />
                        )}
                      </Box>
                      
                      <Box mt={1}>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          Places: {seance.placesDisponibles} / {seance.placesTotal}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                          Prix: {seance.prix} €
                        </Typography>
                        {seance.bloque && seance.raisonBlocage && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            {seance.raisonBlocage}
                          </Alert>
                        )}
                      </Box>
                      
                      <Box mt={2}>
                        <Button
                          fullWidth
                          variant={seance.bloque ? 'outlined' : 'contained'}
                          color={seance.bloque ? 'success' : 'error'}
                          startIcon={seance.bloque ? <CheckCircle /> : <Block />}
                          onClick={() => handleBlock(seance)}
                          size="small"
                          sx={{
                            '&.MuiButton-contained': {
                              backgroundColor: '#d32f2f',
                              '&:hover': { backgroundColor: '#b71c1c' }
                            },
                            '&.MuiButton-outlined': {
                              borderColor: '#4caf50',
                              color: '#4caf50',
                              '&:hover': { 
                                borderColor: '#4caf50',
                                backgroundColor: 'rgba(76, 175, 80, 0.1)'
                              }
                            }
                          }}
                        >
                          {seance.bloque ? 'Débloquer' : 'Bloquer'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Popover>

      {/* Dialog de blocage */}
      <Dialog 
        open={openBlockDialog} 
        onClose={() => setOpenBlockDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#FFFFFF'
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>
          {selectedSeance?.bloque ? 'Débloquer la séance' : 'Bloquer la séance'}
        </DialogTitle>
        <DialogContent>
          <Box className="mt-2">
            <Typography variant="body2" className="mb-2" sx={{ color: '#CCCCCC' }}>
              Film: {selectedSeance?.film?.titre}
            </Typography>
            <Typography variant="body2" className="mb-4" sx={{ color: '#CCCCCC' }}>
              Date: {selectedSeance?.date ? new Date(selectedSeance.date).toLocaleDateString('fr-FR') : ''} à {selectedSeance?.heure}
            </Typography>
            <TextField
              fullWidth
              label="Raison du blocage (optionnel)"
              multiline
              rows={3}
              value={raisonBlocage}
              onChange={(e) => setRaisonBlocage(e.target.value)}
              placeholder="Ex: Réservation complète, Maintenance, Événement privé..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  backgroundColor: '#2a2a2a',
                  '& fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#CCCCCC',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenBlockDialog(false)}
            sx={{ color: '#CCCCCC' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleBlockConfirm}
            variant="contained"
            color={selectedSeance?.bloque ? 'success' : 'error'}
            sx={{
              backgroundColor: selectedSeance?.bloque ? '#4caf50' : '#d32f2f',
              '&:hover': {
                backgroundColor: selectedSeance?.bloque ? '#388e3c' : '#b71c1c'
              }
            }}
          >
            {selectedSeance?.bloque ? 'Débloquer' : 'Bloquer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de blocage de date */}
      <Dialog 
        open={openBlockDateDialog} 
        onClose={() => setOpenBlockDateDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#FFFFFF'
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>
          {blockingDate && (() => {
            const dateKey = blockingDate.toISOString().split('T')[0];
            const daySeances = seancesByDate[dateKey] || [];
            const allBlocked = daySeances.length > 0 && daySeances.every(s => s.bloque);
            return allBlocked ? 'Débloquer la journée' : 'Bloquer la journée';
          })()}
        </DialogTitle>
        <DialogContent>
          <Box className="mt-2">
            <Typography variant="body2" className="mb-2" sx={{ color: '#CCCCCC' }}>
              Date: {blockingDate?.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            {blockingDate && (() => {
              const dateKey = blockingDate.toISOString().split('T')[0];
              const daySeances = seancesByDate[dateKey] || [];
              return (
                <Typography variant="body2" className="mb-4" sx={{ color: '#CCCCCC' }}>
                  {daySeances.length} séance{daySeances.length > 1 ? 's' : ''} sera{daySeances.length > 1 ? 'ont' : ''} {daySeances.every(s => s.bloque) ? 'débloquée' : 'bloquée'}{daySeances.length > 1 ? 's' : ''}
                </Typography>
              );
            })()}
            <TextField
              fullWidth
              label="Raison du blocage (optionnel)"
              multiline
              rows={3}
              value={blockDateRaison}
              onChange={(e) => setBlockDateRaison(e.target.value)}
              placeholder="Ex: Maintenance, Événement privé, Fermeture exceptionnelle..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  backgroundColor: '#2a2a2a',
                  '& fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FFD700',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#CCCCCC',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenBlockDateDialog(false)}
            sx={{ color: '#CCCCCC' }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleBlockDateConfirm}
            variant="contained"
            color={blockingDate && (() => {
              const dateKey = blockingDate.toISOString().split('T')[0];
              const daySeances = seancesByDate[dateKey] || [];
              return daySeances.every(s => s.bloque) ? 'success' : 'error';
            })()}
            sx={{
              backgroundColor: blockingDate && (() => {
                const dateKey = blockingDate.toISOString().split('T')[0];
                const daySeances = seancesByDate[dateKey] || [];
                return daySeances.every(s => s.bloque) ? '#4caf50' : '#d32f2f';
              })(),
              '&:hover': {
                backgroundColor: blockingDate && (() => {
                  const dateKey = blockingDate.toISOString().split('T')[0];
                  const daySeances = seancesByDate[dateKey] || [];
                  return daySeances.every(s => s.bloque) ? '#388e3c' : '#b71c1c';
                })()
              }
            }}
          >
            {blockingDate && (() => {
              const dateKey = blockingDate.toISOString().split('T')[0];
              const daySeances = seancesByDate[dateKey] || [];
              return daySeances.every(s => s.bloque) ? 'Débloquer' : 'Bloquer';
            })()}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPlanning;

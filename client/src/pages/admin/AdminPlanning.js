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
  Alert
} from '@mui/material';
import { CalendarToday, Block, CheckCircle, Movie, AccessTime } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminPlanning = () => {
  const [salles, setSalles] = useState([]);
  const [selectedSalle, setSelectedSalle] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [raisonBlocage, setRaisonBlocage] = useState('');

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
      const response = await axios.get(`${API_URL}/seances/planning/${selectedSalle}`, {
        params: { date: selectedDate }
      });
      setSeances(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  }, [selectedSalle, selectedDate]);

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

  const selectedSalleData = salles.find(s => s._id === selectedSalle);

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="mb-6 font-bold">
        <CalendarToday className="mr-2" />
        Planning des salles
      </Typography>

      <Paper className="p-4 mb-4">
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Salle</InputLabel>
              <Select
                value={selectedSalle}
                onChange={(e) => setSelectedSalle(e.target.value)}
              >
                {salles.map((salle) => (
                  <MenuItem key={salle._id} value={salle._id}>
                    {salle.nom} - {getTypeLabel(salle.type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  backgroundColor: '#1a1a1a',
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
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                  cursor: 'pointer',
                },
              }}
            />
          </Grid>
          {selectedSalleData && (
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="textSecondary">
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
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {seances.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                Aucune séance programmée pour cette date
              </Alert>
            </Grid>
          ) : (
            seances.map((seance) => (
              <Grid item xs={12} sm={6} md={4} key={seance._id}>
                <Card className={seance.bloque ? 'opacity-75 border-2 border-red-500' : ''}>
                  <CardContent>
                    <Box className="flex justify-between items-start mb-2">
                      <Box>
                        <Typography variant="h6" className="font-semibold">
                          <Movie className="mr-1" fontSize="small" />
                          {seance.film?.titre || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" className="mt-1">
                          <AccessTime className="mr-1" fontSize="small" />
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

                    <Box className="mt-2 space-y-1">
                      <Typography variant="body2">
                        Places: {seance.placesDisponibles} / {seance.placesTotal}
                      </Typography>
                      <Typography variant="body2">
                        Prix: {seance.prix} €
                      </Typography>
                      {seance.placesDisponibles === 0 && (
                        <Chip
                          label="Complet"
                          color="warning"
                          size="small"
                          className="mt-1"
                        />
                      )}
                      {seance.bloque && seance.raisonBlocage && (
                        <Alert severity="warning" className="mt-2">
                          {seance.raisonBlocage}
                        </Alert>
                      )}
                    </Box>

                    <Box className="mt-3">
                      <Button
                        fullWidth
                        variant={seance.bloque ? 'outlined' : 'contained'}
                        color={seance.bloque ? 'success' : 'error'}
                        startIcon={seance.bloque ? <CheckCircle /> : <Block />}
                        onClick={() => handleBlock(seance)}
                        size="small"
                      >
                        {seance.bloque ? 'Débloquer' : 'Bloquer'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      <Dialog open={openBlockDialog} onClose={() => setOpenBlockDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSeance?.bloque ? 'Débloquer la séance' : 'Bloquer la séance'}
        </DialogTitle>
        <DialogContent>
          <Box className="mt-2">
            <Typography variant="body2" className="mb-2">
              Film: {selectedSeance?.film?.titre}
            </Typography>
            <Typography variant="body2" className="mb-4">
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBlockDialog(false)}>Annuler</Button>
          <Button
            onClick={handleBlockConfirm}
            variant="contained"
            color={selectedSeance?.bloque ? 'success' : 'error'}
          >
            {selectedSeance?.bloque ? 'Débloquer' : 'Bloquer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPlanning;


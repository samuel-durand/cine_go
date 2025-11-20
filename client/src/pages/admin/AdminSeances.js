import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, Event } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminSeances = () => {
  const [seances, setSeances] = useState([]);
  const [films, setFilms] = useState([]);
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSeance, setEditingSeance] = useState(null);
  const [formData, setFormData] = useState({
    film: '',
    date: '',
    heure: '',
    salle: '',
    placesTotal: 100,
    prix: ''
  });

  useEffect(() => {
    fetchSeances();
    fetchFilms();
    fetchSalles();
  }, []);

  const fetchSeances = async () => {
    try {
      const response = await axios.get(`${API_URL}/seances/all`);
      setSeances(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const fetchFilms = async () => {
    try {
      const response = await axios.get(`${API_URL}/films/all`);
      setFilms(response.data.filter(f => f.actif));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchSalles = async () => {
    try {
      const response = await axios.get(`${API_URL}/salles/all`);
      setSalles(response.data.filter(s => s.actif));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleOpen = (seance = null) => {
    if (seance) {
      setEditingSeance(seance);
      setFormData({
        film: seance.film._id || seance.film,
        date: seance.date ? new Date(seance.date).toISOString().split('T')[0] : '',
        heure: seance.heure || '',
        salle: seance.salle?._id || seance.salle || '',
        placesTotal: seance.placesTotal || 100,
        prix: seance.prix || ''
      });
    } else {
      setEditingSeance(null);
      setFormData({
        film: '',
        date: '',
        heure: '',
        salle: '',
        placesTotal: 100,
        prix: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSeance(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        placesTotal: parseInt(formData.placesTotal),
        prix: parseFloat(formData.prix)
      };

      if (editingSeance) {
        await axios.put(`${API_URL}/seances/${editingSeance._id}`, data);
      } else {
        await axios.post(`${API_URL}/seances`, data);
      }
      fetchSeances();
      handleClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
      try {
        await axios.delete(`${API_URL}/seances/${id}`);
        fetchSeances();
      } catch (error) {
        console.error('Erreur:', error);
      }
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
    <Container maxWidth="lg" className="py-8">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">
          <Event className="mr-2" />
          Gestion des séances
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Ajouter une séance
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Film</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Heure</TableCell>
              <TableCell>Salle</TableCell>
              <TableCell>Places</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seances.map((seance) => (
              <TableRow key={seance._id}>
                <TableCell>{seance.film?.titre || 'N/A'}</TableCell>
                <TableCell>{new Date(seance.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>{seance.heure}</TableCell>
                <TableCell>
                  {seance.salle?.nom || 'N/A'}
                  {seance.salle?.type && (
                    <Chip
                      label={seance.salle.type}
                      size="small"
                      className="ml-2"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {seance.placesDisponibles} / {seance.placesTotal}
                </TableCell>
                <TableCell>{seance.prix} €</TableCell>
                <TableCell>
                  <Chip
                    label={seance.actif ? 'Actif' : 'Inactif'}
                    color={seance.actif ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(seance)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(seance._id)} size="small" color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSeance ? 'Modifier la séance' : 'Ajouter une séance'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box className="space-y-4">
              <TextField
                fullWidth
                select
                label="Film"
                value={formData.film}
                onChange={(e) => setFormData({ ...formData, film: e.target.value })}
                required
              >
                {films.map((film) => (
                  <MenuItem key={film._id} value={film._id}>
                    {film.titre}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
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
              <TextField
                fullWidth
                label="Heure (HH:MM)"
                value={formData.heure}
                onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                placeholder="14:30"
                required
              />
              <TextField
                fullWidth
                select
                label="Salle"
                value={formData.salle}
                onChange={(e) => {
                  const selectedSalle = salles.find(s => s._id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    salle: e.target.value,
                    placesTotal: selectedSalle?.capacite || formData.placesTotal
                  });
                }}
                required
              >
                {salles.map((salle) => (
                  <MenuItem key={salle._id} value={salle._id}>
                    {salle.nom} - {salle.type} ({salle.capacite} places)
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Nombre de places"
                type="number"
                value={formData.placesTotal}
                onChange={(e) => setFormData({ ...formData, placesTotal: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Prix (€)"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.prix}
                onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingSeance ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminSeances;


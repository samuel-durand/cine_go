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
  CircularProgress,
  Chip
} from '@mui/material';
import { Add, Edit, Delete, Movie } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminFilms = () => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    duree: '',
    genre: '',
    realisateur: '',
    acteurs: '',
    image: '',
    dateSortie: '',
    note: '',
    prix: '',
    actif: true
  });

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      const response = await axios.get(`${API_URL}/films/all`);
      setFilms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleOpen = (film = null) => {
    if (film) {
      setEditingFilm(film);
      setFormData({
        ...film,
        acteurs: film.acteurs?.join(', ') || '',
        dateSortie: film.dateSortie ? new Date(film.dateSortie).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingFilm(null);
      setFormData({
        titre: '',
        description: '',
        duree: '',
        genre: '',
        realisateur: '',
        acteurs: '',
        image: '',
        dateSortie: '',
        note: '',
        prix: '',
        actif: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingFilm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        acteurs: formData.acteurs.split(',').map(a => a.trim()).filter(a => a),
        duree: parseInt(formData.duree),
        note: parseFloat(formData.note),
        prix: parseFloat(formData.prix)
      };

      if (editingFilm) {
        await axios.put(`${API_URL}/films/${editingFilm._id}`, data);
      } else {
        await axios.post(`${API_URL}/films`, data);
      }
      fetchFilms();
      handleClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce film ?')) {
      try {
        await axios.delete(`${API_URL}/films/${id}`);
        fetchFilms();
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
          <Movie className="mr-2" />
          Gestion des films
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Ajouter un film
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {films.map((film) => (
              <TableRow key={film._id}>
                <TableCell>{film.titre}</TableCell>
                <TableCell>{film.genre}</TableCell>
                <TableCell>{film.duree} min</TableCell>
                <TableCell>{film.prix} €</TableCell>
                <TableCell>
                  <Chip
                    label={film.actif ? 'Actif' : 'Inactif'}
                    color={film.actif ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(film)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(film._id)} size="small" color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFilm ? 'Modifier le film' : 'Ajouter un film'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box className="space-y-4">
              <TextField
                fullWidth
                label="Titre"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <Box className="grid grid-cols-2 gap-4">
                <TextField
                  label="Durée (min)"
                  type="number"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                  required
                />
                <TextField
                  label="Genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  required
                />
              </Box>
              <TextField
                fullWidth
                label="Réalisateur"
                value={formData.realisateur}
                onChange={(e) => setFormData({ ...formData, realisateur: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Acteurs (séparés par des virgules)"
                value={formData.acteurs}
                onChange={(e) => setFormData({ ...formData, acteurs: e.target.value })}
              />
              <TextField
                fullWidth
                label="URL de l'image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
              <Box className="grid grid-cols-2 gap-4">
                <TextField
                  label="Date de sortie"
                  type="date"
                  value={formData.dateSortie}
                  onChange={(e) => setFormData({ ...formData, dateSortie: e.target.value })}
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
                  label="Note (0-10)"
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 0.1 }}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </Box>
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
              {editingFilm ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminFilms;


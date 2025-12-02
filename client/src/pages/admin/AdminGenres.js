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
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add, Edit, Delete, Category } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminGenres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    actif: true
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/genres/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGenres(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleOpen = (genre = null) => {
    if (genre) {
      setEditingGenre(genre);
      setFormData({
        nom: genre.nom,
        description: genre.description || '',
        actif: genre.actif !== undefined ? genre.actif : true
      });
    } else {
      setEditingGenre(null);
      setFormData({
        nom: '',
        description: '',
        actif: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingGenre(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      if (editingGenre) {
        await axios.put(`${API_URL}/genres/${editingGenre._id}`, formData, config);
      } else {
        await axios.post(`${API_URL}/genres`, formData, config);
      }
      fetchGenres();
      handleClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce genre ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/genres/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchGenres();
      } catch (error) {
        console.error('Erreur:', error);
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
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
          <Category className="mr-2" />
          Gestion des genres
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Ajouter un genre
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {genres.map((genre) => (
              <TableRow key={genre._id}>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {genre.nom.charAt(0).toUpperCase() + genre.nom.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell>{genre.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={genre.actif ? 'Actif' : 'Inactif'}
                    color={genre.actif ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(genre)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(genre._id)} size="small" color="error">
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
          {editingGenre ? 'Modifier le genre' : 'Ajouter un genre'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box className="space-y-4">
              <TextField
                fullWidth
                label="Nom du genre"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                helperText="Le nom sera automatiquement converti en minuscules"
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  />
                }
                label="Actif"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingGenre ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminGenres;


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
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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
      setPreviewImage(film.image || null);
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
      setPreviewImage(null);
    }
    setImageFile(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingFilm(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const submitData = new FormData();
      submitData.append('titre', formData.titre);
      submitData.append('description', formData.description);
      submitData.append('duree', formData.duree);
      submitData.append('genre', formData.genre);
      submitData.append('realisateur', formData.realisateur);
      submitData.append('acteurs', formData.acteurs);
      submitData.append('dateSortie', formData.dateSortie);
      submitData.append('prix', formData.prix);
      submitData.append('note', formData.note || '0');
      submitData.append('actif', formData.actif);

      // Si une image est sélectionnée, l'ajouter
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image && !imageFile) {
        // Si URL image existante sans nouveau fichier, garder l'URL
        submitData.append('image', formData.image);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      // Ajouter le token d'authentification
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      if (editingFilm) {
        await axios.put(`${API_URL}/films/${editingFilm._id}`, submitData, config);
      } else {
        await axios.post(`${API_URL}/films`, submitData, config);
      }
      fetchFilms();
      handleClose();
      setImageFile(null);
      setPreviewImage(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setUploading(false);
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
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: '#CCCCCC' }}>
                  Image du film
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    sx={{
                      mb: 2,
                      borderColor: 'rgba(255, 215, 0, 0.3)',
                      color: '#FFD700',
                      '&:hover': {
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      },
                    }}
                  >
                    {imageFile ? 'Changer l\'image' : 'Choisir une image'}
                  </Button>
                </label>
                {(previewImage || formData.image) && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <img
                      src={previewImage || (formData.image?.startsWith('/') ? `${API_URL}${formData.image}` : formData.image)}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                )}
                {!imageFile && (
                  <TextField
                    fullWidth
                    label="Ou entrer une URL d'image"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setPreviewImage(e.target.value || null);
                    }}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
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
            <Button onClick={handleClose} disabled={uploading}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={uploading}>
              {uploading ? 'Enregistrement...' : (editingFilm ? 'Modifier' : 'Ajouter')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminFilms;


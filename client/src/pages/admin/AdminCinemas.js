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

const AdminCinemas = () => {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    ville: '',
    codePostal: '',
    telephone: '',
    email: '',
    description: '',
    image: '',
    actif: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/cinemas/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCinemas(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleOpen = (cinema = null) => {
    if (cinema) {
      setEditingCinema(cinema);
      setFormData({
        ...cinema
      });
      setPreviewImage(cinema.image || null);
    } else {
      setEditingCinema(null);
      setFormData({
        nom: '',
        adresse: '',
        ville: '',
        codePostal: '',
        telephone: '',
        email: '',
        description: '',
        image: '',
        actif: true
      });
      setPreviewImage(null);
    }
    setImageFile(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCinema(null);
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
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
      submitData.append('nom', formData.nom);
      submitData.append('adresse', formData.adresse);
      submitData.append('ville', formData.ville);
      submitData.append('codePostal', formData.codePostal);
      submitData.append('telephone', formData.telephone || '');
      submitData.append('email', formData.email || '');
      submitData.append('description', formData.description || '');
      submitData.append('actif', formData.actif);

      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image && !imageFile) {
        submitData.append('image', formData.image);
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      };

      if (editingCinema) {
        await axios.put(`${API_URL}/cinemas/${editingCinema._id}`, submitData, config);
      } else {
        await axios.post(`${API_URL}/cinemas`, submitData, config);
      }
      fetchCinemas();
      handleClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cinéma ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/cinemas/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCinemas();
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
          <Movie className="mr-2" />
          Gestion des cinémas
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Ajouter un cinéma
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Ville</TableCell>
              <TableCell>Adresse</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cinemas.map((cinema) => (
              <TableRow key={cinema._id}>
                <TableCell>{cinema.nom}</TableCell>
                <TableCell>{cinema.ville}</TableCell>
                <TableCell>{cinema.adresse}</TableCell>
                <TableCell>{cinema.telephone || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={cinema.actif ? 'Actif' : 'Inactif'}
                    color={cinema.actif ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(cinema)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cinema._id)} size="small" color="error">
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
          {editingCinema ? 'Modifier le cinéma' : 'Ajouter un cinéma'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box className="space-y-4">
              <TextField
                fullWidth
                label="Nom du cinéma"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                required
              />
              <Box className="grid grid-cols-2 gap-4">
                <TextField
                  label="Ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  required
                />
                <TextField
                  label="Code postal"
                  value={formData.codePostal}
                  onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                  required
                />
              </Box>
              <Box className="grid grid-cols-2 gap-4">
                <TextField
                  label="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Box>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: '#CCCCCC' }}>
                  Image du cinéma
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="cinema-image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="cinema-image-upload">
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
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={uploading}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={uploading}>
              {uploading ? 'Enregistrement...' : (editingCinema ? 'Modifier' : 'Ajouter')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminCinemas;


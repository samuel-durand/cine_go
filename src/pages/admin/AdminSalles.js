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
import { Add, Edit, Delete, Room } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminSalles = () => {
  const [salles, setSalles] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSalle, setEditingSalle] = useState(null);
  const [formData, setFormData] = useState({
    cinema: '',
    nom: '',
    type: 'classic',
    capacite: 100,
    description: '',
    equipements: '',
    actif: true
  });

  useEffect(() => {
    fetchSalles();
    fetchCinemas();
  }, []);

  const fetchSalles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/salles/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const fetchCinemas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/cinemas/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCinemas(response.data.filter(c => c.actif));
    } catch (error) {
      console.error('Erreur lors du chargement des cinémas:', error);
    }
  };

  const handleOpen = (salle = null) => {
    if (salle) {
      setEditingSalle(salle);
      setFormData({
        ...salle,
        cinema: salle.cinema?._id || salle.cinema || '',
        equipements: salle.equipements?.join(', ') || ''
      });
    } else {
      setEditingSalle(null);
      setFormData({
        cinema: '',
        nom: '',
        type: 'classic',
        capacite: 100,
        description: '',
        equipements: '',
        actif: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSalle(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const data = {
        ...formData,
        capacite: parseInt(formData.capacite),
        equipements: formData.equipements.split(',').map(e => e.trim()).filter(e => e)
      };

      if (editingSalle) {
        await axios.put(`${API_URL}/salles/${editingSalle._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/salles`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchSalles();
      handleClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/salles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSalles();
      } catch (error) {
        console.error('Erreur:', error);
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      }
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
          <Room className="mr-2" />
          Gestion des salles
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Ajouter une salle
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Cinéma</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Capacité</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salles.map((salle) => (
              <TableRow key={salle._id}>
                <TableCell>{salle.nom}</TableCell>
                <TableCell>{salle.cinema?.nom || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={getTypeLabel(salle.type)}
                    color={getTypeColor(salle.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{salle.capacite} places</TableCell>
                <TableCell>{salle.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={salle.actif ? 'Actif' : 'Inactif'}
                    color={salle.actif ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(salle)} size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(salle._id)} size="small" color="error">
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
          {editingSalle ? 'Modifier la salle' : 'Ajouter une salle'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box className="space-y-4">
              <TextField
                fullWidth
                select
                label="Cinéma"
                value={formData.cinema}
                onChange={(e) => setFormData({ ...formData, cinema: e.target.value })}
                required
              >
                {cinemas.map((cinema) => (
                  <MenuItem key={cinema._id} value={cinema._id}>
                    {cinema.nom} - {cinema.ville}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Nom de la salle"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
              <TextField
                fullWidth
                select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <MenuItem value="classic">Classic</MenuItem>
                <MenuItem value="vip">VIP</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="imax">IMAX</MenuItem>
                <MenuItem value="4dx">4DX</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Capacité (nombre de places)"
                type="number"
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                required
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <TextField
                fullWidth
                label="Équipements (séparés par des virgules)"
                value={formData.equipements}
                onChange={(e) => setFormData({ ...formData, equipements: e.target.value })}
                placeholder="Ex: Son Dolby Atmos, Écran 4K, Sièges inclinables..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingSalle ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminSalles;


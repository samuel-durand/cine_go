import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
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
  Button,
  MenuItem,
  CircularProgress,
  Chip,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Receipt, Visibility } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [statusForm, setStatusForm] = useState({ statut: '', paiement: '' });

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API_URL}/reservations/all`);
      setReservations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleView = (reservation) => {
    setSelectedReservation(reservation);
    setStatusForm({
      statut: reservation.statut,
      paiement: reservation.paiement
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedReservation(null);
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.put(
        `${API_URL}/reservations/${selectedReservation._id}/status`,
        statusForm
      );
      fetchReservations();
      handleClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'confirmee':
        return 'success';
      case 'annulee':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'confirmee':
        return 'Confirmée';
      case 'annulee':
        return 'Annulée';
      default:
        return 'En attente';
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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#FFFFFF',
        padding: { xs: '24px', md: '40px' },
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 700,
            color: '#FFD700',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Receipt />
          Gestion des réservations
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
          }}
        >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Film</TableCell>
              <TableCell>Date séance</TableCell>
              <TableCell>Places</TableCell>
              <TableCell>Prix total</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Paiement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation._id}>
                <TableCell>
                  {reservation.user?.prenom} {reservation.user?.nom}
                </TableCell>
                <TableCell>{reservation.seance?.film?.titre || 'N/A'}</TableCell>
                <TableCell>
                  {reservation.seance?.date
                    ? new Date(reservation.seance.date).toLocaleDateString('fr-FR')
                    : 'N/A'}{' '}
                  {reservation.seance?.heure}
                </TableCell>
                <TableCell>{reservation.nombrePlaces}</TableCell>
                <TableCell>{reservation.prixTotal} €</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(reservation.statut)}
                    color={getStatusColor(reservation.statut)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={reservation.paiement}
                    color={reservation.paiement === 'paye' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleView(reservation)} size="small">
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFD700', fontWeight: 700 }}>
          Détails de la réservation
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Utilisateur:</strong> {selectedReservation.user?.prenom}{' '}
                {selectedReservation.user?.nom}
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Email:</strong> {selectedReservation.user?.email}
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Film:</strong> {selectedReservation.seance?.film?.titre}
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Date:</strong> {new Date(selectedReservation.seance?.date).toLocaleDateString('fr-FR')} à{' '}
                {selectedReservation.seance?.heure}
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Salle:</strong> {selectedReservation.seance?.salle?.nom || selectedReservation.seance?.salle || 'N/A'}
                {selectedReservation.seance?.salle?.type && ` - ${selectedReservation.seance.salle.type.toUpperCase()}`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Places:</strong> {selectedReservation.nombrePlaces}
              </Typography>
              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                <strong style={{ color: '#FFD700' }}>Prix total:</strong> {selectedReservation.prixTotal} €
              </Typography>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel sx={{ color: '#CCCCCC' }}>Statut</InputLabel>
                <Select
                  value={statusForm.statut}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, statut: e.target.value })
                  }
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
                  label="Statut"
                >
                  <MenuItem value="en_attente">En attente</MenuItem>
                  <MenuItem value="confirmee">Confirmée</MenuItem>
                  <MenuItem value="annulee">Annulée</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: '#CCCCCC' }}>Paiement</InputLabel>
                <Select
                  value={statusForm.paiement}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, paiement: e.target.value })
                  }
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
                  label="Paiement"
                >
                  <MenuItem value="en_attente">En attente</MenuItem>
                  <MenuItem value="paye">Payé</MenuItem>
                  <MenuItem value="rembourse">Remboursé</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: 3, borderTop: '1px solid rgba(255, 215, 0, 0.1)' }}>
          <Button
            onClick={handleClose}
            sx={{
              color: '#CCCCCC',
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            Fermer
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            sx={{
              backgroundColor: '#FFD700',
              color: '#000000',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#FFA500',
              },
            }}
          >
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default AdminReservations;


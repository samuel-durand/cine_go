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
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography as MuiTypography
} from '@mui/material';
import { People, Delete, Visibility } from '@mui/icons-material';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const handleView = async (user) => {
    setSelectedUser(user);
    try {
      const response = await axios.get(`${API_URL}/users/${user._id}/stats`);
      setUserStats(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
    setUserStats(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await axios.delete(`${API_URL}/users/${id}`);
        fetchUsers();
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
      <Typography variant="h4" className="mb-6 font-bold">
        <People className="mr-2" />
        Gestion des utilisateurs
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {user.prenom} {user.nom}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.telephone || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleView(user)} size="small">
                    <Visibility />
                  </IconButton>
                  {user.role !== 'admin' && (
                    <IconButton
                      onClick={() => handleDelete(user._id)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de l'utilisateur</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box className="space-y-4 mt-2">
              <MuiTypography variant="body2" color="textSecondary">
                <strong>Nom:</strong> {selectedUser.prenom} {selectedUser.nom}
              </MuiTypography>
              <MuiTypography variant="body2" color="textSecondary">
                <strong>Email:</strong> {selectedUser.email}
              </MuiTypography>
              <MuiTypography variant="body2" color="textSecondary">
                <strong>Téléphone:</strong> {selectedUser.telephone || 'N/A'}
              </MuiTypography>
              <MuiTypography variant="body2" color="textSecondary">
                <strong>Rôle:</strong> {selectedUser.role}
              </MuiTypography>
              <MuiTypography variant="body2" color="textSecondary">
                <strong>Date d'inscription:</strong>{' '}
                {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
              </MuiTypography>
              {userStats && (
                <Box className="mt-4 p-4 bg-gray-100 rounded">
                  <MuiTypography variant="h6" className="mb-2">
                    Statistiques
                  </MuiTypography>
                  <MuiTypography variant="body2">
                    Total réservations: {userStats.totalReservations}
                  </MuiTypography>
                  <MuiTypography variant="body2">
                    Réservations confirmées: {userStats.reservationsConfirmees}
                  </MuiTypography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;


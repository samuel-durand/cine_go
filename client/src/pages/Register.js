import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/common/AuthLayout';

const FIELDS = [
  { name: 'prenom', label: 'Prénom', required: true, half: true, autoComplete: 'given-name' },
  { name: 'nom', label: 'Nom', required: true, half: true, autoComplete: 'family-name' },
  { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
  { name: 'telephone', label: 'Téléphone', type: 'tel', half: true, autoComplete: 'tel' },
  { name: 'dateNaissance', label: 'Date de naissance', type: 'date', half: true, shrink: true },
  { name: 'password', label: 'Mot de passe', type: 'password', required: true, half: true, autoComplete: 'new-password', helperText: '6 caractères minimum' },
  { name: 'confirmPassword', label: 'Confirmer', type: 'password', required: true, half: true, autoComplete: 'new-password' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', password: '', confirmPassword: '', telephone: '', dateNaissance: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    const { confirmPassword, ...userData } = formData;
    setSubmitting(true);
    const result = await register(userData);
    setSubmitting(false);
    if (result.success) navigate('/');
    else setError(result.message);
  };

  return (
    <AuthLayout title="Créer un compte" subtitle="Réservez vos places et retrouvez vos billets en un clic." maxWidth="sm">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {FIELDS.map((f) => (
            <Grid item xs={12} sm={f.half ? 6 : 12} key={f.name}>
              <TextField
                fullWidth
                name={f.name}
                label={f.label}
                type={f.type || 'text'}
                value={formData[f.name]}
                onChange={handleChange}
                required={f.required}
                autoComplete={f.autoComplete}
                helperText={f.helperText}
                InputLabelProps={f.shrink ? { shrink: true } : undefined}
              />
            </Grid>
          ))}
        </Grid>
        <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ mt: 3 }}>
          S'inscrire
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
        Déjà inscrit ?{' '}
        <Box component={Link} to="/login" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Se connecter
        </Box>
      </Typography>
    </AuthLayout>
  );
};

export default Register;

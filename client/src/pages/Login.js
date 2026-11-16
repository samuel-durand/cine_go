import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import AuthLayout from '../components/common/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      // Retour à la page d'origine (ex. réservation) si on y a été redirigé
      navigate(location.state?.from || '/');
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à vos billets et réservez plus vite.">
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" fullWidth />
        <TextField label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" fullWidth />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ mt: 1 }}>
          Se connecter
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
        Pas encore de compte ?{' '}
        <Box component={Link} to="/register" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Créer un compte
        </Box>
      </Typography>
    </AuthLayout>
  );
};

export default Login;

import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar
} from '@mui/material';
import { Movie, Person, History, Dashboard, ExitToApp } from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#000000',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
      }}
    >
      <Toolbar 
        sx={{ 
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Movie sx={{ color: '#FFD700', mr: 1, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              color: '#FFD700',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.25rem',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            Ciné Go
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            component={Link} 
            to="/films"
            sx={{ 
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            Films
          </Button>
          <Button 
            component={Link} 
            to="/cinemas"
            sx={{ 
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            Cinémas
          </Button>
          
          {user ? (
            <>
              {isAdmin && (
                <Button
                  component={Link}
                  to="/admin"
                  startIcon={<Dashboard />}
                  sx={{ 
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    },
                  }}
                >
                  Admin
                </Button>
              )}
              <IconButton
                size="large"
                onClick={handleMenu}
                sx={{ color: '#FFFFFF' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#FFD700', color: '#000000' }}>
                  {user.prenom?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    backgroundColor: '#1a1a1a',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                  },
                }}
              >
                <MenuItem 
                  component={Link} 
                  to="/profile" 
                  onClick={handleClose}
                  sx={{ 
                    '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
                  }}
                >
                  <Person sx={{ mr: 2, color: '#FFD700' }} /> Profil
                </MenuItem>
                <MenuItem 
                  component={Link} 
                  to="/history" 
                  onClick={handleClose}
                  sx={{ 
                    '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
                  }}
                >
                  <History sx={{ mr: 2, color: '#FFD700' }} /> Historique
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
                  }}
                >
                  <ExitToApp sx={{ mr: 2, color: '#FFD700' }} /> Déconnexion
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                component={Link} 
                to="/login"
                sx={{ 
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
              >
                Connexion
              </Button>
              <Button
                variant="contained"
                component={Link}
                to="/register"
                sx={{
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#FFA500',
                  },
                }}
              >
                Inscription
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;


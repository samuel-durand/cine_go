import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Lazy loading des pages pour améliorer les performances
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Films = lazy(() => import('./pages/Films'));
const FilmDetail = lazy(() => import('./pages/FilmDetail'));
const Cinemas = lazy(() => import('./pages/Cinemas'));
const CinemaDetail = lazy(() => import('./pages/CinemaDetail'));
const Reservation = lazy(() => import('./pages/Reservation'));
const Ticket = lazy(() => import('./pages/Ticket'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminFilms = lazy(() => import('./pages/admin/AdminFilms'));
const AdminCinemas = lazy(() => import('./pages/admin/AdminCinemas'));
const AdminSalles = lazy(() => import('./pages/admin/AdminSalles'));
const AdminSeances = lazy(() => import('./pages/admin/AdminSeances'));
const AdminPlanning = lazy(() => import('./pages/admin/AdminPlanning'));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

// Composant de chargement
const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

const theme = createTheme({
  palette: {
    mode: 'dark', // Mode sombre
    primary: {
      main: '#FFD700', // Jaune doré
      dark: '#FFA500', // Orange/jaune foncé
      light: '#FFF8DC', // Jaune très clair
      contrastText: '#000000',
    },
    secondary: {
      main: '#000000', // Noir
      dark: '#1a1a1a',
      light: '#333333',
      contrastText: '#FFD700',
    },
    background: {
      default: '#121212',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="min-h-screen" style={{ backgroundColor: '#121212' }}>
            <Navbar />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/films" element={<Films />} />
                <Route path="/films/:id" element={<FilmDetail />} />
                <Route path="/cinemas" element={<Cinemas />} />
                <Route path="/cinemas/:id" element={<CinemaDetail />} />
              <Route
                path="/reservation/:seanceId"
                element={
                  <PrivateRoute>
                    <Reservation />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ticket/:id"
                element={
                  <PrivateRoute>
                    <Ticket />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PrivateRoute>
                      <History />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/films"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminFilms />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/cinemas"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminCinemas />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/salles"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminSalles />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/seances"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminSeances />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/planning"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminPlanning />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/reservations"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminReservations />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminUsers />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { AdminRedirect, AdminTokenGuard } from './components/AdminTokenRoute';
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
const AdminGenres = lazy(() => import('./pages/admin/AdminGenres'));
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
    mode: 'dark',
    primary: {
      main: '#FFD700', // Jaune doré (identité Ciné Go)
      dark: '#E6A800',
      light: '#FFE55C',
      contrastText: '#000000',
    },
    secondary: {
      main: '#90caf9',
      dark: '#5d99c6',
      light: '#c3fdff',
      contrastText: '#000000',
    },
    background: {
      default: '#0f1014',
      paper: '#17181e',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.65)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    success: { main: '#34d399' },
    error: { main: '#f87171' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3.5rem',
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 24px',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          boxShadow: '0 4px 14px rgba(255, 215, 0, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(255, 215, 0, 0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 215, 0, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 215, 0, 0.7)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid',
        },
        standardError: {
          borderColor: 'rgba(248, 113, 113, 0.3)',
          backgroundColor: 'rgba(248, 113, 113, 0.08)',
        },
        standardWarning: {
          borderColor: 'rgba(251, 191, 36, 0.3)',
          backgroundColor: 'rgba(251, 191, 36, 0.08)',
        },
        standardSuccess: {
          borderColor: 'rgba(52, 211, 153, 0.3)',
          backgroundColor: 'rgba(52, 211, 153, 0.08)',
        },
        standardInfo: {
          borderColor: 'rgba(144, 202, 249, 0.3)',
          backgroundColor: 'rgba(144, 202, 249, 0.08)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#1c1d24',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#25262e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontSize: '0.75rem',
        },
        arrow: {
          color: '#25262e',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#1c1d24',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        head: {
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.85)',
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
          <div className="min-h-screen" style={{ backgroundColor: '#0f1014' }}>
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
                {/* /admin génère un jeton d'URL à chaque visite puis redirige
                    vers /admin/<jeton>/... ; les pages admin vérifient le jeton */}
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute adminOnly>
                      <AdminRedirect />
                    </PrivateRoute>
                  }
                />
                {[
                  { path: '', Page: AdminDashboard },
                  { path: '/films', Page: AdminFilms },
                  { path: '/genres', Page: AdminGenres },
                  { path: '/cinemas', Page: AdminCinemas },
                  { path: '/salles', Page: AdminSalles },
                  { path: '/seances', Page: AdminSeances },
                  { path: '/planning', Page: AdminPlanning },
                  { path: '/reservations', Page: AdminReservations },
                  { path: '/users', Page: AdminUsers },
                ].map(({ path, Page }) => (
                  <Route
                    key={path || 'dashboard'}
                    path={`/admin/:adminToken${path}`}
                    element={
                      <PrivateRoute adminOnly>
                        <AdminTokenGuard>
                          <Page />
                        </AdminTokenGuard>
                      </PrivateRoute>
                    }
                  />
                ))}
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


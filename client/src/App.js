import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { AdminRedirect, AdminTokenGuard } from './components/AdminTokenRoute';
import Navbar, { isOverlayRoute, isTunnelRoute } from './components/Navbar';
import { WatchlistProvider } from './context/WatchlistContext';
import Footer from './components/Footer';
import Loader from './components/common/Loader';

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
const Watchlist = lazy(() => import('./pages/Watchlist'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminFilms = lazy(() => import('./pages/admin/AdminFilms'));
const AdminGenres = lazy(() => import('./pages/admin/AdminGenres'));
const AdminCinemas = lazy(() => import('./pages/admin/AdminCinemas'));
const AdminSalles = lazy(() => import('./pages/admin/AdminSalles'));
const AdminSeances = lazy(() => import('./pages/admin/AdminSeances'));
const AdminPlanning = lazy(() => import('./pages/admin/AdminPlanning'));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

const ADMIN_PAGES = [
  { path: '', Page: AdminDashboard },
  { path: '/films', Page: AdminFilms },
  { path: '/genres', Page: AdminGenres },
  { path: '/cinemas', Page: AdminCinemas },
  { path: '/salles', Page: AdminSalles },
  { path: '/seances', Page: AdminSeances },
  { path: '/planning', Page: AdminPlanning },
  { path: '/reservations', Page: AdminReservations },
  { path: '/users', Page: AdminUsers },
];

// Remonte en haut de page à chaque changement de route
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Private = ({ children, adminOnly }) => <PrivateRoute adminOnly={adminOnly}>{children}</PrivateRoute>;

// Le header est fixe : les pages sans grand visuel commencent sous lui
const Main = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <Box component="main" sx={{ flex: 1, pt: isOverlayRoute(pathname) || isTunnelRoute(pathname) ? 0 : { xs: '60px', md: '72px' } }}>
      {children}
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <WatchlistProvider>
        <Router>
          <ScrollToTop />
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Navbar />
            <Main>
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/films" element={<Films />} />
                  <Route path="/films/:id" element={<FilmDetail />} />
                  <Route path="/cinemas" element={<Cinemas />} />
                  <Route path="/cinemas/:id" element={<CinemaDetail />} />
                  <Route path="/ma-liste" element={<Watchlist />} />
                  <Route path="/reservation/:seanceId" element={<Private><Reservation /></Private>} />
                  <Route path="/ticket/:id" element={<Private><Ticket /></Private>} />
                  <Route path="/profile" element={<Private><Profile /></Private>} />
                  <Route path="/history" element={<Private><History /></Private>} />
                  {/* /admin génère un jeton d'URL à chaque visite puis redirige
                      vers /admin/<jeton>/... ; les pages admin vérifient le jeton */}
                  <Route path="/admin" element={<Private adminOnly><AdminRedirect /></Private>} />
                  {ADMIN_PAGES.map(({ path, Page }) => (
                    <Route
                      key={path || 'dashboard'}
                      path={`/admin/:adminToken${path}`}
                      element={
                        <Private adminOnly>
                          <AdminTokenGuard>
                            <Page />
                          </AdminTokenGuard>
                        </Private>
                      }
                    />
                  ))}
                </Routes>
              </Suspense>
            </Main>
            <Footer />
          </Box>
        </Router>
        </WatchlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Button, IconButton, Avatar, Menu, MenuItem, ListItemIcon, Divider,
  Drawer, List, ListItemButton, ListItemText, Dialog, InputBase, Typography, Badge, Tooltip,
} from '@mui/material';
import {
  Movie, Person, ConfirmationNumber, Dashboard, Logout, Search, Menu as MenuIcon, Close, FavoriteBorder,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { useWatchlist } from '../context/WatchlistContext';
import api from '../utils/axiosConfig';
import { colors, headingFont } from '../theme';
import { formatDuration, genreName, imageUrl } from '../utils/format';

const NAV_LINKS = [
  { to: '/films', label: 'Films' },
  { to: '/cinemas', label: 'Cinémas' },
];

// Pages dont le grand visuel passe sous le header (header transparent tant qu'on n'a pas défilé)
export const isOverlayRoute = (pathname) =>
  pathname === '/' || /^\/films\/[^/]+$/.test(pathname) || /^\/cinemas\/[^/]+$/.test(pathname);

// Parcours de réservation : plein écran, sans la navigation du site
export const isTunnelRoute = (pathname) => pathname.startsWith('/reservation/');

const useScrolled = (threshold = 40) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
};

const Logo = () => (
  <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none' }}>
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: '8px',
        bgcolor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Movie sx={{ color: '#000', fontSize: 21 }} />
    </Box>
    <Typography
      sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.85rem' }, color: '#fff', lineHeight: 1, whiteSpace: 'nowrap' }}
    >
      CINÉ <Box component="span" sx={{ color: 'primary.main' }}>GO</Box>
    </Typography>
  </Box>
);

// Recherche instantanée de films (plein écran, comme sur les sites des grands réseaux)
const SearchDialog = ({ open, onClose }) => {
  const [films, setFilms] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (open && films.length === 0) {
      api.get('/films').then((res) => setFilms(res.data)).catch(() => {});
    }
    if (!open) setQuery('');
  }, [open, films.length]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return films.slice(0, 6);
    return films
      .filter((f) => f.titre.toLowerCase().includes(q) || (f.genre?.nom || '').includes(q) || (f.realisateur || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [films, query]);

  const go = (film) => {
    onClose();
    navigate(`/films/${film._id}`);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { mt: { xs: 2, md: 10 }, alignSelf: 'flex-start' } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 1.5, borderBottom: `1px solid ${colors.border}` }}>
        <Search sx={{ color: 'primary.main', mr: 1.5 }} />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Rechercher un film, un genre, un réalisateur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0])}
          sx={{ fontSize: '1.05rem' }}
        />
        <IconButton onClick={onClose} size="small" aria-label="Fermer">
          <Close />
        </IconButton>
      </Box>
      <Box sx={{ p: 1, maxHeight: 440, overflowY: 'auto' }}>
        {!query && (
          <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>
            À l'affiche
          </Typography>
        )}
        {results.map((film) => (
          <Box
            key={film._id}
            onClick={() => go(film)}
            sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.25, borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
          >
            <Box
              component="img"
              src={imageUrl(film.image)}
              alt=""
              sx={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 1, bgcolor: colors.paper }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} noWrap>{film.titre}</Typography>
              <Typography variant="body2" color="text.secondary">
                {[genreName(film), formatDuration(film.duree)].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          </Box>
        ))}
        {query && results.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Aucun film ne correspond à « {query} »
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};

const navLinkSx = {
  position: 'relative',
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 500,
  fontSize: '1.05rem',
  textDecoration: 'none',
  py: 3,
  '&:hover': { color: '#fff' },
  '&.active': { color: '#fff' },
  '&.active::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    borderRadius: 3,
    bgcolor: 'primary.main',
  },
};

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { ids: watchlist } = useWatchlist();
  const scrolled = useScrolled();
  const transparent = isOverlayRoute(location.pathname) && !scrolled && !drawerOpen;

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  if (isTunnelRoute(location.pathname)) return null;

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/');
  };

  const menuItem = (to, Icon, label) => (
    <MenuItem component={Link} to={to} onClick={() => setAnchorEl(null)}>
      <ListItemIcon><Icon fontSize="small" sx={{ color: 'primary.main' }} /></ListItemIcon>
      {label}
    </MenuItem>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: transparent ? 'transparent' : 'rgba(10, 10, 14, 0.97)',
          backgroundImage: transparent ? 'linear-gradient(180deg, rgba(10,10,14,0.75) 0%, rgba(10,10,14,0) 100%)' : 'none',
          backdropFilter: transparent ? 'none' : 'blur(12px)',
          borderBottom: transparent ? 'none' : `1px solid ${colors.border}`,
          boxShadow: 'none',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <Toolbar sx={{ maxWidth: 1600, width: '100%', mx: 'auto', px: { xs: 2, md: 4 }, minHeight: { xs: 60, md: 72 }, gap: { xs: 1, md: 4 } }}>
          <IconButton sx={{ display: { md: 'none' }, ml: -1 }} onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <MenuIcon />
          </IconButton>
          <Logo />

          <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 3.5, alignSelf: 'stretch', alignItems: 'center' }}>
            {NAV_LINKS.map((link) => (
              <Box key={link.to} component={NavLink} to={link.to} sx={navLinkSx}>
                {link.label}
              </Box>
            ))}
            {isAdmin && (
              <Box component={NavLink} to="/admin" sx={navLinkSx}>
                Admin
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 1 } }}>
            <IconButton onClick={() => setSearchOpen(true)} aria-label="Rechercher" sx={{ color: '#fff' }}>
              <Search />
            </IconButton>
            <Tooltip title="Ma liste">
              <IconButton component={Link} to="/ma-liste" aria-label="Ma liste" sx={{ color: '#fff' }}>
                <Badge badgeContent={watchlist.length} color="primary" max={99}>
                  <FavoriteBorder />
                </Badge>
              </IconButton>
            </Tooltip>

            {user ? (
              <>
                <Button
                  component={Link}
                  to="/history"
                  startIcon={<ConfirmationNumber />}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: '#fff', px: 2 }}
                >
                  Mes billets
                </Button>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Mon compte">
                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: '#000', fontWeight: 800, fontSize: '0.95rem' }}>
                    {user.prenom?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
                >
                  <Box sx={{ px: 2, py: 1.25 }}>
                    <Typography fontWeight={700}>{user.prenom} {user.nom}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
                  </Box>
                  <Divider />
                  {menuItem('/profile', Person, 'Mon profil')}
                  {menuItem('/history', ConfirmationNumber, 'Mes billets')}
                  {isAdmin && menuItem('/admin', Dashboard, 'Administration')}
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    Déconnexion
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" sx={{ color: '#fff', display: { xs: 'none', sm: 'inline-flex' } }}>
                  Connexion
                </Button>
                <Button component={Link} to="/register" variant="contained" color="primary" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  S'inscrire
                </Button>
                <IconButton component={Link} to="/login" aria-label="Connexion" sx={{ display: { sm: 'none' }, color: '#fff' }}>
                  <Person />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 280, bgcolor: colors.bgDeep } }}>
        <Box sx={{ p: 2.5 }}>
          <Logo />
        </Box>
        <Divider />
        <List>
          {[{ to: '/', label: 'Accueil' }, ...NAV_LINKS, { to: '/ma-liste', label: 'Ma liste' }].map((link) => (
            <ListItemButton key={link.to} component={NavLink} to={link.to} end sx={{ '&.active': { color: 'primary.main' } }}>
              <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          ))}
          {user && (
            <ListItemButton component={NavLink} to="/history" sx={{ '&.active': { color: 'primary.main' } }}>
              <ListItemText primary="Mes billets" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          )}
          {isAdmin && (
            <ListItemButton component={Link} to="/admin">
              <ListItemText primary="Administration" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          )}
          {!user && (
            <ListItemButton component={Link} to="/login">
              <ListItemText primary="Connexion" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          )}
        </List>
      </Drawer>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Grid, Typography } from '@mui/material';
import api from '../utils/axiosConfig';
import { colors, headingFont } from '../theme';
import { filmsAuCinema } from '../utils/format';

const linkSx = {
  color: 'rgba(255,255,255,0.8)',
  textDecoration: 'none',
  fontSize: '0.92rem',
  lineHeight: 1.4,
  '&:hover': { color: 'primary.main' },
};

const Column = ({ title, links }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{title}</Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
      {links.map((l) => (
        <Box key={l.label} component={Link} to={l.to} sx={linkSx}>
          {l.label}
        </Box>
      ))}
    </Box>
  </Box>
);

const Footer = () => {
  const { pathname } = useLocation();
  const [nouveautes, setNouveautes] = useState([]);
  const [villes, setVilles] = useState([]);

  useEffect(() => {
    api.get('/films').then((res) => setNouveautes(filmsAuCinema(res.data).slice(0, 4))).catch(() => {});
    api.get('/cinemas')
      .then((res) => setVilles([...new Set(res.data.map((c) => c.ville))].sort().slice(0, 5)))
      .catch(() => {});
  }, []);

  // Pas de pied de page dans l'administration ni dans le parcours de réservation
  if (pathname.startsWith('/admin') || pathname.startsWith('/reservation/')) return null;

  return (
    <Box component="footer" sx={{ bgcolor: colors.bgDeep, borderTop: `1px solid ${colors.border}`, mt: 6 }}>
      <Container maxWidth="xl" sx={{ py: 7, px: { xs: 2, md: 10 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Typography sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>
              CINÉ <Box component="span" sx={{ color: 'primary.main' }}>GO</Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 280 }}>
              Les films au cinéma près de chez vous. Choisissez votre séance, votre place et payez en ligne.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2.25}>
            <Column
              title="Les nouveautés à l'affiche"
              links={nouveautes.map((f) => ({ to: `/films/${f._id}`, label: f.titre }))}
            />
          </Grid>
          <Grid item xs={6} md={2.25}>
            <Column
              title="Films"
              links={[
                { to: '/films', label: 'Films actuellement au cinéma' },
                { to: '/films?tab=attendus', label: 'Les plus attendus' },
                { to: '/films?tab=prochainement', label: 'Toutes les sorties cinéma' },
                { to: '/ma-liste', label: 'Ma liste' },
              ]}
            />
          </Grid>
          <Grid item xs={6} md={2.25}>
            <Column
              title="Cinémas dans vos villes"
              links={[
                ...villes.map((v) => ({ to: `/cinemas?ville=${encodeURIComponent(v)}`, label: `Cinémas à ${v}` })),
                { to: '/cinemas', label: 'Tous les cinémas' },
              ]}
            />
          </Grid>
          <Grid item xs={6} md={2.25}>
            <Column
              title="Mon compte"
              links={[
                { to: '/history', label: 'Mes billets' },
                { to: '/profile', label: 'Mon profil' },
                { to: '/register', label: 'Créer mon compte' },
              ]}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 6, pt: 3, borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} Ciné Go — Tous droits réservés</Typography>
          <Typography variant="caption" color="text.secondary">Affiches et informations films : pathe.fr</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

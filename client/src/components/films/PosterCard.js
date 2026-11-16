import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Favorite, Movie } from '@mui/icons-material';
import { colors } from '../../theme';
import { formatCount, formatShortDate, imageUrl, isComingSoon, isNewRelease } from '../../utils/format';
import WatchlistButton from './WatchlistButton';

const Label = ({ children, gold }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      px: 1,
      py: 0.25,
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 700,
      lineHeight: 1.5,
      bgcolor: gold ? 'primary.main' : 'rgba(255,255,255,0.12)',
      color: gold ? '#000' : '#fff',
    }}
  >
    {children}
  </Box>
);

/**
 * Affiche de film : visuel 2:3 arrondi, cœur « Ma liste » en haut à droite,
 * titre, libellés (Nouveau / date de sortie) et avertissement éventuel.
 * `showEnvies` affiche le nombre de spectateurs qui veulent voir le film.
 */
const PosterCard = ({ film, showEnvies = false }) => {
  const soon = isComingSoon(film);
  return (
    <Box
      component={Link}
      to={`/films/${film._id}`}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover .poster-img': { transform: 'scale(1.04)' },
        '&:hover .poster-title': { color: 'primary.main' },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '2 / 3', borderRadius: '6px', overflow: 'hidden', bgcolor: colors.paper }}>
        {film.image ? (
          <Box
            component="img"
            className="poster-img"
            src={imageUrl(film.image)}
            alt={film.titre}
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }}
          />
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Movie sx={{ fontSize: 64, color: '#3a3b45' }} />
          </Box>
        )}
        <WatchlistButton filmId={film._id} sx={{ position: 'absolute', top: 8, right: 8 }} />
      </Box>

      <Typography className="poster-title" sx={{ mt: 1.25, fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, transition: 'color 0.15s ease' }}>
        {film.titre}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mt: 0.75 }}>
        {soon ? <Label>Sortie le {formatShortDate(film.dateSortie)}</Label> : isNewRelease(film, 10) && <Label gold>Nouveau</Label>}
        {showEnvies && film.envies > 0 && (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: '0.8rem', color: colors.textMuted }}>
            <Favorite sx={{ fontSize: 14, color: 'primary.main' }} />
            {formatCount(film.envies)}
          </Box>
        )}
      </Box>

      {film.avertissement && (
        <Typography
          sx={{
            mt: 0.75,
            fontSize: '0.75rem',
            lineHeight: 1.4,
            color: colors.textFaint,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {film.avertissement}
        </Typography>
      )}
    </Box>
  );
};

export default PosterCard;

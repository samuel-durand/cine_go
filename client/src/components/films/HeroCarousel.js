import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, PlayArrow } from '@mui/icons-material';
import { colors } from '../../theme';
import { formatDuration, formatReleaseDate, genreName, imageUrl, isComingSoon } from '../../utils/format';
import TrailerDialog from './TrailerDialog';
import WatchlistButton from './WatchlistButton';

const INTERVAL_MS = 7000;

const navSx = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.25)',
  bgcolor: 'rgba(10,10,14,0.4)',
  color: '#fff',
  cursor: 'pointer',
  display: { xs: 'none', md: 'flex' },
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': { bgcolor: 'primary.main', color: '#000', borderColor: 'primary.main' },
};

/**
 * Grand bandeau plein écran : visuel paysage du film (ou affiche floutée à défaut),
 * passant sous le header transparent, avec « Réserver maintenant » et « Ma liste ».
 */
const HeroCarousel = ({ films }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const count = films.length;

  useEffect(() => {
    if (paused || count < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  if (!count) return null;
  const film = films[index % count];
  const backdrop = imageUrl(film.backdrop);
  const poster = imageUrl(film.image);
  const soon = isComingSoon(film);
  const go = (dir) => setIndex((i) => (i + dir + count) % count);

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: { xs: '78vh', md: '88vh' },
        minHeight: { xs: 520, md: 620 },
        maxHeight: 900,
        display: 'flex',
        alignItems: 'flex-end',
        bgcolor: film.backdropColor || colors.bgDeep,
        transition: 'background-color 0.6s ease',
      }}
    >
      {(backdrop || poster) && (
        <Box
          key={film._id}
          sx={{
            position: 'absolute',
            inset: backdrop ? 0 : '-40px',
            backgroundImage: `url(${backdrop || poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            filter: backdrop ? 'none' : 'blur(28px) brightness(0.55)',
            animation: 'heroIn 0.9s ease',
            '@keyframes heroIn': { from: { opacity: 0, transform: 'scale(1.04)' }, to: { opacity: 1, transform: 'scale(1)' } },
          }}
        />
      )}
      {/* Dégradés : lisibilité du texte et fondu vers la page */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, rgba(15,16,20,0.85) 0%, rgba(15,16,20,0.35) 45%, rgba(15,16,20,0) 70%), linear-gradient(0deg, ${colors.bg} 0%, rgba(15,16,20,0) 45%), linear-gradient(180deg, rgba(15,16,20,0.6) 0%, rgba(15,16,20,0) 20%)`,
        }}
      />

      <Box component="button" aria-label="Film précédent" onClick={() => go(-1)} sx={{ ...navSx, left: 24 }}>
        <ChevronLeft />
      </Box>
      <Box component="button" aria-label="Film suivant" onClick={() => go(1)} sx={{ ...navSx, right: 24 }}>
        <ChevronRight />
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', px: { xs: 2, md: 10 }, pb: { xs: 7, md: 10 } }}>
        <Box sx={{ maxWidth: 620 }} key={`txt-${film._id}`}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontSize: '0.8rem' }}>
            {soon ? `Au cinéma le ${formatReleaseDate(film.dateSortie)}` : 'Actuellement au cinéma'}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.6rem', md: '4.5rem' }, mt: 0.5, mb: 1.5, textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>
            {film.titre}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, fontWeight: 500 }}>
            {[genreName(film), formatDuration(film.duree), film.realisateur && `De ${film.realisateur}`].filter(Boolean).join('  |  ')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button component={Link} to={`/films/${film._id}${soon ? '' : '#seances'}`} variant="contained" size="large">
              {soon ? 'Découvrir le film' : 'Réserver maintenant'}
            </Button>
            {film.trailerUrl && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => setTrailerOpen(true)}
                sx={{ bgcolor: 'rgba(10,10,14,0.35)', backdropFilter: 'blur(6px)' }}
              >
                Bande-annonce
              </Button>
            )}
            <WatchlistButton filmId={film._id} variant="button" sx={{ bgcolor: 'rgba(10,10,14,0.35)', backdropFilter: 'blur(6px)' }} />
          </Box>
        </Box>
      </Container>

      {count > 1 && (
        <Box sx={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
          {films.map((f, i) => (
            <Box
              key={f._id}
              component="button"
              aria-label={`Afficher ${f.titre}`}
              onClick={() => setIndex(i)}
              sx={{
                width: i === index ? 32 : 8,
                height: 4,
                borderRadius: 4,
                border: 0,
                p: 0,
                cursor: 'pointer',
                bgcolor: i === index ? 'primary.main' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}

      <TrailerDialog url={film.trailerUrl} title={film.titre} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </Box>
  );
};

export default HeroCarousel;

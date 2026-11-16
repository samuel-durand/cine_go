import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import PosterCard from './PosterCard';

const arrowSx = {
  position: 'absolute',
  top: { md: 140 },
  zIndex: 2,
  bgcolor: 'rgba(10,10,14,0.85)',
  border: '1px solid rgba(255,255,255,0.15)',
  display: { xs: 'none', md: 'flex' },
  '&:hover': { bgcolor: 'primary.main', color: '#000' },
};

// Rangée horizontale d'affiches défilable (flèches sur desktop, swipe sur mobile)
const FilmRail = ({ films, cardProps }) => {
  const ref = useRef(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScroll({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, films.length]);

  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  return (
    <Box sx={{ position: 'relative' }}>
      {canScroll.left && (
        <IconButton onClick={() => scroll(-1)} sx={{ ...arrowSx, left: -20 }} aria-label="Précédent">
          <ChevronLeft />
        </IconButton>
      )}
      <Box
        ref={ref}
        onScroll={update}
        className="no-scrollbar"
        sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 }, overflowX: 'auto', scrollSnapType: 'x mandatory', pb: 1 }}
      >
        {films.map((film) => (
          <Box key={film._id} sx={{ scrollSnapAlign: 'start', width: { xs: 144, sm: 176, md: 212 }, flexShrink: 0 }}>
            <PosterCard film={film} {...cardProps} />
          </Box>
        ))}
      </Box>
      {canScroll.right && (
        <IconButton onClick={() => scroll(1)} sx={{ ...arrowSx, right: -20 }} aria-label="Suivant">
          <ChevronRight />
        </IconButton>
      )}
    </Box>
  );
};

export default FilmRail;

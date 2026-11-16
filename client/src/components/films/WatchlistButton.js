import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useWatchlist } from '../../context/WatchlistContext';

// Cœur « Ma liste » : icône seule (sur les affiches) ou bouton complet (pages film)
const WatchlistButton = ({ filmId, variant = 'icon', sx }) => {
  const { has, toggle } = useWatchlist();
  const active = has(filmId);
  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(filmId);
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outlined"
        size="large"
        onClick={onClick}
        startIcon={active ? <Favorite sx={{ color: 'primary.main' }} /> : <FavoriteBorder />}
        sx={sx}
      >
        {active ? 'Dans ma liste' : 'Ma liste'}
      </Button>
    );
  }

  return (
    <Tooltip title={active ? 'Retirer de ma liste' : 'Ajouter à ma liste'}>
      <IconButton
        onClick={onClick}
        aria-label={active ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
        size="small"
        sx={{
          bgcolor: 'rgba(10,10,14,0.6)',
          backdropFilter: 'blur(6px)',
          color: active ? 'primary.main' : '#fff',
          '&:hover': { bgcolor: 'rgba(10,10,14,0.85)' },
          ...sx,
        }}
      >
        {active ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default WatchlistButton;

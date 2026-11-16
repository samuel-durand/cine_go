import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { ChevronRight } from '@mui/icons-material';

// Titre de section avec lien « Voir tout » à droite
const SectionHeader = ({ title, subtitle, to, linkLabel = 'Voir tout', action }) => (
  <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: { xs: 0.5, sm: 2 }, mb: 3 }}>
    <Box>
      <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
    {to && (
      <Box
        component={Link}
        to={to}
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: '#fff',
          fontWeight: 500,
          fontSize: '0.95rem',
          textDecoration: 'underline',
          textUnderlineOffset: 4,
          textDecorationColor: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
          '&:hover': { color: 'primary.main', textDecorationColor: 'currentColor' },
        }}
      >
        {linkLabel}
        <ChevronRight fontSize="small" />
      </Box>
    )}
  </Box>
);

export default SectionHeader;

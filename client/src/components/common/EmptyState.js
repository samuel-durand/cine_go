import React from 'react';
import { Box, Typography } from '@mui/material';
import { EventBusy } from '@mui/icons-material';

const EmptyState = ({ icon: Icon = EventBusy, title, children }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
      borderRadius: 3,
      border: '1px dashed rgba(255, 255, 255, 0.15)',
      color: 'text.secondary',
    }}
  >
    <Icon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.25)', mb: 1.5 }} />
    <Typography variant="h6" color="text.primary" gutterBottom>
      {title}
    </Typography>
    {children && <Typography variant="body2">{children}</Typography>}
  </Box>
);

export default EmptyState;

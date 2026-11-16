import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { colors } from '../../theme';

// Mise en page commune connexion / inscription : carte centrée sur fond dégradé
const AuthLayout = ({ title, subtitle, children, maxWidth = 'xs' }) => (
  <Box
    sx={{
      minHeight: 'calc(100vh - 68px)',
      display: 'flex',
      alignItems: 'center',
      py: 6,
      background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 215, 0, 0.08) 0%, transparent 70%), ${colors.bg}`,
    }}
  >
    <Container maxWidth={maxWidth}>
      <Box sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
        <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
    </Container>
  </Box>
);

export default AuthLayout;

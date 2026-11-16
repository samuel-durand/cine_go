import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Loader = ({ minHeight = '60vh' }) => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight={minHeight}>
    <CircularProgress color="primary" />
  </Box>
);

export default Loader;

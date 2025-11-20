import React from 'react';
import { Box } from '@mui/material';

const AdminLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        color: '#FFFFFF',
      }}
    >
      {children}
    </Box>
  );
};

export default AdminLayout;


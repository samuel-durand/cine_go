import React from 'react';
import { Dialog, IconButton, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import { isVideoFile, trailerEmbedUrl } from '../../utils/format';

// Bande-annonce : fichier vidéo (MP4) lu nativement, sinon lecteur YouTube intégré
const TrailerDialog = ({ url, open, onClose, title }) => (
  <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: '#000', overflow: 'hidden', borderRadius: '6px' } }}>
    <IconButton onClick={onClose} aria-label="Fermer" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(0,0,0,0.6)' }}>
      <Close />
    </IconButton>
    <Box sx={{ position: 'relative', pt: '56.25%' }}>
      {open && (isVideoFile(url) ? (
        <Box
          component="video"
          src={url}
          controls
          autoPlay
          playsInline
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', bgcolor: '#000' }}
        />
      ) : (
        <Box
          component="iframe"
          src={trailerEmbedUrl(url)}
          title={`Bande-annonce ${title || ''}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ))}
    </Box>
  </Dialog>
);

export default TrailerDialog;

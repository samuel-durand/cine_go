import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Tooltip } from '@mui/material';
import { colors } from '../../theme';
import { endTime, formatPrice, SALLE_LABELS } from '../../utils/format';

const isPast = (seance) => {
  const [h, m] = (seance.heure || '00:00').split(':').map(Number);
  const [y, mo, d] = seance.date.slice(0, 10).split('-').map(Number);
  return new Date(y, mo - 1, d, h, m) < new Date();
};

// Bouton d'horaire : heure de début en gros, heure de fin estimée, format de salle
const ShowtimeButton = ({ seance, duree }) => {
  const full = seance.placesDisponibles === 0;
  const past = isPast(seance);
  const disabled = full || past;
  const fin = endTime(seance.heure, duree || seance.film?.duree);
  const type = seance.salle?.type;
  const fewSeats = !full && seance.placesDisponibles <= 10;

  const tooltip = full
    ? 'Séance complète'
    : past
      ? 'Séance passée'
      : `${seance.salle?.nom || 'Salle'} · ${formatPrice(seance.prix)} · ${seance.placesDisponibles} places restantes`;

  return (
    <Tooltip title={tooltip} arrow>
      <Box
        component={disabled ? 'div' : Link}
        to={disabled ? undefined : `/reservation/${seance._id}`}
        sx={{
          position: 'relative',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: 104,
          px: 1.75,
          py: 1.1,
          borderRadius: '8px',
          textDecoration: 'none',
          color: '#fff',
          bgcolor: colors.paperHigh,
          border: `1px solid ${colors.border}`,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          '&:hover': disabled ? {} : { bgcolor: 'primary.main', color: '#000', borderColor: 'primary.main', '& .st-sub': { color: 'rgba(0,0,0,0.7)' } },
        }}
      >
        <Box sx={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{seance.heure}</Box>
        <Box className="st-sub" sx={{ fontSize: '0.72rem', color: colors.textFaint, fontWeight: 600 }}>
          {full ? 'Complet' : fin ? `Fin ${fin}` : formatPrice(seance.prix)}
        </Box>
        {type && type !== 'classic' && (
          <Box
            sx={{ position: 'absolute', top: -8, right: 6, px: 0.75, borderRadius: '4px', bgcolor: 'primary.main', color: '#000', fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.04em' }}
          >
            {SALLE_LABELS[type] || type.toUpperCase()}
          </Box>
        )}
        {fewSeats && !past && (
          <Box sx={{ position: 'absolute', bottom: 6, right: 8, width: 6, height: 6, borderRadius: '50%', bgcolor: '#f87171' }} title="Dernières places" />
        )}
      </Box>
    </Tooltip>
  );
};

export default ShowtimeButton;

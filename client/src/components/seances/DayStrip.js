import React from 'react';
import { Box } from '@mui/material';
import { colors } from '../../theme';
import { addDays, parseDay, toISODate } from '../../utils/format';

const label = (isoDay, todayIso) => {
  const d = parseDay(isoDay);
  if (isoDay === todayIso) return 'Auj.';
  if (isoDay === toISODate(addDays(parseDay(todayIso), 1))) return 'Dem.';
  return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
};

/**
 * Sélecteur de jour horizontal.
 * - `days` : nombre de jours affichés à partir d'aujourd'hui
 * - `availableDates` : jours ayant des séances (les autres sont grisés) ; null = tous actifs
 */
const DayStrip = ({ value, onChange, days = 14, availableDates = null }) => {
  const todayIso = toISODate();
  const list = Array.from({ length: days }, (_, i) => toISODate(addDays(new Date(), i)));
  const available = availableDates ? new Set(availableDates) : null;

  return (
    <Box className="no-scrollbar" sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }} role="tablist">
      {list.map((iso) => {
        const d = parseDay(iso);
        const active = iso === value;
        const disabled = available && !available.has(iso);
        return (
          <Box
            key={iso}
            component="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(iso)}
            sx={{
              flexShrink: 0,
              width: 68,
              py: 1.25,
              borderRadius: '10px',
              border: `1px solid ${active ? colors.gold : colors.border}`,
              bgcolor: active ? 'primary.main' : colors.paper,
              color: active ? '#000' : '#fff',
              opacity: disabled ? 0.35 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              '&:hover:not(:disabled)': { borderColor: colors.gold },
            }}
          >
            <Box sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', opacity: active ? 1 : 0.7 }}>
              {label(iso, todayIso)}
            </Box>
            <Box sx={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>{d.getDate()}</Box>
            <Box sx={{ fontSize: '0.72rem', fontWeight: 600, opacity: active ? 1 : 0.7 }}>
              {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default DayStrip;

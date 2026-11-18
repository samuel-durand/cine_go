import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Drawer, IconButton, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../../utils/axiosConfig';
import { colors, headingFont } from '../../theme';
import { endTime, formatDayLong, SALLE_LABELS, seanceDay } from '../../utils/format';

const TITLES = { cinema: 'Cinémas', date: 'Dates', seance: 'Séances' };

// Une séance est encore réservable si elle n'a pas commencé
const isUpcoming = (seance) => {
  const [y, m, d] = seanceDay(seance).split('-').map(Number);
  const [h, min] = seance.heure.split(':').map(Number);
  return new Date(y, m - 1, d, h, min) > new Date();
};

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

const Item = ({ title, subtitle, onClick, current, disabled, children }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      px: 3,
      py: 2,
      border: 0,
      borderBottom: `1px solid ${colors.border}`,
      bgcolor: current ? 'rgba(255,215,0,0.08)' : 'transparent',
      color: disabled ? colors.textFaint : '#fff',
      fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      '&:hover': disabled ? {} : { bgcolor: 'rgba(255,255,255,0.05)' },
    }}
  >
    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: current ? 'primary.main' : 'inherit' }}>{title}</Typography>
    {subtitle && <Typography variant="body2" sx={{ color: colors.textMuted, mt: 0.25 }}>{subtitle}</Typography>}
    {children}
  </Box>
);

/**
 * Panneau de changement de séance, ouvert à côté de la colonne de réservation.
 * mode : 'cinema' | 'date' | 'seance' ; navigue de l'un à l'autre puis appelle onSelect(seanceId).
 */
const SeancePickerPanel = ({ open, mode, onModeChange, seance, onSelect, onClose, sidebarWidth }) => {
  const filmId = seance.film?._id;
  const [seances, setSeances] = useState(null);
  const [cinemaId, setCinemaId] = useState(seance.salle?.cinema?._id);
  const [day, setDay] = useState(seanceDay(seance));

  // Repart de la séance courante à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setCinemaId(seance.salle?.cinema?._id);
    setDay(seanceDay(seance));
  }, [open, seance]);

  // Toutes les séances du film (chargées une seule fois)
  useEffect(() => {
    if (!open || seances || !filmId) return;
    api.get('/seances', { params: { filmId } })
      .then((res) => setSeances(res.data.filter(isUpcoming)))
      .catch(() => setSeances([]));
  }, [open, seances, filmId]);

  const { cinemas, days, slots } = useMemo(() => {
    const list = seances || [];
    const byCinema = new Map();
    list.forEach((s) => {
      const c = s.salle?.cinema;
      if (!c) return;
      if (!byCinema.has(c._id)) byCinema.set(c._id, { cinema: c, count: 0 });
      byCinema.get(c._id).count += 1;
    });
    const atCinema = list.filter((s) => s.salle?.cinema?._id === cinemaId);
    const byDay = new Map();
    atCinema.forEach((s) => byDay.set(seanceDay(s), (byDay.get(seanceDay(s)) || 0) + 1));
    return {
      cinemas: [...byCinema.values()].sort((a, b) => a.cinema.nom.localeCompare(b.cinema.nom)),
      days: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)),
      slots: atCinema.filter((s) => seanceDay(s) === day).sort((a, b) => a.heure.localeCompare(b.heure)),
    };
  }, [seances, cinemaId, day]);

  const back = mode === 'seance' ? 'date' : mode === 'date' ? 'cinema' : null;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          left: { xs: 0, md: sidebarWidth },
          width: { xs: '100%', md: 340 },
          bgcolor: colors.paperHigh,
          backgroundImage: 'none',
          borderRight: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      BackdropProps={{ sx: { left: { md: sidebarWidth }, bgcolor: 'rgba(0,0,0,0.55)' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 3, pb: 1.5 }}>
        {back && (
          <IconButton onClick={() => onModeChange(back)} aria-label="Étape précédente" sx={{ color: '#fff' }}>
            <ArrowBack />
          </IconButton>
        )}
        <Box sx={{ px: back ? 0 : 1 }}>
          <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '2.2rem', lineHeight: 1 }}>{TITLES[mode]}</Typography>
          {mode === 'seance' && <Typography variant="body2" sx={{ color: colors.textMuted, mt: 0.5 }}>{formatDayLong(day)}</Typography>}
          {mode !== 'cinema' && (
            <Typography variant="body2" sx={{ color: colors.textMuted }}>
              {cinemas.find((c) => c.cinema._id === cinemaId)?.cinema.nom}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {!seances ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : mode === 'cinema' ? (
          cinemas.map(({ cinema, count }) => (
            <Item
              key={cinema._id}
              title={cinema.nom}
              subtitle={`${cinema.ville} · ${plural(count, 'séance')}`}
              current={cinema._id === seance.salle?.cinema?._id}
              onClick={() => {
                setCinemaId(cinema._id);
                onModeChange('date');
              }}
            />
          ))
        ) : mode === 'date' ? (
          days.length === 0 ? (
            <Typography sx={{ px: 3, py: 2, color: colors.textMuted }}>Aucune séance à venir dans ce cinéma.</Typography>
          ) : (
            days.map(([iso, count]) => (
              <Item
                key={iso}
                title={formatDayLong(iso)}
                subtitle={plural(count, 'Séance')}
                current={iso === seanceDay(seance) && cinemaId === seance.salle?.cinema?._id}
                onClick={() => {
                  setDay(iso);
                  onModeChange('seance');
                }}
              />
            ))
          )
        ) : (
          slots.map((s) => {
            const format = s.salle?.type && s.salle.type !== 'classic' ? SALLE_LABELS[s.salle.type] : '';
            const fin = endTime(s.heure, seance.film?.duree);
            const full = s.placesDisponibles === 0;
            return (
              <Item key={s._id} current={s._id === seance._id} disabled={full} onClick={() => onSelect(s._id)}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 500, color: s._id === seance._id ? 'primary.main' : 'inherit' }}>{s.heure}</Typography>
                  {format && <Typography variant="body2" sx={{ fontWeight: 700 }}>{format}</Typography>}
                </Box>
                <Typography variant="body2" sx={{ color: colors.textMuted }}>
                  {[s.salle?.nom, fin && `Fin prévue à ${fin}`, full ? 'Complet' : `${s.placesDisponibles} place${s.placesDisponibles > 1 ? 's' : ''} libre${s.placesDisponibles > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
                </Typography>
              </Item>
            );
          })
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 999, minHeight: 40, px: 5, bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
          Annuler
        </Button>
      </Box>
    </Drawer>
  );
};

export default SeancePickerPanel;

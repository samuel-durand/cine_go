import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import { LocationOn, Search } from '@mui/icons-material';
import { colors } from '../theme';

/**
 * Bloc « Choisir un cinéma » : onglets Villes / Tous les cinémas avec recherche,
 * chaque entrée menant à la page du cinéma (ou de la ville).
 */
const CinemaPicker = ({ cinemas }) => {
  const [tab, setTab] = useState('villes');
  const [query, setQuery] = useState('');

  const villes = useMemo(() => {
    const map = new Map();
    cinemas.forEach((c) => {
      if (!map.has(c.ville)) map.set(c.ville, []);
      map.get(c.ville).push(c);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [cinemas]);

  const q = query.trim().toLowerCase();
  const match = (...values) => !q || values.some((v) => (v || '').toLowerCase().includes(q));

  const tabSx = (active) => ({
    border: 0,
    bgcolor: 'transparent',
    color: active ? '#fff' : colors.textMuted,
    fontFamily: 'inherit',
    fontSize: '1.05rem',
    fontWeight: active ? 700 : 500,
    pb: 1.25,
    px: 0,
    cursor: 'pointer',
    borderBottom: `3px solid ${active ? colors.gold : 'transparent'}`,
  });

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, borderRadius: '6px', bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h3" component="h2">Choisir un cinéma</Typography>
        <TextField
          size="small"
          placeholder="Ville ou cinéma"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 320 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'primary.main' }} /></InputAdornment> }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 4, borderBottom: `1px solid ${colors.border}`, mb: 3 }} role="tablist">
        <Box component="button" role="tab" aria-selected={tab === 'villes'} onClick={() => setTab('villes')} sx={tabSx(tab === 'villes')}>
          Villes ({villes.length})
        </Box>
        <Box component="button" role="tab" aria-selected={tab === 'cinemas'} onClick={() => setTab('cinemas')} sx={tabSx(tab === 'cinemas')}>
          Tous les cinémas ({cinemas.length})
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 220, overflowY: 'auto' }}>
        {tab === 'villes'
          ? villes
              .filter(([ville, list]) => match(ville, ...list.map((c) => c.codePostal)))
              .map(([ville, list]) => (
                <Chip
                  key={ville}
                  label={ville}
                  component={Link}
                  to={list.length === 1 ? `/cinemas/${list[0]._id}` : `/cinemas?ville=${encodeURIComponent(ville)}`}
                  clickable
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
                />
              ))
          : cinemas
              .filter((c) => match(c.nom, c.ville, c.codePostal))
              .map((c) => (
                <Chip
                  key={c._id}
                  icon={<LocationOn sx={{ fontSize: 18 }} />}
                  label={`${c.nom} · ${c.ville}`}
                  component={Link}
                  to={`/cinemas/${c._id}`}
                  clickable
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
                />
              ))}
      </Box>
    </Box>
  );
};

export default CinemaPicker;

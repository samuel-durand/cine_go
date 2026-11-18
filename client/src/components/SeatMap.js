import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { colors } from '../theme';

// Dimensions d'un fauteuil et des espacements (px, avant mise à l'échelle)
const SEAT_W = 26;
const SEAT_H = 22;
const GAP = 6;
const ROW_GAP = 10;
const AISLE = 26;

const GOLD = colors.gold;
const GREEN = '#34d399';
const TAKEN = 'rgba(255,255,255,0.28)';

export const isPmr = (seat) => Boolean(seat.accessible || seat.type === 'accessible');

const seatLabel = (seat) =>
  [
    `Rang ${seat.row} · Place ${seat.number}`,
    seat.type === 'vip' && 'Fauteuil VIP',
    seat.type === 'premium' && 'Fauteuil Premium',
    isPmr(seat) && 'Place PMR',
    seat.priceModifier > 0 && `+${seat.priceModifier} €`,
  ]
    .filter(Boolean)
    .join(' · ');

/** Pictogramme de fauteuil (ou de place PMR) dessiné en SVG selon son état. */
export const SeatIcon = ({ state = 'free', pmr = false, width = SEAT_W, height = SEAT_H }) => {
  const stroke = state === 'selected' ? GREEN : state === 'taken' ? TAKEN : GOLD;
  const fill = state === 'selected' ? GREEN : state === 'taken' ? 'rgba(255,255,255,0.05)' : 'rgba(255,215,0,0.10)';
  return (
    <svg width={width} height={height} viewBox="0 0 26 22" aria-hidden="true" style={{ display: 'block' }}>
      {pmr ? (
        <rect x="2" y="1.5" width="22" height="19" rx="4" fill={fill} stroke={stroke} strokeWidth="1.6" />
      ) : (
        <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round">
          {/* Assise et accoudoirs, puis dossier par-dessus */}
          <rect x="1.5" y="8.5" width="23" height="12" rx="3" />
          <rect x="5.5" y="1.5" width="15" height="13" rx="3.5" />
        </g>
      )}
      {state === 'selected' && (
        <path d="M8.5 11.5l3 3 6-6.5" fill="none" stroke="#0f1014" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {state !== 'selected' && pmr && (
        // Pictogramme fauteuil roulant
        <g fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12.5" cy="5.5" r="1.3" fill={stroke} stroke="none" />
          <path d="M12.5 8v4.5h4l1.5 3.5" />
          <path d="M10.3 10.6a4 4 0 1 0 5.2 5.2" />
        </g>
      )}
    </svg>
  );
};

export const SeatLegend = () => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3 } }}>
    {[
      { state: 'selected', label: 'Mes places' },
      { state: 'free', label: 'Places libres' },
      { state: 'taken', label: 'Places occupées' },
    ].map((item) => (
      <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SeatIcon state={item.state} width={20} height={17} />
        <Typography variant="body2">{item.label}</Typography>
      </Box>
    ))}
  </Box>
);

// Allées : 3 blocs pour les grandes salles, 2 pour les moyennes, aucune pour les petites
const aislesFor = (maxSeats) => {
  if (maxSeats >= 14) {
    const side = Math.round(maxSeats / 4);
    return [side, maxSeats - side];
  }
  if (maxSeats >= 10) return [Math.ceil(maxSeats / 2)];
  return [];
};

/**
 * Plan de salle façon « grand réseau » : écran en bas (le rang A est donc le plus
 * proche), fauteuils alignés en colonnes avec allées, mise à l'échelle automatique.
 */
const SeatMap = ({ plan, reservedSeats = [], selectedSeats = [], onToggleSeat }) => {
  const rows = useMemo(() => [...(plan?.rows || [])].reverse(), [plan]);
  const reserved = useMemo(() => new Set(reservedSeats.map((s) => s.seatId)), [reservedSeats]);
  const selected = useMemo(() => new Set(selectedSeats.map((s) => s.seatId)), [selectedSeats]);

  const maxSeats = rows.reduce((m, r) => Math.max(m, r.seats?.length || 0), 0);
  const aisles = aislesFor(maxSeats);
  // Position horizontale d'une colonne (0..maxSeats-1) en tenant compte des allées
  const xOf = (col) => col * (SEAT_W + GAP) + aisles.filter((a) => col >= a).length * AISLE;
  const naturalWidth = xOf(maxSeats - 1) + SEAT_W;
  const naturalHeight = rows.length * (SEAT_H + ROW_GAP);

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    // Pleine largeur disponible, sans descendre sous 0,6 (défilement horizontal au-delà)
    const update = () => setScale(Math.max(0.6, Math.min(1.6, (el.clientWidth - 16) / naturalWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [naturalWidth]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', overflowX: 'auto' }}>
      <Box sx={{ width: naturalWidth * scale, mx: 'auto', py: 1 }}>
        <Box sx={{ position: 'relative', width: naturalWidth * scale, height: naturalHeight * scale }}>
          {rows.map((row, r) => {
            const seats = row.seats || [];
            // Rangée incomplète : centrée sur la grille
            const offset = Math.floor((maxSeats - seats.length) / 2);
            return seats.map((seat, i) => {
              const state = reserved.has(seat.seatId) ? 'taken' : selected.has(seat.seatId) ? 'selected' : 'free';
              return (
                <Tooltip key={seat.seatId} title={state === 'taken' ? 'Place occupée' : seatLabel(seat)} arrow disableInteractive>
                  <Box
                    component="button"
                    type="button"
                    aria-label={`${seatLabel(seat)}${state === 'selected' ? ' (sélectionnée)' : state === 'taken' ? ' (occupée)' : ''}`}
                    aria-pressed={state === 'selected'}
                    disabled={state === 'taken'}
                    onClick={() => state !== 'taken' && onToggleSeat(seat)}
                    sx={{
                      position: 'absolute',
                      left: xOf(offset + i) * scale,
                      top: r * (SEAT_H + ROW_GAP) * scale,
                      width: SEAT_W * scale,
                      height: SEAT_H * scale,
                      p: 0,
                      border: 0,
                      bgcolor: 'transparent',
                      cursor: state === 'taken' ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.12s ease',
                      '&:hover': state === 'taken' ? {} : { transform: 'scale(1.18)' },
                      '&:focus-visible': { outline: `2px solid ${GOLD}`, outlineOffset: 2, borderRadius: '4px' },
                    }}
                  >
                    <SeatIcon state={state} pmr={isPmr(seat)} width={SEAT_W * scale} height={SEAT_H * scale} />
                  </Box>
                </Tooltip>
              );
            });
          })}
        </Box>

        {/* Écran en bas, comme vu depuis le fond de la salle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
          <Box component="svg" viewBox="0 0 100 10" preserveAspectRatio="none" sx={{ flex: 1, height: 12 }}>
            <path d="M0 2 Q 60 9 100 8" fill="none" stroke={GOLD} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity="0.8" />
          </Box>
          <Typography sx={{ color: GOLD, fontWeight: 500, opacity: 0.9 }}>Écran</Typography>
          <Box component="svg" viewBox="0 0 100 10" preserveAspectRatio="none" sx={{ flex: 1, height: 12 }}>
            <path d="M0 8 Q 40 9 100 2" fill="none" stroke={GOLD} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity="0.8" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SeatMap;

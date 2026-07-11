import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Accessibility, CheckCircle, Close } from '@mui/icons-material';

const SeatMap = ({
  plan,
  reservedSeats = [],
  selectedSeats = [],
  onToggleSeat,
}) => {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const reservedSet = new Set(reservedSeats.map((seat) => seat.seatId));
  const selectedSet = new Set(selectedSeats.map((seat) => seat.seatId));

  const getSeatStyle = (seat, isReserved, isSelected) => {
    if (isReserved) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        color: 'rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'not-allowed',
      };
    }
    if (isSelected) {
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        color: '#ffffff',
        border: '1px solid #34d399',
        cursor: 'pointer',
        boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)',
        transform: 'scale(1.08)',
      };
    }
    // Siège libre
    return {
      backgroundColor: 'rgba(144, 202, 249, 0.12)',
      color: '#90caf9',
      border: '1px solid rgba(144, 202, 249, 0.4)',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: 'rgba(144, 202, 249, 0.35)',
        borderColor: '#90caf9',
        transform: 'scale(1.15)',
        boxShadow: '0 0 10px rgba(144, 202, 249, 0.4)',
      },
    };
  };

  // Grouper les rangées par blocs (basé sur les gaps dans le plan)
  const groupRowsIntoBlocks = () => {
    if (!plan?.rows) return [];

    const blocks = [];
    let currentBlock = [];

    plan.rows.forEach((row) => {
      const avgSeats = plan.rows.reduce((sum, r) => sum + (r.seats?.length || 0), 0) / plan.rows.length;
      const isSeparator = row.seats?.length < avgSeats * 0.5;

      if (isSeparator && currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      } else {
        currentBlock.push(row);
      }
    });

    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks.length > 0 ? blocks : [plan.rows];
  };

  const blocks = groupRowsIntoBlocks();

  // Adapter la taille des sièges aux grandes salles
  const totalSeats = plan?.rows?.reduce((sum, row) => sum + (row.seats?.length || 0), 0) || 0;
  const isLargeHall = totalSeats > 150;
  const seatSize = isLargeHall ? 32 : 40;
  const seatGapPx = isLargeHall ? 4 : 6;
  const labelWidth = 28;

  const maxSeatsPerRow = plan?.rows?.reduce((max, row) => Math.max(max, row.seats?.length || 0), 0) || 0;
  const seatAreaWidth = maxSeatsPerRow * seatSize + Math.max(0, maxSeatsPerRow - 1) * seatGapPx;

  const legendItems = [
    {
      label: 'Libre',
      box: {
        backgroundColor: 'rgba(144, 202, 249, 0.12)',
        border: '1px solid rgba(144, 202, 249, 0.4)',
      },
    },
    {
      label: 'Mes places',
      box: {
        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        border: '1px solid #34d399',
      },
      icon: <CheckCircle sx={{ fontSize: 13, color: '#fff' }} />,
    },
    {
      label: 'Occupé',
      box: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      },
      icon: <Close sx={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />,
    },
    {
      label: 'Accessible',
      box: {
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        border: '1px solid #3b82f6',
      },
      icon: <Accessibility sx={{ fontSize: 13, color: '#60a5fa' }} />,
    },
  ];

  return (
    <Box className="w-full">
      {/* Salle */}
      <Box
        className="rounded-lg mb-4"
        sx={{
          p: { xs: 2, sm: 3 },
          background: 'linear-gradient(180deg, rgba(13, 18, 30, 0.9) 0%, rgba(23, 30, 48, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          // Pas de scroll : la salle est visible en entier
          // (overflowX en secours uniquement pour les très petits écrans)
          overflowX: 'auto',
        }}
      >
        {/* Tout le contenu partage la même colonne centrée : l'écran est
            toujours aligné avec le bloc de sièges, quelle que soit la salle */}
        <Box
          sx={{
            width: 'fit-content',
            minWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Rangées */}
          {blocks.map((block, blockIndex) => (
            <Box
              key={blockIndex}
              sx={{ display: 'flex', flexDirection: 'column', gap: `${seatGapPx + 2}px`, mb: blockIndex < blocks.length - 1 ? 3 : 0 }}
            >
              {block.map((row) => (
                <Box key={row.name} sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Label symétrique des deux côtés pour un centrage parfait */}
                  <Typography
                    variant="caption"
                    sx={{ width: labelWidth, flexShrink: 0, textAlign: 'center', fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)' }}
                  >
                    {row.name}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: `${seatGapPx}px`, flexWrap: 'nowrap' }}>
                    {row.seats?.map((seat) => {
                      const isReserved = reservedSet.has(seat.seatId);
                      const isSelected = selectedSet.has(seat.seatId);
                      const isAccessible = seat.type === 'accessible';
                      const isHovered = hoveredSeat === seat.seatId;
                      const seatStyle = getSeatStyle(seat, isReserved, isSelected);

                      const handleClick = () => {
                        if (isReserved) return;
                        onToggleSeat(seat);
                      };

                      return (
                        <Tooltip
                          key={seat.seatId}
                          title={
                            <Box>
                              <Typography variant="body2" className="font-bold">
                                {seat.label}
                              </Typography>
                              <Typography variant="caption">
                                Rangée {row.name} • Siège {seat.number}
                              </Typography>
                              {seat.type !== 'standard' && (
                                <Typography variant="caption" display="block">
                                  Type: {seat.type}
                                </Typography>
                              )}
                              {seat.priceModifier > 0 && (
                                <Typography variant="caption" display="block">
                                  Supplément: +{seat.priceModifier} €
                                </Typography>
                              )}
                              {isReserved && (
                                <Typography variant="caption" display="block" color="error">
                                  Réservé
                                </Typography>
                              )}
                              {isSelected && (
                                <Typography variant="caption" display="block" color="success.main">
                                  Sélectionné
                                </Typography>
                              )}
                            </Box>
                          }
                          placement="top"
                          arrow
                        >
                          <Box
                            onMouseEnter={() => setHoveredSeat(seat.seatId)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            onClick={handleClick}
                            sx={{
                              width: seatSize,
                              height: seatSize,
                              // Forme de fauteuil : arrondi plus marqué en haut
                              borderRadius: '8px 8px 4px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                              ...seatStyle,
                            }}
                          >
                            {isReserved ? (
                              <Close sx={{ fontSize: isLargeHall ? 13 : 15, color: 'rgba(255,255,255,0.3)' }} />
                            ) : (
                              (isHovered || isSelected) && (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: isLargeHall ? '9px' : '10px', lineHeight: 1, fontWeight: 700 }}
                                >
                                  {seat.number}
                                </Typography>
                              )
                            )}

                            {isAccessible && !isReserved && (
                              <Accessibility
                                sx={{
                                  fontSize: isLargeHall ? 11 : 13,
                                  position: 'absolute',
                                  top: -3,
                                  right: -3,
                                  color: '#60a5fa',
                                  backgroundColor: '#0d121e',
                                  borderRadius: '50%',
                                  padding: '1px',
                                }}
                              />
                            )}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>

                  <Box sx={{ width: labelWidth, flexShrink: 0 }} />
                </Box>
              ))}
            </Box>
          ))}

          {/* Écran */}
          <Box sx={{ width: `${seatAreaWidth}px`, maxWidth: '100%', mt: 4 }}>
            <Box
              sx={{
                height: 10,
                width: '100%',
                background: 'linear-gradient(0deg, #90caf9 0%, rgba(144, 202, 249, 0.3) 100%)',
                borderRadius: '0 0 50% 50% / 0 0 100% 100%',
                boxShadow: '0 6px 24px rgba(144, 202, 249, 0.45)',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 1,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 600,
              }}
            >
              Écran
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Légende */}
      <Box
        className="flex flex-wrap items-center justify-center"
        sx={{
          gap: { xs: 2, sm: 3 },
          p: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        {legendItems.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '6px 6px 3px 3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...item.box,
              }}
            >
              {item.icon || null}
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SeatMap;

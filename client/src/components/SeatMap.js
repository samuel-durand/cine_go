import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Accessibility, CheckCircle } from '@mui/icons-material';

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
        backgroundColor: '#e5e7eb',
        color: '#6b7280',
        border: '2px solid #9ca3af',
        cursor: 'not-allowed',
        opacity: 0.6,
      };
    }
    if (isSelected) {
      return {
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: '2px solid #059669',
        cursor: 'pointer',
      };
    }
    // Siège libre
    return {
      backgroundColor: '#fbbf24',
      color: '#78350f',
      border: '2px solid #f59e0b',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f59e0b',
        transform: 'scale(1.1)',
      },
    };
  };

  // Grouper les rangées par blocs (basé sur les gaps dans le plan)
  const groupRowsIntoBlocks = () => {
    if (!plan?.rows) return [];
    
    const blocks = [];
    let currentBlock = [];
    
    plan.rows.forEach((row, index) => {
      // Si la rangée a moins de sièges, c'est probablement une allée ou un bloc séparé
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
  
  // Calculer le nombre total de sièges pour adapter la taille
  const totalSeats = plan?.rows?.reduce((sum, row) => sum + (row.seats?.length || 0), 0) || 0;
  const isLargeHall = totalSeats > 150;
  const seatSize = isLargeHall ? 28 : 36;
  const seatGap = isLargeHall ? '2px' : '4px';

  return (
    <Box className="w-full">
      {/* Plan de salle - scrollable pour les grandes salles */}
      <Box 
        className="bg-gray-100 rounded-lg mb-4"
        sx={{
          p: isLargeHall ? 3 : 6,
          maxHeight: isLargeHall ? '600px' : 'none',
          overflowY: isLargeHall ? 'auto' : 'visible',
          overflowX: 'auto',
        }}
      >
        {/* Rangées principales */}
        <Box className="space-y-2" sx={{ minWidth: 'fit-content' }}>
          {blocks.map((block, blockIndex) => (
            <Box key={blockIndex} className="flex flex-col items-center space-y-2">
              {block.map((row) => (
                <Box key={row.name} className="flex items-center gap-2">
                  {/* Label de la rangée */}
                  <Typography
                    variant="body2"
                    className="font-bold text-gray-700 w-8 text-center"
                  >
                    {row.name}
                  </Typography>
                  
                  {/* Sièges de la rangée */}
                  <Box 
                    className="flex"
                    sx={{ gap: seatGap, flexWrap: 'wrap' }}
                  >
                    {row.seats?.map((seat) => {
                      const isReserved = reservedSet.has(seat.seatId);
                      const isSelected = selectedSet.has(seat.seatId);
                      const isAccessible = seat.type === 'accessible';
                      const isHovered = hoveredSeat === seat.seatId;
                      const seatStyle = getSeatStyle(seat, isReserved, isSelected);

                      const handleClick = () => {
                        if (isReserved) return;
                        // Permet de sélectionner/désélectionner n'importe quel siège libre
                        // même s'il n'est pas adjacent aux autres sièges sélectionnés
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
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              transition: 'all 0.2s',
                              flexShrink: 0,
                              ...seatStyle,
                            }}
                          >
                            {/* Numéro du siège - visible au survol ou si sélectionné */}
                            {(isHovered || isSelected) && (
                              <Typography
                                variant="caption"
                                className="font-bold"
                                sx={{ 
                                  fontSize: isLargeHall ? '9px' : '10px',
                                  lineHeight: 1,
                                }}
                              >
                                {seat.number}
                              </Typography>
                            )}
                            
                            {/* Icône pour siège accessible */}
                            {isAccessible && !isReserved && (
                              <Accessibility
                                sx={{
                                  fontSize: isLargeHall ? 12 : 14,
                                  position: 'absolute',
                                  top: -2,
                                  right: -2,
                                  color: '#3b82f6',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '50%',
                                  padding: '1px',
                                }}
                              />
                            )}
                            
                            {/* Icône pour siège sélectionné */}
                            {isSelected && (
                              <CheckCircle
                                sx={{
                                  fontSize: isLargeHall ? 14 : 16,
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  color: '#ffffff',
                                  backgroundColor: '#10b981',
                                  borderRadius: '50%',
                                  border: '2px solid #ffffff',
                                }}
                              />
                            )}
                            
                            {/* Icône personne pour siège réservé */}
                            {isReserved && (
                              <Box
                                sx={{
                                  width: isLargeHall ? 16 : 18,
                                  height: isLargeHall ? 16 : 18,
                                  borderRadius: '50%',
                                  backgroundColor: '#9ca3af',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ 
                                    fontSize: isLargeHall ? '8px' : '9px', 
                                    color: '#ffffff',
                                    lineHeight: 1,
                                  }}
                                >
                                  👤
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              ))}
              
              {/* Espacement entre blocs */}
              {blockIndex < blocks.length - 1 && (
                <Box className="h-4" />
              )}
            </Box>
          ))}
        </Box>

        {/* Écran en bas */}
        <Box className="mt-8 flex justify-center">
          <Box
            sx={{
              width: '60%',
              height: 8,
              backgroundColor: '#fbbf24',
              borderRadius: '8px 8px 0 0',
              position: 'relative',
              '&::before': {
                content: '"Écran"',
                position: 'absolute',
                top: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1f2937',
              },
            }}
          />
        </Box>
      </Box>

      {/* Légende */}
      <Box className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border">
        <Box className="flex items-center gap-2">
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              backgroundColor: '#10b981',
              border: '2px solid #059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle sx={{ fontSize: 14, color: '#ffffff' }} />
          </Box>
          <Typography variant="body2">Mes places</Typography>
        </Box>
        
        <Box className="flex items-center gap-2">
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              backgroundColor: '#fbbf24',
              border: '2px solid #f59e0b',
            }}
          />
          <Typography variant="body2">Places libres</Typography>
        </Box>
        
        <Box className="flex items-center gap-2">
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              backgroundColor: '#e5e7eb',
              border: '2px solid #9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '10px' }}>
              👤
            </Typography>
          </Box>
          <Typography variant="body2">Places occupées</Typography>
        </Box>
        
        <Box className="flex items-center gap-2">
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              backgroundColor: '#3b82f6',
              border: '2px solid #2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Accessibility sx={{ fontSize: 14, color: '#ffffff' }} />
          </Box>
          <Typography variant="body2">Accessible</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SeatMap;

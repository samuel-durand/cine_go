const countPlanSeats = (plan = {}) => {
  if (!plan?.rows?.length) {
    return 0;
  }
  return plan.rows.reduce((acc, row) => acc + (row.seats?.length || 0), 0);
};

const buildSeatIndex = (plan = {}) => {
  const map = new Map();
  if (!plan?.rows) return map;

  plan.rows.forEach((row) => {
    row.seats?.forEach((seat) => {
      if (seat?.seatId) {
        map.set(seat.seatId, seat);
      }
      if (seat?.label) {
        map.set(seat.label, seat);
      }
    });
  });

  return map;
};

const validateSeatSelection = (seance, requestedSeats = []) => {
  if (!seance?.plan?.rows?.length) {
    const error = new Error('PLAN_NOT_AVAILABLE');
    throw error;
  }

  if (!Array.isArray(requestedSeats) || requestedSeats.length === 0) {
    const error = new Error('NO_SEATS_SELECTED');
    throw error;
  }

  const seatIndex = buildSeatIndex(seance.plan);
  const reservedSet = new Set((seance.siegesReserves || []).map((seat) => seat.seatId));
  const seenSeatIds = new Set();

  const normalizedSeats = requestedSeats.map((seatRequest) => {
    const seatId = seatRequest?.seatId || seatRequest?.label;
    if (!seatId) {
      const error = new Error('INVALID_SEAT');
      throw error;
    }

    const seatDefinition = seatIndex.get(seatId);
    if (!seatDefinition) {
      const error = new Error('SEAT_NOT_FOUND');
      error.seatId = seatId;
      throw error;
    }

    if (seenSeatIds.has(seatDefinition.seatId)) {
      const error = new Error('DUPLICATE_SEAT');
      error.seatId = seatDefinition.seatId;
      throw error;
    }
    seenSeatIds.add(seatDefinition.seatId);

    if (reservedSet.has(seatDefinition.seatId)) {
      const error = new Error('SEAT_ALREADY_RESERVED');
      error.seat = seatDefinition;
      throw error;
    }

    return {
      seatId: seatDefinition.seatId,
      label: seatDefinition.label,
      row: seatDefinition.row,
      number: seatDefinition.number,
      type: seatDefinition.type,
      accessible: seatDefinition.accessible || false,
      priceModifier: seatDefinition.priceModifier || 0,
    };
  });

  const prixTotal = normalizedSeats.reduce((total, seat) => {
    const seatPrice = (seance.prix || 0) + (seat.priceModifier || 0);
    return total + seatPrice;
  }, 0);

  return {
    seats: normalizedSeats,
    prixTotal,
  };
};

module.exports = {
  countPlanSeats,
  validateSeatSelection,
};


import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// « Ma liste » : films mis de côté par le visiteur (mémorisés dans ce navigateur)
const STORAGE_KEY = 'cinego.watchlist';
const WatchlistContext = createContext({ ids: [], has: () => false, toggle: () => {} });

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const WatchlistProvider = ({ children }) => {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* stockage indisponible (navigation privée) : la liste reste en mémoire */
    }
  }, [ids]);

  const toggle = useCallback(
    (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev])),
    [],
  );

  const value = useMemo(() => ({ ids, has: (id) => ids.includes(id), toggle }), [ids, toggle]);
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
};

export const useWatchlist = () => useContext(WatchlistContext);

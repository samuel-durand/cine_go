// URL d'admin « tokenisée » : le tableau de bord n'est pas accessible sur un
// chemin fixe (/admin/films) mais sur /admin/<jeton>/films, où le jeton est
// régénéré à chaque fois que l'admin entre dans la section admin.
// Note : la vraie protection reste le contrôle du rôle admin (JWT) côté API ;
// ceci rend simplement l'URL non prédictible et non partageable.

const STORAGE_KEY = 'adminUrlToken';

export const getAdminToken = () => sessionStorage.getItem(STORAGE_KEY);

export const generateAdminToken = () => {
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('');
  sessionStorage.setItem(STORAGE_KEY, token);
  return token;
};

// Construit un chemin admin avec le jeton courant, ex: adminPath('/films')
export const adminPath = (subPath = '') => `/admin/${getAdminToken() || 'invalid'}${subPath}`;

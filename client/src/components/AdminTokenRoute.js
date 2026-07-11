import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { generateAdminToken, getAdminToken } from '../utils/adminUrl';

// Point d'entrée /admin : génère un nouveau jeton à chaque visite
// puis redirige vers l'URL tokenisée du tableau de bord.
export const AdminRedirect = () => {
  const [token] = useState(() => generateAdminToken());
  return <Navigate to={`/admin/${token}`} replace />;
};

// Garde des pages admin : si le jeton de l'URL ne correspond pas à celui de
// la session, on repasse par /admin qui régénère un jeton valide.
export const AdminTokenGuard = ({ children }) => {
  const { adminToken } = useParams();

  if (!adminToken || adminToken !== getAdminToken()) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

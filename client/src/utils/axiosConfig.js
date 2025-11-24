import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Créer une instance axios configurée
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Configuration pour les requêtes cross-origin
  withCredentials: false,
});

// Intercepteur de requête pour ajouter les en-têtes nécessaires
axiosInstance.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification s'il existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs CORS
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gérer les erreurs CORS spécifiquement
    if (error.code === 'ERR_NETWORK' || 
        error.message?.includes('CORS') || 
        error.message?.includes('Network Error') ||
        (error.response?.status === 0 && !error.response?.data)) {
      console.error('Erreur CORS ou réseau détectée:', error);
      console.error('Assurez-vous que le serveur autorise les requêtes depuis:', window.location.origin);
      // Afficher un message d'erreur plus clair
      error.corsError = true;
      error.message = 'Erreur de connexion au serveur. Vérifiez la configuration CORS du serveur.';
    }
    return Promise.reject(error);
  }
);

// Configurer axios par défaut pour utiliser cette instance
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 30000;
axios.defaults.withCredentials = false;

// Intercepteur global pour axios (pour compatibilité avec le code existant)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur global de réponse pour gérer les erreurs CORS
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || 
        error.message?.includes('CORS') || 
        error.message?.includes('Network Error')) {
      console.error('Erreur CORS détectée:', error);
      error.corsError = true;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_URL };


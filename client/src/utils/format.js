// Helpers d'affichage partagés par les pages publiques.
import { API_URL } from './axiosConfig';

// Les images uploadées (/uploads/...) sont servies par l'API ; les autres sont des URL absolues.
export const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const capitalize = (text = '') => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

export const genreName = (film) => capitalize(film?.genre?.nom || '');

// 155 -> "2h35"
export const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
};

// Heure de fin estimée (film + ~15 min de publicités/bandes-annonces)
export const endTime = (heure, duree, pubs = 15) => {
  if (!heure || !duree) return '';
  const [h, m] = heure.split(':').map(Number);
  const total = h * 60 + m + duree + pubs;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Date locale au format YYYY-MM-DD (évite le décalage UTC de toISOString)
export const toISODate = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// La date d'une séance est renvoyée en "YYYY-MM-DDT00:00:00.000Z" : on ne garde que le jour
export const seanceDay = (seance) => (seance?.date || '').slice(0, 10);

export const parseDay = (isoDay) => {
  const [y, m, d] = isoDay.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// "2026-11-16" -> "Lundi 16 novembre"
export const formatDayLong = (isoDay) =>
  capitalize(parseDay(isoDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

export const formatReleaseDate = (value) =>
  value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const DAY_MS = 24 * 60 * 60 * 1000;

export const isNewRelease = (film, days = 14) => {
  if (!film?.dateSortie) return false;
  const diff = Date.now() - new Date(film.dateSortie).getTime();
  return diff >= 0 && diff < days * DAY_MS;
};

export const isComingSoon = (film) => film?.dateSortie && new Date(film.dateSortie).getTime() > Date.now();

export const formatPrice = (value) =>
  `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export const SALLE_LABELS = {
  classic: 'Standard',
  vip: 'VIP',
  premium: 'Premium',
  imax: 'IMAX',
  '4dx': '4DX',
};

// Convertit une URL YouTube (watch, youtu.be, ou simple identifiant) en URL d'intégration
export const trailerEmbedUrl = (url) => {
  if (!url) return '';
  if (/\.(mp4|webm|m3u8)(\?|$)/i.test(url)) return url;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  if (/^[\w-]{11}$/.test(url)) return `https://www.youtube.com/embed/${url}?autoplay=1`;
  return url;
};

// "2026-12-10..." -> "10 déc."
export const formatShortDate = (value) =>
  value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

// 11838 -> "11,8 k"
export const formatCount = (n) =>
  n >= 1000 ? `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k` : String(n || 0);

// ---- Catégories de films (logique « grand réseau ») ----
const byOrder = (key) => (a, b) => (a[key] ?? 9999) - (b[key] ?? 9999);

// Films au cinéma : déjà sortis, triés par mise en avant puis par date de sortie récente
export const filmsAuCinema = (films) =>
  films
    .filter((f) => !isComingSoon(f))
    .sort((a, b) => byOrder('homeOrder')(a, b) || new Date(b.dateSortie) - new Date(a.dateSortie));

// Les plus attendus : sorties à venir, classées par attente
export const filmsPlusAttendus = (films) =>
  films.filter(isComingSoon).sort((a, b) => byOrder('attenteOrder')(a, b) || (b.envies || 0) - (a.envies || 0));

// Prochaines sorties : à venir, par date de sortie
export const filmsProchainement = (films) =>
  films.filter(isComingSoon).sort((a, b) => new Date(a.dateSortie) - new Date(b.dateSortie));

export const isVideoFile = (url) => /\.(mp4|webm|m3u8)(\?|$)/i.test(url || '');

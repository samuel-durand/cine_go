import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Chip, Container, Grid, IconButton, Rating, TextField, Typography,
} from '@mui/material';
import {
  ConfirmationNumber, Delete, LocationOn, Movie, PlayArrow, Reply, Send, Star, EventBusy, Favorite, WarningAmber,
} from '@mui/icons-material';
import WatchlistButton from '../components/films/WatchlistButton';
import api from '../utils/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import {
  formatDayLong, formatDuration, formatReleaseDate, genreName, imageUrl, isComingSoon, SALLE_LABELS, toISODate,
} from '../utils/format';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import TrailerDialog from '../components/films/TrailerDialog';
import DayStrip from '../components/seances/DayStrip';
import ShowtimeButton from '../components/seances/ShowtimeButton';

const sectionTitleSx = { mb: 3, fontSize: { xs: '1.5rem', md: '1.85rem' } };

const isUpcoming = (seance) => {
  const [h, m] = seance.heure.split(':').map(Number);
  const [y, mo, d] = seance.date.slice(0, 10).split('-').map(Number);
  return new Date(y, mo - 1, d, h, m) >= new Date();
};

// Regroupe les séances par cinéma puis par format de salle
const groupByCinema = (seances) => {
  const groups = new Map();
  seances.forEach((seance) => {
    const cinema = seance.salle?.cinema || { _id: 'unknown', nom: 'Cinéma' };
    if (!groups.has(cinema._id)) groups.set(cinema._id, { cinema, formats: new Map() });
    const type = seance.salle?.type || 'classic';
    const formats = groups.get(cinema._id).formats;
    if (!formats.has(type)) formats.set(type, []);
    formats.get(type).push(seance);
  });
  return [...groups.values()];
};

const FilmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // Séances
  const [availableDates, setAvailableDates] = useState(null);
  const [selectedDate, setSelectedDate] = useState(toISODate());
  const [seances, setSeances] = useState([]);
  const [seancesLoading, setSeancesLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState('');

  // Notes
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  // Commentaires
  const [commentaires, setCommentaires] = useState([]);
  const [myCommentaire, setMyCommentaire] = useState(null);
  const [commentaireText, setCommentaireText] = useState('');
  const [commentaireRating, setCommentaireRating] = useState(0);
  const [commentaireLoading, setCommentaireLoading] = useState(false);
  const [replyOpen, setReplyOpen] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  const fetchFilm = useCallback(async () => {
    try {
      const { data } = await api.get(`/films/${id}`);
      setFilm(data);
      setAverageRating(data.averageRating || data.note || 0);
      setTotalRatings(data.ratings?.length || 0);
    } catch (error) {
      console.error('Erreur lors du chargement du film:', error);
      setFilm(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserRating = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get(`/films/${id}/rating`);
      setUserRating(data.userRating);
      setAverageRating(data.averageRating || 0);
      setTotalRatings(data.totalRatings || 0);
    } catch (error) {
      if (error.response?.status !== 404) console.error('Erreur lors du chargement de la note:', error);
    }
  }, [id, user]);

  const fetchCommentaires = useCallback(async () => {
    try {
      const { data } = await api.get(`/commentaires/film/${id}`);
      setCommentaires(data);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    }
  }, [id]);

  const fetchMyCommentaire = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get(`/commentaires/film/${id}/my-comment`);
      setMyCommentaire(data);
      setCommentaireText(data.commentaire);
      setCommentaireRating(data.rating);
    } catch (error) {
      if (error.response?.status !== 404) console.error('Erreur lors du chargement de votre commentaire:', error);
    }
  }, [id, user]);

  useEffect(() => {
    fetchFilm();
    fetchCommentaires();
  }, [fetchFilm, fetchCommentaires]);

  useEffect(() => {
    fetchUserRating();
    fetchMyCommentaire();
  }, [fetchUserRating, fetchMyCommentaire]);

  // Jours ayant des séances : si aucune séance aujourd'hui, on se place sur le premier jour disponible
  useEffect(() => {
    api.get('/seances/dates', { params: { filmId: id } })
      .then(({ data }) => {
        setAvailableDates(data);
        const today = toISODate();
        if (data.length && !data.includes(today)) setSelectedDate(data[0]);
      })
      .catch(() => setAvailableDates(null));
  }, [id]);

  useEffect(() => {
    setSeancesLoading(true);
    api.get('/seances', { params: { filmId: id, date: selectedDate } })
      .then(({ data }) => setSeances(data))
      .catch((error) => {
        console.error('Erreur lors du chargement des séances:', error);
        setSeances([]);
      })
      .finally(() => setSeancesLoading(false));
  }, [id, selectedDate]);

  // Lien « Réserver » depuis l'accueil : défilement jusqu'aux séances
  useEffect(() => {
    if (!loading && location.hash === '#seances') {
      document.getElementById('seances')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, location.hash]);

  const cinemas = useMemo(() => {
    const map = new Map();
    seances.forEach((s) => s.salle?.cinema && map.set(s.salle.cinema._id, s.salle.cinema));
    return [...map.values()];
  }, [seances]);

  const visibleSeances = selectedCinema
    ? seances.filter((s) => s.salle?.cinema?._id === selectedCinema)
    : seances;
  const grouped = groupByCinema(visibleSeances);

  // Séance réservable la plus proche dans le temps pour le jour choisi
  const nextSeance = useMemo(
    () => visibleSeances.find((s) => s.placesDisponibles > 0 && isUpcoming(s)),
    [visibleSeances],
  );

  const handleRatingChange = async (_, newValue) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newValue) return;
    try {
      const { data } = await api.post(`/films/${id}/rating`, { rating: newValue * 2 });
      setUserRating(newValue * 2);
      setAverageRating(data.averageRating);
      fetchUserRating();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la notation');
    }
  };

  const handleSubmitCommentaire = async () => {
    if (!commentaireText.trim()) return alert('Veuillez saisir un commentaire.');
    if (!commentaireRating) return alert('Veuillez donner une note.');
    setCommentaireLoading(true);
    try {
      await api.post(`/commentaires/film/${id}`, { commentaire: commentaireText.trim(), rating: commentaireRating });
      await Promise.all([fetchCommentaires(), fetchMyCommentaire()]);
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de l'ajout du commentaire");
    } finally {
      setCommentaireLoading(false);
    }
    return undefined;
  };

  const handleSubmitReply = async (commentId) => {
    const texte = replyTexts[commentId];
    if (!texte?.trim()) return;
    try {
      await api.post(`/commentaires/${commentId}/reponse`, { texte: texte.trim() });
      await fetchCommentaires();
      setReplyOpen({ ...replyOpen, [commentId]: false });
      setReplyTexts({ ...replyTexts, [commentId]: '' });
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de l'ajout de la réponse");
    }
  };

  const handleDeleteReply = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) return;
    try {
      await api.delete(`/commentaires/${commentId}/reponse`);
      await fetchCommentaires();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression de la réponse');
    }
  };

  if (loading) return <Loader />;

  if (!film) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">Film non trouvé</Alert>
      </Container>
    );
  }

  const poster = imageUrl(film.image);
  const backdrop = imageUrl(film.backdrop);
  const soon = isComingSoon(film);
  const meta = [genreName(film), formatDuration(film.duree), film.dateSortie && `Sortie le ${formatReleaseDate(film.dateSortie)}`].filter(Boolean);

  return (
    <Box>
      {/* ------------------------------------------------------------ Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 560, md: 640 },
          display: 'flex',
          alignItems: 'flex-end',
          bgcolor: film.backdropColor || colors.bgDeep,
        }}
      >
        {(backdrop || poster) && (
          <Box
            sx={{
              position: 'absolute',
              inset: backdrop ? 0 : '-40px',
              backgroundImage: `url(${backdrop || poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              filter: backdrop ? 'none' : 'blur(30px) brightness(0.45)',
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, rgba(15,16,20,0.9) 0%, rgba(15,16,20,0.5) 50%, rgba(15,16,20,0.1) 100%), linear-gradient(0deg, ${colors.bg} 0%, rgba(15,16,20,0) 50%)`,
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', px: { xs: 2, md: 10 }, pt: { xs: 12, md: 16 }, pb: { xs: 4, md: 7 } }}>
          <Grid container spacing={{ xs: 3, md: 5 }} alignItems="flex-end">
            <Grid item xs={5} sm={4} md={2.6}>
              <Box sx={{ aspectRatio: '2 / 3', borderRadius: '6px', overflow: 'hidden', bgcolor: colors.paper, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
                {poster ? (
                  <Box component="img" src={poster} alt={film.titre} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Movie sx={{ fontSize: 72, color: '#3a3b45' }} />
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={8} md={9.4}>
              <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4.25rem' }, mb: 1.5, textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>
                {film.titre}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, mb: 2 }}>
                {meta.join('  |  ')}
              </Typography>
              {film.realisateur && (
                <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                  De <Box component="span" sx={{ color: '#fff', fontWeight: 500 }}>{film.realisateur}</Box>
                </Typography>
              )}
              {film.acteurs?.length > 0 && (
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Avec <Box component="span" sx={{ color: '#fff', fontWeight: 500 }}>{film.acteurs.slice(0, 4).join(', ')}</Box>
                </Typography>
              )}
              {film.avertissement && (
                <Typography sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', color: colors.textMuted, fontSize: '0.88rem', maxWidth: 680, mb: 2.5 }}>
                  <WarningAmber sx={{ fontSize: 18, color: 'primary.main', mt: '2px' }} />
                  {film.avertissement}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 3 }}>
                {soon ? (
                  film.envies > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Favorite sx={{ color: 'primary.main', fontSize: 28 }} />
                      <Typography sx={{ fontWeight: 700 }}>
                        {film.envies.toLocaleString('fr-FR')}{' '}
                        <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>personnes veulent le voir</Box>
                      </Typography>
                    </Box>
                  )
                ) : (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ color: 'primary.main', fontSize: 32 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>
                          {Number(averageRating || 0).toFixed(1)}<Box component="span" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>/10</Box>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {totalRatings} note{totalRatings > 1 ? 's' : ''} spectateurs
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {user ? (userRating ? 'Votre note' : 'Notez ce film') : 'Connectez-vous pour noter'}
                      </Typography>
                      <Rating value={userRating ? userRating / 2 : 0} precision={0.5} onChange={handleRatingChange} sx={{ color: 'primary.main' }} />
                    </Box>
                  </>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {!soon && (
                  <Button variant="contained" size="large" startIcon={<ConfirmationNumber />} href="#seances">
                    Réserver maintenant
                  </Button>
                )}
                {film.trailerUrl && (
                  <Button variant="outlined" size="large" startIcon={<PlayArrow />} onClick={() => setTrailerOpen(true)} sx={{ bgcolor: 'rgba(10,10,14,0.35)' }}>
                    Bande-annonce
                  </Button>
                )}
                <WatchlistButton filmId={film._id} variant="button" sx={{ bgcolor: 'rgba(10,10,14,0.35)' }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 } }}>
        {/* -------------------------------------------------------- Séances */}
        <Box component="section" id="seances" sx={{ pt: 6, scrollMarginTop: 80 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Typography variant="h3" component="h2" sx={{ ...sectionTitleSx, mb: 0 }}>
              Séances
            </Typography>
            {nextSeance && (
              <Button variant="contained" onClick={() => navigate(`/reservation/${nextSeance._id}`)} startIcon={<ConfirmationNumber />}>
                Prochaine séance · {nextSeance.heure}
              </Button>
            )}
          </Box>

          {soon && availableDates?.length === 0 ? (
            <EmptyState icon={EventBusy} title={`Sortie le ${formatReleaseDate(film.dateSortie)}`}>
              Les séances ouvriront prochainement à la réservation. Ajoutez le film à « Ma liste » pour ne pas l'oublier.
            </EmptyState>
          ) : (
          <>
          <DayStrip value={selectedDate} onChange={setSelectedDate} availableDates={availableDates} />

          {cinemas.length > 1 && (
            <Box className="no-scrollbar" sx={{ display: 'flex', gap: 1, mt: 3, overflowX: 'auto' }}>
              <Chip label="Tous les cinémas" onClick={() => setSelectedCinema('')} color={selectedCinema ? 'default' : 'primary'} variant={selectedCinema ? 'outlined' : 'filled'} />
              {cinemas.map((c) => (
                <Chip
                  key={c._id}
                  label={c.nom}
                  onClick={() => setSelectedCinema(c._id === selectedCinema ? '' : c._id)}
                  color={c._id === selectedCinema ? 'primary' : 'default'}
                  variant={c._id === selectedCinema ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          )}

          <Typography color="text.secondary" sx={{ mt: 3, mb: 2 }}>
            {formatDayLong(selectedDate)}
          </Typography>

          {seancesLoading ? (
            <Loader minHeight={160} />
          ) : grouped.length === 0 ? (
            <EmptyState icon={EventBusy} title="Aucune séance ce jour-là">
              Choisissez une autre date dans le calendrier ci-dessus.
            </EmptyState>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {grouped.map(({ cinema, formats }) => (
                <Box key={cinema._id} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography
                        component={cinema._id !== 'unknown' ? Link : 'span'}
                        to={`/cinemas/${cinema._id}`}
                        sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                      >
                        {cinema.nom}
                      </Typography>
                      {cinema.adresse && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <LocationOn sx={{ fontSize: 16 }} />
                          {cinema.adresse}, {cinema.codePostal} {cinema.ville}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {[...formats.entries()].map(([type, list]) => (
                    <Box key={type} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', py: 1.5, borderTop: `1px solid ${colors.border}` }}>
                      <Box sx={{ width: 90, flexShrink: 0, pt: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: type === 'classic' ? 'text.secondary' : 'primary.main' }}>
                          {SALLE_LABELS[type] || type}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, pt: 1 }}>
                        {list.map((s) => (
                          <ShowtimeButton key={s._id} seance={s} duree={film.duree} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          )}
          </>
          )}
        </Box>

        {/* ------------------------------------------------------ Synopsis */}
        <Grid container spacing={6} sx={{ pt: 8 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" component="h2" sx={sectionTitleSx}>
              Synopsis
            </Typography>
            <Typography sx={{ color: colors.textMuted, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{film.description}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 3, borderRadius: 3, bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
              {[
                ['Genre', genreName(film)],
                ['Durée', formatDuration(film.duree)],
                ['Date de sortie', formatReleaseDate(film.dateSortie)],
                ['Réalisation', film.realisateur],
                ['Distribution', film.acteurs?.join(', ')],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <Box key={label} sx={{ py: 1.25, '&:not(:last-of-type)': { borderBottom: `1px solid ${colors.border}` } }}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
            </Box>
          </Grid>
        </Grid>

        {/* ----------------------------------------------------------- Avis */}
        <Box component="section" sx={{ pt: 8 }}>
          <Typography variant="h3" component="h2" sx={sectionTitleSx}>
            Avis des spectateurs <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>({commentaires.length})</Box>
          </Typography>

          <Box sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
            {user ? (
              <>
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  {myCommentaire ? 'Modifier votre avis' : 'Donnez votre avis'}
                </Typography>
                <Rating
                  value={commentaireRating / 2}
                  precision={0.5}
                  onChange={(_, v) => setCommentaireRating((v || 0) * 2)}
                  sx={{ color: 'primary.main', mb: 1.5 }}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Qu'avez-vous pensé du film ?"
                  value={commentaireText}
                  onChange={(e) => setCommentaireText(e.target.value)}
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${commentaireText.length}/1000`}
                />
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmitCommentaire}
                  disabled={commentaireLoading || !commentaireText.trim() || !commentaireRating}
                  sx={{ mt: 1 }}
                >
                  {myCommentaire ? 'Mettre à jour' : 'Publier'}
                </Button>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Typography color="text.secondary">Connectez-vous pour partager votre avis sur ce film.</Typography>
                <Button component={Link} to="/login" variant="outlined">Se connecter</Button>
              </Box>
            )}
          </Box>

          {commentaires.length === 0 ? (
            <Typography color="text.secondary">Aucun avis pour le moment. Soyez le premier !</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {commentaires.map((c) => (
                <Box key={c._id} sx={{ p: 3, borderRadius: 3, bgcolor: colors.paper, border: `1px solid ${colors.border}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: '#000', fontWeight: 800 }}>
                      {c.user?.prenom?.[0] || c.user?.nom?.[0] || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{c.user?.prenom} {c.user?.nom}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                    <Chip icon={<Star sx={{ fontSize: 16 }} />} label={`${c.rating}/10`} size="small" color="primary" />
                  </Box>
                  <Typography sx={{ color: colors.textMuted, whiteSpace: 'pre-line' }}>{c.commentaire}</Typography>

                  {c.reponse?.texte && (
                    <Box sx={{ mt: 2, ml: { xs: 0, md: 4 }, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${colors.gold}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {c.reponse.reponduPar?.prenom} {c.reponse.reponduPar?.nom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          · {new Date(c.reponse.reponduLe).toLocaleDateString('fr-FR')}
                        </Typography>
                        {(user?.id === c.reponse.reponduPar?._id || user?.role === 'admin') && (
                          <IconButton size="small" onClick={() => handleDeleteReply(c._id)} sx={{ ml: 'auto' }} aria-label="Supprimer la réponse">
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: colors.textMuted }}>{c.reponse.texte}</Typography>
                    </Box>
                  )}

                  {!c.reponse?.texte && user && (
                    replyOpen[c._id] ? (
                      <Box sx={{ mt: 2, ml: { xs: 0, md: 4 } }}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={2}
                          placeholder="Répondre au commentaire…"
                          value={replyTexts[c._id] || ''}
                          onChange={(e) => setReplyTexts({ ...replyTexts, [c._id]: e.target.value })}
                        />
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button size="small" variant="contained" onClick={() => handleSubmitReply(c._id)} disabled={!replyTexts[c._id]?.trim()}>
                            Répondre
                          </Button>
                          <Button size="small" onClick={() => setReplyOpen({ ...replyOpen, [c._id]: false })} sx={{ color: 'text.secondary' }}>
                            Annuler
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Button size="small" startIcon={<Reply />} onClick={() => setReplyOpen({ ...replyOpen, [c._id]: true })} sx={{ mt: 1, color: 'text.secondary', px: 1 }}>
                        Répondre
                      </Button>
                    )
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      <TrailerDialog url={film.trailerUrl} title={film.titre} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </Box>
  );
};

export default FilmDetail;

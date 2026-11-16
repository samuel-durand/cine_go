import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import api from '../utils/axiosConfig';
import { filmsAuCinema, filmsPlusAttendus, filmsProchainement } from '../utils/format';
import Loader from '../components/common/Loader';
import SectionHeader from '../components/common/SectionHeader';
import HeroCarousel from '../components/films/HeroCarousel';
import FilmRail from '../components/films/FilmRail';
import CinemaPicker from '../components/CinemaPicker';
import Faq from '../components/Faq';

const HERO_COUNT = 6;

const Section = ({ children, sx }) => (
  <Box component="section" sx={{ mb: { xs: 7, md: 9 }, ...sx }}>
    {children}
  </Box>
);

const Home = () => {
  const [films, setFilms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/films'), api.get('/cinemas')])
      .then(([filmsRes, cinemasRes]) => {
        setFilms(filmsRes.data);
        setCinemas(cinemasRes.data);
      })
      .catch((error) => console.error("Erreur lors du chargement de la page d'accueil:", error))
      .finally(() => setLoading(false));
  }, []);

  const { auCinema, attendus, prochainement, hero } = useMemo(() => {
    const now = filmsAuCinema(films);
    // Le bandeau privilégie les films ayant un visuel paysage
    const withVisual = [...now.filter((f) => f.backdrop), ...now.filter((f) => !f.backdrop && f.image)];
    return {
      auCinema: now,
      attendus: filmsPlusAttendus(films).slice(0, 20),
      prochainement: filmsProchainement(films).slice(0, 20),
      hero: withVisual.slice(0, HERO_COUNT),
    };
  }, [films]);

  if (loading) return <Loader minHeight="100vh" />;

  return (
    <Box>
      <HeroCarousel films={hero} />

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 10 }, mt: { xs: 4, md: 6 } }}>
        {cinemas.length > 0 && (
          <Section>
            <CinemaPicker cinemas={cinemas} />
          </Section>
        )}

        <Section>
          <SectionHeader title="Films au cinéma" to="/films" linkLabel="Tous les films actuellement au cinéma" />
          {auCinema.length ? (
            <FilmRail films={auCinema.slice(0, 24)} />
          ) : (
            <Typography color="text.secondary">Aucun film à l'affiche pour le moment.</Typography>
          )}
        </Section>

        {attendus.length > 0 && (
          <Section>
            <SectionHeader title="Les plus attendus" to="/films?tab=attendus" linkLabel="Voir tous les films attendus" />
            <FilmRail films={attendus} cardProps={{ showEnvies: true }} />
          </Section>
        )}

        {prochainement.length > 0 && (
          <Section>
            <SectionHeader title="Prochaines sorties au cinéma" to="/films?tab=prochainement" linkLabel="Toutes les sorties cinéma" />
            <FilmRail films={prochainement} />
          </Section>
        )}

        <Section sx={{ maxWidth: 900 }}>
          <Faq />
        </Section>
      </Container>
    </Box>
  );
};

export default Home;

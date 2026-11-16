import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { colors } from '../theme';

const QUESTIONS = [
  {
    q: 'Quels sont les tarifs pour une place de cinéma ?',
    a: "Le prix dépend du film et de la salle choisie : les salles VIP, Premium et IMAX appliquent un supplément par siège. Le total est affiché avant le paiement, siège par siège.",
  },
  {
    q: 'Comment connaître les sorties cinéma ?',
    a: "Les prochaines sorties sont présentées dans les rubriques « Les plus attendus » et « Prochainement » de la page Films. Ajoutez un film à « Ma liste » pour le retrouver facilement.",
  },
  {
    q: 'Comment récupérer mon billet ?',
    a: "Après le paiement, votre billet avec QR code est envoyé par e-mail et reste disponible dans « Mes billets ». Présentez simplement le QR code à l'entrée de la salle.",
  },
  {
    q: 'Que se passe-t-il si ma séance est annulée ?',
    a: 'Si le cinéma annule votre réservation, le remboursement est effectué automatiquement sur la carte bancaire utilisée pour le paiement.',
  },
];

const Faq = () => (
  <Box component="section">
    <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1 }}>Vous avez une question ?</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Les réponses aux questions les plus fréquentes.</Typography>
    {QUESTIONS.map(({ q, a }) => (
      <Accordion
        key={q}
        disableGutters
        elevation={0}
        sx={{ bgcolor: 'transparent', borderBottom: `1px solid ${colors.border}`, '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />} sx={{ px: 0, py: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{q}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2.5 }}>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{a}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </Box>
);

export default Faq;

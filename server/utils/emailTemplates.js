// Template HTML pour l'email de confirmation de réservation
// Version compacte et compatible avec les clients email
const reservationConfirmationTemplate = (reservation, user) => {
  const seance = reservation.seance || {};
  const film = seance.film || {};
  const salle = seance.salle || {};
  
  const dateSeance = seance.date ? new Date(seance.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Date non disponible';
  
  const heureSeance = seance.heure || 'Heure non disponible';
  
  // Liste des sièges
  let seatsList = '';
  if (reservation.sieges && reservation.sieges.length > 0) {
    seatsList = reservation.sieges.map(seat => 
      `<tr>
        <td style="padding: 8px 12px; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 4px; margin: 4px 0;">
          <div style="color: #FFFFFF; font-weight: 600; font-size: 13px; margin-bottom: 2px;">${seat.label}</div>
          <div style="color: #CCCCCC; font-size: 11px;">Rangée ${seat.row} • Siège ${seat.number}${seat.type !== 'standard' ? ` • ${seat.type.toUpperCase()}` : ''}</div>
        </td>
      </tr>`
    ).join('');
  } else if (reservation.places && reservation.places.length > 0) {
    seatsList = reservation.places.map(place => 
      `<tr>
        <td style="padding: 8px 12px; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 4px;">
          <div style="color: #FFFFFF; font-weight: 600; font-size: 13px;">${place}</div>
        </td>
      </tr>`
    ).join('');
  } else {
    seatsList = `<tr>
      <td style="padding: 8px 12px; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 4px;">
        <div style="color: #FFFFFF; font-weight: 600; font-size: 13px;">${reservation.nombrePlaces} place${reservation.nombrePlaces > 1 ? 's' : ''} (sans numérotation)</div>
      </td>
    </tr>`;
  }

  const prixTotal = reservation.prixTotal || 0;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réservation</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #121212;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #121212;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px;">
          <!-- Header -->
          <tr>
            <td style="background-color: #121212; padding: 30px 20px; text-align: center; border-bottom: 1px solid #333333;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <div style="display: inline-block; width: 50px; height: 50px; background-color: #2a2a2a; border-radius: 8px; text-align: center; line-height: 50px;">
                      <span style="font-size: 28px;">🎬</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #FFD700; font-size: 28px; font-weight: 700;">
                      Ciné Go
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px;">
                    <p style="margin: 0; color: #CCCCCC; font-size: 14px; font-weight: 500;">
                      Confirmation de réservation
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 25px 20px;">
              <p style="margin: 0 0 15px 0; color: #FFFFFF; font-size: 14px; line-height: 1.5;">
                Bonjour <strong style="color: #FFD700;">${user.prenom || ''} ${user.nom || ''}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #CCCCCC; font-size: 14px; line-height: 1.5;">
                Votre réservation a été confirmée avec succès ! Nous sommes ravis de vous accueillir.
              </p>
              
              <!-- Détails de la réservation -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #1a1a1a; border: 1px solid #333333; border-left: 3px solid #FFD700; border-radius: 4px; margin: 15px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <h2 style="margin: 0 0 12px 0; color: #FFD700; font-size: 16px; font-weight: 700;">
                      📋 Détails de votre réservation
                    </h2>
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #CCCCCC; font-size: 12px; width: 35%; font-weight: 500;">Film:</td>
                        <td style="padding: 6px 0; color: #FFFFFF; font-size: 13px; font-weight: 600;">${film.titre || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #CCCCCC; font-size: 12px; font-weight: 500;">Date:</td>
                        <td style="padding: 6px 0; color: #FFFFFF; font-size: 13px;">${dateSeance}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #CCCCCC; font-size: 12px; font-weight: 500;">Heure:</td>
                        <td style="padding: 6px 0; color: #FFFFFF; font-size: 13px;">${heureSeance}</td>
                      </tr>
                      ${salle.nom ? `
                      <tr>
                        <td style="padding: 6px 0; color: #CCCCCC; font-size: 12px; font-weight: 500;">Salle:</td>
                        <td style="padding: 6px 0; color: #FFFFFF; font-size: 13px;">${salle.nom}${salle.type ? ` <span style="color: #FFD700;">(${salle.type})</span>` : ''}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 6px 0; color: #CCCCCC; font-size: 12px; font-weight: 500;">Nombre de places:</td>
                        <td style="padding: 6px 0; color: #FFFFFF; font-size: 13px;">${reservation.nombrePlaces}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #CCCCCC; font-size: 12px; font-weight: 500;">Montant total:</td>
                        <td style="padding: 6px 0; color: #FFD700; font-size: 18px; font-weight: 700;">${prixTotal.toFixed(2)} €</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Sièges réservés -->
              ${reservation.sieges && reservation.sieges.length > 0 ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #1a1a1a; border: 1px solid #333333; border-left: 3px solid #4CAF50; border-radius: 4px; margin: 15px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <h3 style="margin: 0 0 12px 0; color: #4CAF50; font-size: 15px; font-weight: 700;">
                      🎫 Vos sièges
                    </h3>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      ${seatsList}
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Informations importantes -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #2a1a00; border: 1px solid #664400; border-left: 3px solid #FFC107; border-radius: 4px; margin: 15px 0;">
                <tr>
                  <td style="padding: 12px 15px;">
                    <p style="margin: 0; color: #FFD700; font-size: 12px; line-height: 1.5; font-weight: 500;">
                      <strong style="color: #FFC107;">⚠️ Important:</strong> Veuillez arriver au moins 15 minutes avant le début de la séance. Présentez ce email ou votre billet électronique à l'entrée.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Numéro de réservation -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #121212; border: 1px solid #333333; border-radius: 4px; margin: 20px 0;">
                <tr>
                  <td style="padding: 18px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #CCCCCC; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      Numéro de réservation
                    </p>
                    <p style="margin: 0; color: #FFD700; font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${reservation._id ? reservation._id.toString().substring(0, 8).toUpperCase() : 'N/A'}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 15px 0 0 0; color: #CCCCCC; font-size: 12px; line-height: 1.5;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
              
              <p style="margin: 15px 0 0 0; color: #FFFFFF; font-size: 14px; line-height: 1.5;">
                Bon film ! 🎬<br>
                <strong style="color: #FFD700;">L'équipe Ciné Go</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #121212; padding: 18px 20px; text-align: center; border-top: 1px solid #333333;">
              <p style="margin: 0; color: #CCCCCC; font-size: 11px; font-weight: 500;">
                © ${new Date().getFullYear()} Ciné Go. Tous droits réservés.
              </p>
              <p style="margin: 6px 0 0 0; color: #666666; font-size: 10px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

module.exports = {
  reservationConfirmationTemplate
};


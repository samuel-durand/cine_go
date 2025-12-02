// Template HTML pour l'email de confirmation de réservation
const reservationConfirmationTemplate = (reservation, user, qrCodeBase64 = '') => {
  const dateSeance = reservation.seance?.date 
    ? new Date(reservation.seance.date).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Date non disponible';
  
  const heureSeance = reservation.seance?.heure || 'Heure non disponible';
  const filmTitre = reservation.seance?.film?.titre || 'Film non disponible';
  const salleNom = reservation.seance?.salle?.nom || 'Salle non disponible';
  const cinemaNom = reservation.seance?.salle?.cinema?.nom || reservation.seance?.salle?.cinema || 'Cinéma non disponible';
  
  const places = reservation.places?.join(', ') || `${reservation.nombrePlaces} place(s)`;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réservation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">Ciné Go</h1>
              <p style="margin: 10px 0 0 0; color: #000000; font-size: 16px;">Confirmation de réservation</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px;">Bonjour ${user.prenom || user.nom || 'Client'},</p>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Votre réservation a été confirmée avec succès ! Nous avons le plaisir de vous confirmer les détails de votre séance.
              </p>
              
              <!-- Reservation Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <h2 style="margin: 0 0 20px 0; color: #FFD700; font-size: 22px; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Détails de la réservation</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #333333; font-size: 14px; display: inline-block; width: 150px;">Film :</strong>
                    <span style="color: #666666; font-size: 14px;">${filmTitre}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #333333; font-size: 14px; display: inline-block; width: 150px;">Cinéma :</strong>
                    <span style="color: #666666; font-size: 14px;">${cinemaNom}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #333333; font-size: 14px; display: inline-block; width: 150px;">Salle :</strong>
                    <span style="color: #666666; font-size: 14px;">${salleNom}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #333333; font-size: 14px; display: inline-block; width: 150px;">Date :</strong>
                    <span style="color: #666666; font-size: 14px;">${dateSeance}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #333333; font-size: 14px; display: inline-block; width: 150px;">Heure :</strong>
                    <span style="color: #666666; font-size: 14px;">${heureSeance}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #333333; font-size: 14px; display: inline-block; width: 150px;">Places :</strong>
                    <span style="color: #666666; font-size: 14px;">${places}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #dddddd; margin-top: 10px;">
                    <strong style="color: #333333; font-size: 16px; display: inline-block; width: 150px;">Montant total :</strong>
                    <span style="color: #FFD700; font-size: 18px; font-weight: bold;">${reservation.prixTotal?.toFixed(2) || '0.00'} €</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 14px; line-height: 1.6;">
                <strong>Numéro de réservation :</strong> ${reservation._id || 'N/A'}
              </p>
              
              ${qrCodeBase64 ? `
              <!-- QR Code Section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <tr>
                        <td align="center" style="padding-bottom: 15px;">
                          <img src="${qrCodeBase64}" alt="QR Code de réservation" style="display: block; width: 200px; height: 200px; margin: 0 auto;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 5px;">
                          <p style="margin: 0; color: #333333; font-size: 14px; font-weight: bold; text-align: center;">
                            Code de vérification
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                            Présentez ce QR code à l'entrée
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 30px 0 0 0; color: #333333; font-size: 14px; line-height: 1.6;">
                Nous vous remercions pour votre confiance et vous souhaitons une excellente séance !
              </p>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 12px; line-height: 1.6;">
                Pour toute question ou modification, n'hésitez pas à nous contacter.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #ffffff; font-size: 12px;">© ${new Date().getFullYear()} Ciné Go - Tous droits réservés</p>
              <p style="margin: 10px 0 0 0; color: #888888; font-size: 11px;">Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
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


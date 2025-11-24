const nodemailer = require('nodemailer');
const { reservationConfirmationTemplate } = require('./emailTemplates');

// Variable globale pour stocker le transporteur Ethereal
let etherealTransporter = null;
let etherealAccount = null;

// Cr├®er un compte Ethereal pour les tests
const createEtherealAccount = async () => {
  try {
    const account = await nodemailer.createTestAccount();
    console.log('Ô£à Compte Ethereal cr├®├®:', account.user);
    return account;
  } catch (error) {
    console.error('ÔØî Erreur lors de la cr├®ation du compte Ethereal:', error);
    return null;
  }
};

// Configuration du transporteur email
const createTransporter = async () => {
  // En local (d├®veloppement), toujours utiliser Ethereal Email
  const isLocal = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
  
  if (isLocal) {
    // Mode d├®veloppement : utiliser Ethereal Email (gratuit pour tests)
    if (!etherealTransporter) {
      console.log('­ƒôº Mode local d├®tect├® : utilisation d\'Ethereal Email pour les tests');
      
      // Utiliser les credentials fournis ou cr├®er un nouveau compte
      if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
        etherealAccount = {
          user: process.env.ETHEREAL_USER,
          pass: process.env.ETHEREAL_PASS
        };
      } else {
        etherealAccount = await createEtherealAccount();
      }
      
      if (etherealAccount) {
        etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: etherealAccount.user,
            pass: etherealAccount.pass
          }
        });
        console.log('Ô£à Transporteur Ethereal configur├®');
        console.log('­ƒôº Les emails seront envoy├®s via Ethereal Email');
        console.log('­ƒÆí Consultez les logs pour les URLs de pr├®visualisation');
      } else {
        console.error('ÔØî Impossible de cr├®er un compte Ethereal');
        return null;
      }
    }
    
    return etherealTransporter;
  }
  
  // En production, utiliser le service configur├®
  // Priorit├® : Gmail si configur├®, sinon SMTP, sinon Ethereal en fallback
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('ÔØî EMAIL_SERVICE=gmail configur├® mais EMAIL_USER ou EMAIL_PASSWORD manquant');
      console.warn('ÔÜá´©Å  Utilisation d\'Ethereal Email en fallback');
      // Fallback vers Ethereal si Gmail mal configur├® - continue vers le code de fallback
    } else {
      console.log('Ô£à Configuration Gmail d├®tect├®e - utilisation de Gmail pour l\'envoi d\'emails');
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('ÔØî EMAIL_SERVICE=smtp configur├® mais SMTP_HOST, EMAIL_USER ou EMAIL_PASSWORD manquant');
      console.warn('ÔÜá´©Å  Utilisation d\'Ethereal Email en fallback');
    } else {
      console.log('Ô£à Configuration SMTP d├®tect├®e - utilisation de SMTP pour l\'envoi d\'emails');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }
  
  // Fallback : utiliser Ethereal si aucun service n'est configur├® ou si la configuration est incompl├¿te
  console.warn('ÔÜá´©Å  Aucun service email valide configur├® en production, utilisation d\'Ethereal Email en fallback');
  console.warn('ÔÜá´©Å  Pour utiliser Gmail en production, configurez :');
  console.warn('    EMAIL_SERVICE=gmail');
  console.warn('    EMAIL_USER=votre-email@gmail.com');
  console.warn('    EMAIL_PASSWORD=votre-mot-de-passe-app');
  
  if (!etherealTransporter) {
    if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
      etherealAccount = {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS
      };
    } else {
      etherealAccount = await createEtherealAccount();
    }
    
    if (etherealAccount) {
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealAccount.user,
          pass: etherealAccount.pass
        }
      });
      console.log('Ô£à Transporteur Ethereal configur├® (fallback)');
    } else {
      console.error('ÔØî Impossible de cr├®er un compte Ethereal');
      return null;
    }
  }
  
  return etherealTransporter;
};

// Envoyer un email de confirmation de r├®servation
const sendReservationConfirmation = async (reservation, user) => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log('­ƒôº Email non envoy├® : impossible de configurer le service email');
      return { success: false, error: 'Service email non configur├®' };
    }
    
    const fromEmail = process.env.EMAIL_FROM || 
                     (process.env.EMAIL_USER ? `"Cin├® Go" <${process.env.EMAIL_USER}>` : 
                      (etherealAccount ? `"Cin├® Go" <${etherealAccount.user}>` : '"Cin├® Go" <noreply@cinego.com>'));
    
    const mailOptions = {
      from: fromEmail,
      to: user.email,
      subject: `Confirmation de r├®servation - ${reservation.seance?.film?.titre || 'Votre r├®servation'}`,
      html: reservationConfirmationTemplate(reservation, user)
    };

    const info = await transporter.sendMail(mailOptions);
    
    // V├®rifier si on utilise Ethereal (en local ou si c'est le transporteur actif)
    const isLocal = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Si on utilise Ethereal, afficher l'URL de pr├®visualisation de mani├¿re visible
    if (isLocal && previewUrl) {
      console.log('\nÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ');
      console.log('­ƒôº EMAIL ENVOY├ë VIA ETHERAL EMAIL');
      console.log('ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ');
      console.log('­ƒô¼ Destinataire:', user.email);
      console.log('­ƒôï Sujet:', mailOptions.subject);
      console.log('­ƒöù URL DE PR├ëVISUALISATION:');
      console.log('   ' + previewUrl);
      console.log('ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ\n');
    } else if (previewUrl) {
      // Si on a une URL m├¬me en production (peu probable mais possible)
      console.log('­ƒôº Email envoy├® via Ethereal Email');
      console.log('­ƒöù Pr├®visualisation:', previewUrl);
      console.log('­ƒô¼ Destinataire:', user.email);
    } else {
      console.log('Ô£à Email de confirmation envoy├® ├á:', user.email);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('ÔØî Erreur lors de l\'envoi de l\'email:', error);
    // Ne pas faire ├®chouer la r├®servation si l'email ├®choue
    return { success: false, error: error.message };
  }
};

// Envoyer un email de notification admin (optionnel)
const sendAdminNotification = async (reservation, user) => {
  try {
    if (!process.env.ADMIN_EMAIL) {
      return { success: false, error: 'ADMIN_EMAIL non configur├®' };
    }

    const transporter = await createTransporter();
    
    if (!transporter) {
      return { success: false, error: 'Service email non configur├®' };
    }
    
    const fromEmail = process.env.EMAIL_FROM || 
                     (process.env.EMAIL_USER ? `"Cin├® Go" <${process.env.EMAIL_USER}>` : 
                      (etherealAccount ? `"Cin├® Go" <${etherealAccount.user}>` : '"Cin├® Go" <noreply@cinego.com>'));
    
    const mailOptions = {
      from: fromEmail,
      to: process.env.ADMIN_EMAIL,
      subject: `Nouvelle r├®servation - ${reservation.seance?.film?.titre || 'R├®servation'}`,
      html: `
        <h2>Nouvelle r├®servation</h2>
        <p><strong>Client:</strong> ${user.prenom} ${user.nom} (${user.email})</p>
        <p><strong>Film:</strong> ${reservation.seance?.film?.titre || 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date(reservation.seance?.date).toLocaleDateString('fr-FR')} ├á ${reservation.seance?.heure}</p>
        <p><strong>Places:</strong> ${reservation.nombrePlaces}</p>
        <p><strong>Montant:</strong> ${reservation.prixTotal} Ôé¼</p>
        <p><strong>R├®servation ID:</strong> ${reservation._id}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // V├®rifier si on utilise Ethereal (en local ou si c'est le transporteur actif)
    const isLocal = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Si on utilise Ethereal, afficher l'URL de pr├®visualisation de mani├¿re visible
    if (isLocal && previewUrl) {
      console.log('\nÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ');
      console.log('­ƒôº NOTIFICATION ADMIN ENVOY├ëE VIA ETHERAL EMAIL');
      console.log('ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ');
      console.log('­ƒô¼ Destinataire:', process.env.ADMIN_EMAIL);
      console.log('­ƒôï Sujet:', mailOptions.subject);
      console.log('­ƒöù URL DE PR├ëVISUALISATION:');
      console.log('   ' + previewUrl);
      console.log('ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ\n');
    } else if (previewUrl) {
      console.log('­ƒôº Notification admin envoy├®e via Ethereal Email');
      console.log('­ƒöù Pr├®visualisation:', previewUrl);
    } else {
      console.log('Ô£à Notification admin envoy├®e ├á:', process.env.ADMIN_EMAIL);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('ÔØî Erreur lors de l\'envoi de la notification admin:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendReservationConfirmation,
  sendAdminNotification
};


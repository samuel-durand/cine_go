const nodemailer = require('nodemailer');
const { reservationConfirmationTemplate } = require('./emailTemplates');

// Variable globale pour stocker le transporteur Ethereal
let etherealTransporter = null;
let etherealAccount = null;

// Créer un compte Ethereal pour les tests
const createEtherealAccount = async () => {
  try {
    const account = await nodemailer.createTestAccount();
    console.log('✅ Compte Ethereal créé:', account.user);
    return account;
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte Ethereal:', error);
    return null;
  }
};

// Configuration du transporteur email
const createTransporter = async () => {
  // En local (développement), toujours utiliser Ethereal Email
  const isLocal = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
  
  if (isLocal) {
    // Mode développement : utiliser Ethereal Email (gratuit pour tests)
    if (!etherealTransporter) {
      console.log('📧 Mode local détecté : utilisation d\'Ethereal Email pour les tests');
      
      // Utiliser les credentials fournis ou créer un nouveau compte
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
        console.log('✅ Transporteur Ethereal configuré');
        console.log('📧 Les emails seront envoyés via Ethereal Email');
        console.log('💡 Consultez les logs pour les URLs de prévisualisation');
      } else {
        console.error('❌ Impossible de créer un compte Ethereal');
        return null;
      }
    }
    
    return etherealTransporter;
  }
  
  // En production, utiliser le service configuré
  // Priorité : Gmail si configuré, sinon SMTP, sinon Ethereal en fallback
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ EMAIL_SERVICE=gmail configuré mais EMAIL_USER ou EMAIL_PASSWORD manquant');
      console.warn('⚠️  Utilisation d\'Ethereal Email en fallback');
      // Fallback vers Ethereal si Gmail mal configuré - continue vers le code de fallback
    } else {
      console.log('✅ Configuration Gmail détectée - utilisation de Gmail pour l\'envoi d\'emails');
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
      console.error('❌ EMAIL_SERVICE=smtp configuré mais SMTP_HOST, EMAIL_USER ou EMAIL_PASSWORD manquant');
      console.warn('⚠️  Utilisation d\'Ethereal Email en fallback');
    } else {
      console.log('✅ Configuration SMTP détectée - utilisation de SMTP pour l\'envoi d\'emails');
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
  
  // Fallback : utiliser Ethereal si aucun service n'est configuré ou si la configuration est incomplète
  console.warn('⚠️  Aucun service email valide configuré en production, utilisation d\'Ethereal Email en fallback');
  console.warn('⚠️  Pour utiliser Gmail en production, configurez :');
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
      console.log('✅ Transporteur Ethereal configuré (fallback)');
    } else {
      console.error('❌ Impossible de créer un compte Ethereal');
      return null;
    }
  }
  
  return etherealTransporter;
};

// Envoyer un email de confirmation de réservation
const sendReservationConfirmation = async (reservation, user) => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      console.log('📧 Email non envoyé : impossible de configurer le service email');
      return { success: false, error: 'Service email non configuré' };
    }
    
    const fromEmail = process.env.EMAIL_FROM || 
                     (process.env.EMAIL_USER ? `"Ciné Go" <${process.env.EMAIL_USER}>` : 
                      (etherealAccount ? `"Ciné Go" <${etherealAccount.user}>` : '"Ciné Go" <noreply@cinego.com>'));
    
    const mailOptions = {
      from: fromEmail,
      to: user.email,
      subject: `Confirmation de réservation - ${reservation.seance?.film?.titre || 'Votre réservation'}`,
      html: reservationConfirmationTemplate(reservation, user)
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Vérifier si on utilise Ethereal (en local ou si c'est le transporteur actif)
    const isLocal = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Si on utilise Ethereal, afficher l'URL de prévisualisation de manière visible
    if (isLocal && previewUrl) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📧 EMAIL ENVOYÉ VIA ETHERAL EMAIL');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📬 Destinataire:', user.email);
      console.log('📋 Sujet:', mailOptions.subject);
      console.log('🔗 URL DE PRÉVISUALISATION:');
      console.log('   ' + previewUrl);
      console.log('═══════════════════════════════════════════════════════════\n');
    } else if (previewUrl) {
      // Si on a une URL même en production (peu probable mais possible)
      console.log('📧 Email envoyé via Ethereal Email');
      console.log('🔗 Prévisualisation:', previewUrl);
      console.log('📬 Destinataire:', user.email);
    } else {
      console.log('✅ Email de confirmation envoyé à:', user.email);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    // Ne pas faire échouer la réservation si l'email échoue
    return { success: false, error: error.message };
  }
};

// Envoyer un email de notification admin (optionnel)
const sendAdminNotification = async (reservation, user) => {
  try {
    if (!process.env.ADMIN_EMAIL) {
      return { success: false, error: 'ADMIN_EMAIL non configuré' };
    }

    const transporter = await createTransporter();
    
    if (!transporter) {
      return { success: false, error: 'Service email non configuré' };
    }
    
    const fromEmail = process.env.EMAIL_FROM || 
                     (process.env.EMAIL_USER ? `"Ciné Go" <${process.env.EMAIL_USER}>` : 
                      (etherealAccount ? `"Ciné Go" <${etherealAccount.user}>` : '"Ciné Go" <noreply@cinego.com>'));
    
    const mailOptions = {
      from: fromEmail,
      to: process.env.ADMIN_EMAIL,
      subject: `Nouvelle réservation - ${reservation.seance?.film?.titre || 'Réservation'}`,
      html: `
        <h2>Nouvelle réservation</h2>
        <p><strong>Client:</strong> ${user.prenom} ${user.nom} (${user.email})</p>
        <p><strong>Film:</strong> ${reservation.seance?.film?.titre || 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date(reservation.seance?.date).toLocaleDateString('fr-FR')} à ${reservation.seance?.heure}</p>
        <p><strong>Places:</strong> ${reservation.nombrePlaces}</p>
        <p><strong>Montant:</strong> ${reservation.prixTotal} €</p>
        <p><strong>Réservation ID:</strong> ${reservation._id}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Vérifier si on utilise Ethereal (en local ou si c'est le transporteur actif)
    const isLocal = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    // Si on utilise Ethereal, afficher l'URL de prévisualisation de manière visible
    if (isLocal && previewUrl) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📧 NOTIFICATION ADMIN ENVOYÉE VIA ETHERAL EMAIL');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📬 Destinataire:', process.env.ADMIN_EMAIL);
      console.log('📋 Sujet:', mailOptions.subject);
      console.log('🔗 URL DE PRÉVISUALISATION:');
      console.log('   ' + previewUrl);
      console.log('═══════════════════════════════════════════════════════════\n');
    } else if (previewUrl) {
      console.log('📧 Notification admin envoyée via Ethereal Email');
      console.log('🔗 Prévisualisation:', previewUrl);
    } else {
      console.log('✅ Notification admin envoyée à:', process.env.ADMIN_EMAIL);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification admin:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendReservationConfirmation,
  sendAdminNotification
};


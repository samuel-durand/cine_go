"""Gabarits HTML des e-mails (charte Ciné Go : or #FFD700 sur fond sombre)."""
from datetime import date, datetime
from html import escape

JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
        "septembre", "octobre", "novembre", "décembre"]


def format_date_fr(value) -> str:
    if isinstance(value, str):
        try:
            value = date.fromisoformat(value[:10])
        except ValueError:
            return value
    if isinstance(value, datetime):
        value = value.date()
    if not isinstance(value, date):
        return "Date non disponible"
    return f"{JOURS[value.weekday()]} {value.day} {MOIS[value.month - 1]} {value.year}"


def _row(label, value, highlight=False):
    style = "color:#FFD700;font-size:18px;font-weight:bold;" if highlight else "color:#666;font-size:14px;"
    return (f'<tr><td style="padding:10px 0;border-top:1px solid #eee;">'
            f'<strong style="color:#333;font-size:14px;display:inline-block;width:150px;">{label}</strong>'
            f'<span style="{style}">{escape(str(value))}</span></td></tr>')


def reservation_confirmation(info: dict, user: dict, qr_cid: str | None = None) -> str:
    """`info` : film, cinema, salle, date, heure, places, prix_total, reference."""
    qr_block = ""
    if qr_cid:
        qr_block = f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
          <tr><td align="center">
            <img src="cid:{qr_cid}" alt="QR Code" width="200" height="200" style="display:block;" />
            <p style="margin:12px 0 0;color:#333;font-size:14px;font-weight:bold;">Code de vérification</p>
            <p style="margin:4px 0 0;color:#666;font-size:12px;">Présentez ce QR code à l'entrée</p>
          </td></tr>
        </table>"""

    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Confirmation de réservation</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#0f1014;padding:30px;text-align:center;border-bottom:4px solid #FFD700;">
    <h1 style="margin:0;color:#fff;font-size:28px;">Ciné <span style="color:#FFD700;">Go</span></h1>
    <p style="margin:10px 0 0;color:#ccc;font-size:16px;">Confirmation de réservation</p>
  </td></tr>
  <tr><td style="padding:40px 30px;">
    <p style="margin:0 0 20px;color:#333;font-size:16px;">Bonjour {escape(user.get('prenom') or user.get('nom') or 'Client')},</p>
    <p style="margin:0 0 30px;color:#333;font-size:16px;line-height:1.6;">
      Votre réservation est confirmée. Voici le détail de votre séance.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;padding:20px;">
      <tr><td><h2 style="margin:0 0 10px;color:#0f1014;font-size:20px;">{escape(info['film'])}</h2></td></tr>
      {_row('Cinéma :', info['cinema'])}
      {_row('Salle :', info['salle'])}
      {_row('Date :', format_date_fr(info['date']))}
      {_row('Heure :', info['heure'])}
      {_row('Places :', info['places'])}
      {_row('Montant total :', f"{info['prix_total']:.2f} €", highlight=True)}
    </table>
    <p style="margin:20px 0 0;color:#333;font-size:14px;"><strong>Numéro de réservation :</strong> {escape(str(info['reference']))}</p>
    {qr_block}
    <p style="margin:30px 0 0;color:#333;font-size:14px;">Excellente séance !</p>
  </td></tr>
  <tr><td style="background:#0f1014;padding:20px;text-align:center;">
    <p style="margin:0;color:#fff;font-size:12px;">© {datetime.now().year} Ciné Go - Tous droits réservés</p>
    <p style="margin:10px 0 0;color:#888;font-size:11px;">Cet e-mail est envoyé automatiquement, merci de ne pas y répondre.</p>
  </td></tr>
</table></td></tr></table></body></html>"""

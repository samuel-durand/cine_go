"""Envoi des e-mails transactionnels.

Configuration (variables d'environnement) :
  EMAIL_SERVICE = gmail | smtp | ethereal   (absent : e-mails écrits dans instance/outbox/)
  EMAIL_USER, EMAIL_PASSWORD                (gmail / smtp / ethereal)
  SMTP_HOST, SMTP_PORT, SMTP_SECURE         (smtp)
  EMAIL_FROM, ADMIN_EMAIL
"""
import io
import json
import logging
import os
import smtplib
import ssl
import threading
import time
from datetime import datetime
from email.message import EmailMessage
from email.utils import make_msgid
from pathlib import Path

import qrcode

from .email_templates import reservation_confirmation

log = logging.getLogger(__name__)
OUTBOX_DIR = Path(__file__).resolve().parents[2] / "instance" / "outbox"


def _smtp_settings():
    service = (os.getenv("EMAIL_SERVICE") or "").lower()
    user, password = os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD")
    if service == "gmail" and user and password:
        return {"host": "smtp.gmail.com", "port": 465, "ssl": True, "user": user, "password": password}
    if service == "ethereal":
        user = os.getenv("ETHEREAL_USER") or user
        password = os.getenv("ETHEREAL_PASS") or password
        if user and password:
            return {"host": "smtp.ethereal.email", "port": 587, "ssl": False, "user": user, "password": password}
    if service == "smtp" and os.getenv("SMTP_HOST") and user and password:
        return {"host": os.getenv("SMTP_HOST"), "port": int(os.getenv("SMTP_PORT", "587")),
                "ssl": os.getenv("SMTP_SECURE") == "true", "user": user, "password": password}
    return None


def _sender(settings) -> str:
    if os.getenv("EMAIL_FROM"):
        return os.getenv("EMAIL_FROM")
    address = settings["user"] if settings else "noreply@cinego.com"
    return f'"Ciné Go" <{address}>'


def _qr_png(data: dict) -> bytes:
    img = qrcode.make(json.dumps(data), error_correction=qrcode.constants.ERROR_CORRECT_H, border=1)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


def send_email(to: str, subject: str, html: str, inline_images: dict | None = None) -> dict:
    """Envoie un e-mail HTML. `inline_images` : {cid: bytes PNG}."""
    settings = _smtp_settings()
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = _sender(settings), to, subject
    msg.set_content("Votre client e-mail ne supporte pas le HTML.")
    msg.add_alternative(html, subtype="html")
    for cid, png in (inline_images or {}).items():
        msg.get_payload()[1].add_related(png, maintype="image", subtype="png", cid=f"<{cid}>")

    if settings is None:
        # Pas de SMTP configuré : on écrit l'e-mail sur disque pour pouvoir le consulter
        OUTBOX_DIR.mkdir(parents=True, exist_ok=True)
        path = OUTBOX_DIR / f"{datetime.now():%Y%m%d-%H%M%S}-{int(time.time() * 1000) % 1000}.eml"
        path.write_bytes(bytes(msg))
        log.warning("📧 Aucun service e-mail configuré : e-mail enregistré dans %s", path)
        return {"success": True, "previewUrl": None, "outboxFile": str(path), "isLocal": True}

    try:
        if settings["ssl"]:
            server = smtplib.SMTP_SSL(settings["host"], settings["port"], context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(settings["host"], settings["port"])
            server.starttls(context=ssl.create_default_context())
        with server:
            server.login(settings["user"], settings["password"])
            server.send_message(msg)
        log.info("✅ E-mail envoyé à %s", to)
        return {"success": True, "previewUrl": None, "isLocal": False}
    except Exception as exc:  # noqa: BLE001 - l'échec d'un e-mail ne doit jamais casser la réservation
        log.error("❌ Erreur d'envoi d'e-mail : %s", exc)
        return {"success": False, "error": str(exc)}


def _reservation_info(reservation) -> dict:
    seance = reservation.seance
    salle = seance.salle if seance else None
    return {
        "film": seance.film.titre if seance and seance.film else "Film",
        "cinema": salle.cinema.nom if salle and salle.cinema else "Cinéma",
        "salle": salle.nom if salle else "Salle",
        "date": seance.date if seance else None,
        "heure": seance.heure if seance else "",
        "places": ", ".join(reservation.places or []) or f"{reservation.nombre_places} place(s)",
        "prix_total": reservation.prix_total or 0,
        "reference": reservation.id,
    }


def send_reservation_confirmation(reservation, user) -> dict:
    qr = _qr_png({
        "reservationId": str(reservation.id),
        "userId": str(user.id),
        "seanceId": str(reservation.seance_id),
        "date": reservation.date_reservation.isoformat() if reservation.date_reservation else None,
    })
    cid = make_msgid(domain="cinego")[1:-1]
    info = _reservation_info(reservation)
    html = reservation_confirmation(info, {"prenom": user.prenom, "nom": user.nom}, cid)
    return send_email(user.email, f"Confirmation de réservation - {info['film']}", html, {cid: qr})


def send_reservation_confirmation_async(app, reservation_id: int):
    """Envoie la confirmation dans un thread pour ne pas ralentir la réponse HTTP."""
    def worker():
        from ..extensions import db
        from ..models import Reservation
        with app.app_context():
            reservation = db.session.get(Reservation, reservation_id)
            if reservation:
                send_reservation_confirmation(reservation, reservation.user)
    threading.Thread(target=worker, daemon=True).start()


def send_test_email(to: str) -> dict:
    info = {"film": "Film de test - Ciné Go", "cinema": "Cinéma Test", "salle": "Salle A",
            "date": datetime.now().date(), "heure": "20:00", "places": "A1, A2",
            "prix_total": 15.5, "reference": f"TEST_{int(time.time())}"}
    cid = make_msgid(domain="cinego")[1:-1]
    qr = _qr_png({"reservationId": info["reference"], "seanceId": "TEST"})
    html = reservation_confirmation(info, {"prenom": "Admin", "nom": "Test"}, cid)
    result = send_email(to, "Test d'envoi d'email - Ciné Go", html, {cid: qr})
    return {**result, "email": to}

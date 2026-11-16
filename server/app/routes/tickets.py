import json
from datetime import datetime

from flask import Blueprint, jsonify

from ..auth import is_owner_or_admin, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Reservation, iso
from ..utils import get_or_404, parse_id, payload

bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")


@bp.post("/validate")
@login_required
def validate_ticket():
    """Validation d'un billet à partir des données du QR code."""
    qr_data = payload().get("qrData")
    if not qr_data:
        raise ApiError("Données QR code manquantes.")
    try:
        info = json.loads(qr_data) if isinstance(qr_data, str) else dict(qr_data)
    except (ValueError, TypeError):
        raise ApiError("Format QR code invalide.")
    if not info.get("reservationId"):
        raise ApiError("ID de réservation manquant.")

    reservation = db.session.get(Reservation, parse_id(info["reservationId"]))
    if not reservation:
        raise ApiError("Réservation non trouvée.", 404)
    if info.get("userId") and str(reservation.user_id) != str(info["userId"]):
        raise ApiError("Utilisateur ne correspond pas.", 403)
    if info.get("seanceId") and str(reservation.seance_id) != str(info["seanceId"]):
        raise ApiError("Séance ne correspond pas.", 403)
    if reservation.statut != "confirmee":
        raise ApiError("Réservation non confirmée.", statut=reservation.statut)
    if reservation.paiement != "paye":
        raise ApiError("Paiement non effectué.", paiement=reservation.paiement)

    seance = reservation.seance
    hour, minute = (int(x) for x in seance.heure.split(":"))
    if datetime.combine(seance.date, datetime.min.time()).replace(hour=hour, minute=minute) < datetime.now():
        raise ApiError("Cette séance est déjà passée.", warning=True)

    return jsonify({"valid": True, "reservation": {
        "id": str(reservation.id),
        "user": reservation.user.to_ref(),
        "film": seance.film.titre if seance.film else None,
        "date": iso(seance.date),
        "heure": seance.heure,
        "salle": seance.salle.nom if seance.salle else None,
        "sieges": [s.to_dict() for s in reservation.sieges],
        "nombrePlaces": reservation.nombre_places,
    }})


@bp.get("/<int:reservation_id>")
@login_required
def get_ticket(reservation_id):
    reservation = get_or_404(Reservation, reservation_id, "Billet non trouvé.")
    if not is_owner_or_admin(reservation.user_id):
        raise ApiError("Accès refusé.", 403)
    return jsonify(reservation.to_dict(seance_kwargs={"film_full": True}))

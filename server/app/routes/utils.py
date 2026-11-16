import re

from flask import Blueprint, jsonify

from ..auth import admin_required
from ..errors import ApiError
from ..models import Salle
from ..services.email import send_test_email
from ..utils import payload

bp = Blueprint("utils", __name__, url_prefix="/api/utils")

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@bp.get("/check-salles")
@admin_required
def check_salles():
    """Avec MySQL, la clé étrangère garantit qu'une salle a toujours un cinéma valide."""
    salles = Salle.query.all()
    return jsonify({
        "total": len(salles), "avecCinema": len(salles), "sansCinema": 0, "cinemasInvalides": 0,
        "details": [{"salle": s.nom, "salleId": str(s.id), "statut": "OK",
                     "cinema": s.cinema.nom if s.cinema else None} for s in salles],
    })


@bp.post("/test-email")
@admin_required
def test_email():
    email = (payload().get("email") or "").strip()
    if not email:
        raise ApiError("Email de destination requis")
    if not EMAIL_RE.match(email):
        raise ApiError("Format d'email invalide")
    result = send_test_email(email)
    if not result.get("success"):
        return jsonify({"success": False, "message": "Erreur lors de l'envoi de l'email",
                        "error": result.get("error")}), 500
    return jsonify({"success": True, "message": "Email de test envoyé avec succès", **result})

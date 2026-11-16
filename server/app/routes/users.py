from flask import Blueprint, g, jsonify

from ..auth import admin_required, login_required
from ..extensions import db
from ..models import Reservation, User
from ..utils import get_or_404, parse_date, payload

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.get("")
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@bp.put("/profile")
@login_required
def update_profile():
    data = payload()
    user = g.user
    for field in ("nom", "prenom"):
        if (data.get(field) or "").strip():
            setattr(user, field, data[field].strip())
    if "telephone" in data:
        user.telephone = data.get("telephone") or None
    if "dateNaissance" in data:
        user.date_naissance = parse_date(data.get("dateNaissance"))
    db.session.commit()
    return jsonify(user.to_dict())


@bp.get("/<int:user_id>")
@admin_required
def get_user(user_id):
    return jsonify(get_or_404(User, user_id, "Utilisateur non trouvé.").to_dict())


@bp.get("/<int:user_id>/stats")
@admin_required
def user_stats(user_id):
    base = Reservation.query.filter_by(user_id=user_id)
    return jsonify({
        "totalReservations": base.count(),
        "reservationsConfirmees": base.filter_by(statut="confirmee").count(),
    })


@bp.delete("/<int:user_id>")
@admin_required
def delete_user(user_id):
    db.session.delete(get_or_404(User, user_id, "Utilisateur non trouvé."))
    db.session.commit()
    return jsonify({"message": "Utilisateur supprimé avec succès."})

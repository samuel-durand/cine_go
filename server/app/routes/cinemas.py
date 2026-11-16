from flask import Blueprint, jsonify

from ..auth import admin_required
from ..errors import ApiError
from ..extensions import db
from ..models import Cinema, Salle
from ..utils import delete_uploaded_image, get_or_404, payload, save_uploaded_image, to_bool

bp = Blueprint("cinemas", __name__, url_prefix="/api/cinemas")

FIELDS = {"nom": "nom", "adresse": "adresse", "ville": "ville", "codePostal": "code_postal",
          "telephone": "telephone", "email": "email", "description": "description", "image": "image"}


def _apply(cinema, data):
    for key, attr in FIELDS.items():
        if key in data and data[key] is not None:
            value = str(data[key]).strip()
            setattr(cinema, attr, value.lower() if key == "email" else value)
    if data.get("actif") is not None:
        cinema.actif = to_bool(data["actif"])
    missing = [k for k in ("nom", "adresse", "ville", "codePostal") if not getattr(cinema, FIELDS[k])]
    if missing:
        raise ApiError(f"Champs requis manquants : {', '.join(missing)}.")


@bp.get("")
def list_cinemas():
    cinemas = Cinema.query.filter_by(actif=True).order_by(Cinema.ville, Cinema.nom)
    return jsonify([c.to_dict() for c in cinemas])


@bp.get("/all")
@admin_required
def list_all_cinemas():
    return jsonify([c.to_dict() for c in Cinema.query.order_by(Cinema.ville, Cinema.nom)])


def _active_salles(cinema_id):
    return [s.to_dict() for s in Salle.query.filter_by(cinema_id=cinema_id, actif=True).order_by(Salle.nom)]


@bp.get("/<int:cinema_id>")
def get_cinema(cinema_id):
    cinema = get_or_404(Cinema, cinema_id, "Cinéma non trouvé.")
    return jsonify({**cinema.to_dict(), "salles": _active_salles(cinema.id)})


@bp.get("/<int:cinema_id>/salles")
def cinema_salles(cinema_id):
    get_or_404(Cinema, cinema_id, "Cinéma non trouvé.")
    return jsonify(_active_salles(cinema_id))


@bp.post("")
@admin_required
def create_cinema():
    data = payload()
    image = save_uploaded_image()
    if image:
        data["image"] = image
    cinema = Cinema()
    _apply(cinema, data)
    db.session.add(cinema)
    db.session.commit()
    return jsonify(cinema.to_dict()), 201


@bp.put("/<int:cinema_id>")
@admin_required
def update_cinema(cinema_id):
    cinema = get_or_404(Cinema, cinema_id, "Cinéma non trouvé.")
    data = payload()
    image = save_uploaded_image()
    if image:
        delete_uploaded_image(cinema.image)
        data["image"] = image
    _apply(cinema, data)
    db.session.commit()
    return jsonify(cinema.to_dict())


@bp.delete("/<int:cinema_id>")
@admin_required
def delete_cinema(cinema_id):
    cinema = get_or_404(Cinema, cinema_id, "Cinéma non trouvé.")
    if Salle.query.filter_by(cinema_id=cinema_id).count():
        raise ApiError("Impossible de supprimer ce cinéma car il contient des salles. "
                       "Supprimez d'abord les salles.")
    db.session.delete(cinema)
    db.session.commit()
    return jsonify({"message": "Cinéma supprimé avec succès."})

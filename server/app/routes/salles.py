from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..errors import ApiError
from ..extensions import db
from ..models import SALLE_TYPES, Cinema, Salle
from ..utils import get_or_404, parse_id, parse_list, payload, to_bool, to_int

bp = Blueprint("salles", __name__, url_prefix="/api/salles")


def _query(active_only):
    query = Salle.query
    if active_only:
        query = query.filter_by(actif=True)
    if request.args.get("cinemaId"):
        query = query.filter_by(cinema_id=parse_id(request.args["cinemaId"]))
    return query.order_by(Salle.nom)


def _apply(salle, data):
    if data.get("cinema") not in (None, ""):
        cinema_id = parse_id(data["cinema"], "Cinéma invalide.")
        get_or_404(Cinema, cinema_id, "Cinéma non trouvé.")
        salle.cinema_id = cinema_id
    if data.get("nom") is not None:
        salle.nom = str(data["nom"]).strip()
    if data.get("type") is not None:
        if data["type"] not in SALLE_TYPES:
            raise ApiError("Type de salle invalide.")
        salle.type = data["type"]
    if data.get("capacite") is not None:
        salle.capacite = to_int(data["capacite"], 0)
    if data.get("description") is not None:
        salle.description = data["description"]
    if data.get("equipements") is not None:
        salle.equipements = parse_list(data["equipements"])
    if isinstance(data.get("plan"), dict):
        salle.plan = data["plan"]
    if data.get("actif") is not None:
        salle.actif = to_bool(data["actif"])
    if not salle.cinema_id or not salle.nom or not salle.capacite or salle.capacite < 1:
        raise ApiError("Cinéma, nom et capacité (≥ 1) sont requis.")


@bp.get("")
def list_salles():
    return jsonify([s.to_dict() for s in _query(active_only=True)])


@bp.get("/all")
@admin_required
def list_all_salles():
    return jsonify([s.to_dict() for s in _query(active_only=False)])


@bp.get("/<int:salle_id>")
def get_salle(salle_id):
    return jsonify(get_or_404(Salle, salle_id, "Salle non trouvée.").to_dict())


@bp.post("")
@admin_required
def create_salle():
    salle = Salle(type="classic", actif=True, equipements=[], plan={"rows": []})
    _apply(salle, payload())
    db.session.add(salle)
    db.session.commit()
    return jsonify(salle.to_dict()), 201


@bp.put("/<int:salle_id>")
@admin_required
def update_salle(salle_id):
    salle = get_or_404(Salle, salle_id, "Salle non trouvée.")
    _apply(salle, payload())
    db.session.commit()
    return jsonify(salle.to_dict())


@bp.delete("/<int:salle_id>")
@admin_required
def delete_salle(salle_id):
    db.session.delete(get_or_404(Salle, salle_id, "Salle non trouvée."))
    db.session.commit()
    return jsonify({"message": "Salle supprimée avec succès."})

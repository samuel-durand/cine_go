from datetime import date as date_cls

from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..errors import ApiError
from ..extensions import db
from ..models import Film, Salle, Seance
from ..services.seats import count_plan_seats, plan_for_salle
from ..utils import get_or_404, parse_date, parse_id, payload, to_bool, to_float, to_int

bp = Blueprint("seances", __name__, url_prefix="/api/seances")

ADMIN_VIEW = {"film_fields": ("titre", "duree", "image")}
PLANNING_VIEW = {"film_fields": ("titre", "duree", "image"), "salle_cinema": False}


def _public_query():
    query = Seance.query.filter(Seance.actif.is_(True), Seance.bloque.is_(False))
    if request.args.get("filmId"):
        query = query.filter(Seance.film_id == parse_id(request.args["filmId"]))
    if request.args.get("cinemaId"):
        query = query.join(Salle, Seance.salle_id == Salle.id).filter(
            Salle.cinema_id == parse_id(request.args["cinemaId"]))
    return query


@bp.get("")
def list_seances():
    """Séances publiques. Filtres : filmId, cinemaId, date (YYYY-MM-DD)."""
    query = _public_query()
    if request.args.get("date"):
        query = query.filter(Seance.date == parse_date(request.args["date"]))
    seances = query.order_by(Seance.date, Seance.heure).all()
    return jsonify([s.to_dict() for s in seances])


@bp.get("/dates")
def available_dates():
    """Jours (à partir d'aujourd'hui) ayant au moins une séance, pour le sélecteur de dates."""
    rows = (_public_query().filter(Seance.date >= date_cls.today())
            .with_entities(Seance.date).distinct().order_by(Seance.date).limit(30).all())
    return jsonify([d.isoformat() for (d,) in rows])


@bp.get("/all")
@admin_required
def list_all_seances():
    seances = Seance.query.order_by(Seance.date.desc(), Seance.heure).all()
    return jsonify([s.to_dict(**ADMIN_VIEW) for s in seances])


@bp.get("/<int:seance_id>")
def get_seance(seance_id):
    seance = get_or_404(Seance, seance_id, "Séance non trouvée.")
    return jsonify(seance.to_dict(with_plan=True, film_full=True))


@bp.post("")
@admin_required
def create_seance():
    data = payload()
    film = get_or_404(Film, parse_id(data.get("film"), "Film invalide."), "Film non trouvé.")
    salle = get_or_404(Salle, parse_id(data.get("salle"), "Salle invalide."), "Salle non trouvée.")
    seance_date = parse_date(data.get("date"))
    if not seance_date or not data.get("heure"):
        raise ApiError("La date et l'heure sont requises.")

    plan = plan_for_salle(salle)
    total = count_plan_seats(plan) or to_int(data.get("placesTotal")) or salle.capacite
    seance = Seance(film_id=film.id, salle_id=salle.id, date=seance_date, heure=data["heure"],
                    plan=plan, places_total=total, places_disponibles=total,
                    prix=to_float(data.get("prix")) or film.prix)
    db.session.add(seance)
    db.session.commit()
    return jsonify(seance.to_dict(**ADMIN_VIEW)), 201


@bp.put("/<int:seance_id>")
@admin_required
def update_seance(seance_id):
    seance = get_or_404(Seance, seance_id, "Séance non trouvée.")
    data = payload()
    if data.get("film"):
        seance.film_id = get_or_404(Film, parse_id(data["film"]), "Film non trouvé.").id
    if data.get("salle"):
        seance.salle_id = get_or_404(Salle, parse_id(data["salle"]), "Salle non trouvée.").id
    if data.get("date"):
        seance.date = parse_date(data["date"])
    if data.get("heure"):
        seance.heure = data["heure"]
    if to_float(data.get("prix")) is not None:
        seance.prix = to_float(data["prix"])
    for key, attr in (("placesTotal", "places_total"), ("placesDisponibles", "places_disponibles")):
        if to_int(data.get(key)) is not None:
            setattr(seance, attr, to_int(data[key]))
    if data.get("actif") is not None:
        seance.actif = to_bool(data["actif"])
    if data.get("bloque") is not None:
        seance.bloque = to_bool(data["bloque"])
    if data.get("raisonBlocage") is not None:
        seance.raison_blocage = data["raisonBlocage"]
    db.session.commit()
    return jsonify(seance.to_dict(**ADMIN_VIEW))


@bp.put("/<int:seance_id>/block")
@admin_required
def block_seance(seance_id):
    seance = get_or_404(Seance, seance_id, "Séance non trouvée.")
    data = payload()
    seance.bloque = to_bool(data.get("bloque"))
    seance.raison_blocage = data.get("raisonBlocage") or ""
    db.session.commit()
    return jsonify(seance.to_dict(**ADMIN_VIEW))


@bp.put("/planning/<int:salle_id>/block-date")
@admin_required
def block_date(salle_id):
    data = payload()
    if not data.get("date"):
        raise ApiError("La date est requise.")
    day = parse_date(data["date"])
    bloque = to_bool(data["bloque"]) if data.get("bloque") is not None else True
    seances = Seance.query.filter_by(salle_id=salle_id, date=day).order_by(Seance.heure).all()
    modified = 0
    for seance in seances:
        if seance.bloque != bloque or seance.raison_blocage != (data.get("raisonBlocage") or ""):
            modified += 1
        seance.bloque, seance.raison_blocage = bloque, data.get("raisonBlocage") or ""
    db.session.commit()
    return jsonify({
        "message": f"{modified} séance(s) {'bloquée(s)' if bloque else 'débloquée(s)'}",
        "count": modified,
        "seances": [s.to_dict(**PLANNING_VIEW) for s in seances],
    })


@bp.get("/planning/<int:salle_id>")
@admin_required
def planning(salle_id):
    query = Seance.query.filter_by(salle_id=salle_id)
    args = request.args
    if args.get("startDate") and args.get("endDate"):
        query = query.filter(Seance.date.between(parse_date(args["startDate"]), parse_date(args["endDate"])))
    elif args.get("date"):
        query = query.filter(Seance.date == parse_date(args["date"]))
    seances = query.order_by(Seance.date, Seance.heure).all()
    return jsonify([s.to_dict(**PLANNING_VIEW) for s in seances])


@bp.delete("/<int:seance_id>")
@admin_required
def delete_seance(seance_id):
    db.session.delete(get_or_404(Seance, seance_id, "Séance non trouvée."))
    db.session.commit()
    return jsonify({"message": "Séance supprimée avec succès."})

from flask import Blueprint, g, jsonify

from ..auth import admin_required, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Cinema, Commentaire, Film, FilmRating, Genre, Salle, Seance
from ..utils import (delete_uploaded_image, get_or_404, parse_date, parse_id, parse_list,
                     payload, save_uploaded_image, to_bool, to_float, to_int)

bp = Blueprint("films", __name__, url_prefix="/api/films")


def _cinemas_showing(film_id):
    """Cinémas ayant au moins une séance active et non bloquée pour ce film."""
    cinemas = (Cinema.query.join(Salle, Salle.cinema_id == Cinema.id)
               .join(Seance, Seance.salle_id == Salle.id)
               .filter(Seance.film_id == film_id, Seance.actif.is_(True), Seance.bloque.is_(False))
               .distinct().order_by(Cinema.ville, Cinema.nom).all())
    return [c.to_ref() for c in cinemas]


def _apply(film, data):
    if data.get("titre") is not None:
        film.titre = data["titre"].strip()
    if data.get("description") is not None:
        film.description = data["description"]
    if data.get("duree") not in (None, ""):
        film.duree = to_int(data["duree"], film.duree)
    if data.get("genre") not in (None, ""):
        genre_id = parse_id(data["genre"], "Genre invalide.")
        get_or_404(Genre, genre_id, "Genre non trouvé.")
        film.genre_id = genre_id
    if data.get("realisateur") is not None:
        film.realisateur = data["realisateur"].strip()
    if data.get("acteurs") is not None:
        film.acteurs = parse_list(data["acteurs"])
    if "trailerUrl" in data:
        film.trailer_url = (data.get("trailerUrl") or "").strip()
    if data.get("image") is not None:
        film.image = data["image"]
    if data.get("dateSortie") not in (None, ""):
        film.date_sortie = parse_date(data["dateSortie"])
    if data.get("prix") not in (None, ""):
        film.prix = to_float(data["prix"], film.prix)
    if data.get("note") not in (None, ""):
        film.note = to_float(data["note"], 0)
    if data.get("actif") is not None:
        film.actif = to_bool(data["actif"])

    required = {"titre": film.titre, "description": film.description, "duree": film.duree,
                "genre": film.genre_id, "realisateur": film.realisateur,
                "dateSortie": film.date_sortie, "prix": film.prix}
    missing = [k for k, v in required.items() if v in (None, "")]
    if missing:
        raise ApiError(f"Champs requis manquants : {', '.join(missing)}.")


@bp.get("")
def list_films():
    films = Film.query.filter_by(actif=True).order_by(Film.date_sortie.desc()).all()
    return jsonify([f.to_dict() for f in films])


@bp.get("/all")
@admin_required
def list_all_films():
    return jsonify([f.to_dict() for f in Film.query.order_by(Film.date_sortie.desc())])


@bp.get("/<int:film_id>")
def get_film(film_id):
    film = get_or_404(Film, film_id, "Film non trouvé.")
    comments = (Commentaire.query.filter_by(film_id=film_id)
                .order_by(Commentaire.created_at.desc()))
    return jsonify({
        **film.to_dict(genre_description=True),
        "cinemas": _cinemas_showing(film_id),
        "commentaires": [c.to_dict() for c in comments.limit(10)],
        "totalCommentaires": comments.count(),
    })


@bp.get("/<int:film_id>/cinemas")
def film_cinemas(film_id):
    get_or_404(Film, film_id, "Film non trouvé.")
    return jsonify(_cinemas_showing(film_id))


@bp.post("/upload-image")
@admin_required
def upload_image():
    url = save_uploaded_image()
    if not url:
        raise ApiError("Aucun fichier fourni.")
    return jsonify({"imageUrl": url})


@bp.post("")
@admin_required
def create_film():
    data = payload()
    image = save_uploaded_image()
    if image:
        data["image"] = image
    film = Film(acteurs=[], note=0, average_rating=0, actif=True, image="", trailer_url="")
    _apply(film, data)
    db.session.add(film)
    db.session.commit()
    return jsonify(film.to_dict()), 201


@bp.put("/<int:film_id>")
@admin_required
def update_film(film_id):
    film = get_or_404(Film, film_id, "Film non trouvé.")
    data = payload()
    image = save_uploaded_image()
    if image:
        delete_uploaded_image(film.image)
        data["image"] = image
    _apply(film, data)
    db.session.commit()
    return jsonify(film.to_dict())


@bp.delete("/<int:film_id>")
@admin_required
def delete_film(film_id):
    db.session.delete(get_or_404(Film, film_id, "Film non trouvé."))
    db.session.commit()
    return jsonify({"message": "Film supprimé avec succès."})


@bp.post("/<int:film_id>/rating")
@login_required
def rate_film(film_id):
    film = get_or_404(Film, film_id, "Film non trouvé.")
    rating = to_float(payload().get("rating"))
    if rating is None or not 0 < rating <= 10:
        raise ApiError("La note doit être entre 0 et 10.")

    existing = FilmRating.query.filter_by(film_id=film_id, user_id=g.user.id).first()
    if existing:
        existing.rating = rating
    else:
        film.ratings.append(FilmRating(user_id=g.user.id, rating=rating))
    db.session.flush()
    film.recalculate_average()
    db.session.commit()
    return jsonify({
        "message": "Note mise à jour avec succès." if existing else "Note ajoutée avec succès.",
        "averageRating": film.average_rating,
        "userRating": rating,
    })


@bp.get("/<int:film_id>/rating")
@login_required
def get_rating(film_id):
    film = get_or_404(Film, film_id, "Film non trouvé.")
    mine = next((r.rating for r in film.ratings if r.user_id == g.user.id), None)
    return jsonify({"userRating": mine, "averageRating": film.average_rating,
                    "totalRatings": len(film.ratings)})

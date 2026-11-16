from flask import Blueprint, jsonify

from ..auth import admin_required
from ..errors import ApiError
from ..extensions import db
from ..models import Film, Genre
from ..utils import get_or_404, payload, to_bool

bp = Blueprint("genres", __name__, url_prefix="/api/genres")


@bp.get("")
def list_genres():
    return jsonify([g.to_dict() for g in Genre.query.filter_by(actif=True).order_by(Genre.nom)])


@bp.get("/all")
@admin_required
def list_all_genres():
    return jsonify([g.to_dict() for g in Genre.query.order_by(Genre.nom)])


@bp.get("/<int:genre_id>")
def get_genre(genre_id):
    return jsonify(get_or_404(Genre, genre_id, "Genre non trouvé.").to_dict())


@bp.post("")
@admin_required
def create_genre():
    data = payload()
    nom = (data.get("nom") or "").strip().lower()
    if not nom:
        raise ApiError("Le nom du genre est requis.")
    if Genre.query.filter_by(nom=nom).first():
        raise ApiError("Ce genre existe déjà.")
    genre = Genre(nom=nom, description=(data.get("description") or "").strip(), actif=True)
    db.session.add(genre)
    db.session.commit()
    return jsonify(genre.to_dict()), 201


@bp.put("/<int:genre_id>")
@admin_required
def update_genre(genre_id):
    genre = get_or_404(Genre, genre_id, "Genre non trouvé.")
    data = payload()
    if data.get("nom") is not None:
        nom = data["nom"].strip().lower()
        if Genre.query.filter(Genre.nom == nom, Genre.id != genre_id).first():
            raise ApiError("Ce nom de genre existe déjà.")
        genre.nom = nom
    if data.get("description") is not None:
        genre.description = data["description"].strip()
    if data.get("actif") is not None:
        genre.actif = to_bool(data["actif"])
    db.session.commit()
    return jsonify(genre.to_dict())


@bp.delete("/<int:genre_id>")
@admin_required
def delete_genre(genre_id):
    genre = get_or_404(Genre, genre_id, "Genre non trouvé.")
    count = Film.query.filter_by(genre_id=genre_id).count()
    if count:
        raise ApiError(f"Impossible de supprimer ce genre car {count} film(s) l'utilise(nt). Désactivez-le plutôt.")
    db.session.delete(genre)
    db.session.commit()
    return jsonify({"message": "Genre supprimé avec succès."})

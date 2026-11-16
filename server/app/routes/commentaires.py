from flask import Blueprint, g, jsonify

from ..auth import is_owner_or_admin, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import Commentaire, Film, utcnow
from ..utils import get_or_404, payload, to_float

bp = Blueprint("commentaires", __name__, url_prefix="/api/commentaires")

MAX_LEN = 1000


def _clean_text(text, empty_message):
    text = (text or "").strip()
    if not text:
        raise ApiError(empty_message)
    if len(text) > MAX_LEN:
        raise ApiError(f"Le texte ne peut pas dépasser {MAX_LEN} caractères.")
    return text


def _clean_rating(value):
    rating = to_float(value)
    if rating is None or not 0 < rating <= 10:
        raise ApiError("La note doit être entre 0 et 10.")
    return rating


def _get(comment_id) -> Commentaire:
    return get_or_404(Commentaire, comment_id, "Commentaire non trouvé.")


@bp.get("/film/<int:film_id>")
def list_for_film(film_id):
    comments = Commentaire.query.filter_by(film_id=film_id).order_by(Commentaire.created_at.desc())
    return jsonify([c.to_dict() for c in comments])


@bp.get("/film/<int:film_id>/my-comment")
@login_required
def my_comment(film_id):
    comment = Commentaire.query.filter_by(film_id=film_id, user_id=g.user.id).first()
    if not comment:
        raise ApiError("Vous n'avez pas encore commenté ce film.", 404)
    return jsonify(comment.to_dict())


@bp.get("/<int:comment_id>")
def get_comment(comment_id):
    return jsonify(_get(comment_id).to_dict(with_film=True))


@bp.post("/film/<int:film_id>")
@login_required
def upsert_comment(film_id):
    data = payload()
    text = _clean_text(data.get("commentaire"), "Le commentaire est requis.")
    rating = _clean_rating(data.get("rating"))
    get_or_404(Film, film_id, "Film non trouvé.")

    comment = Commentaire.query.filter_by(film_id=film_id, user_id=g.user.id).first()
    created = comment is None
    if created:
        comment = Commentaire(film_id=film_id, user_id=g.user.id)
        db.session.add(comment)
    comment.commentaire, comment.rating, comment.updated_at = text, rating, utcnow()
    db.session.commit()
    return jsonify({
        "message": "Commentaire ajouté avec succès." if created else "Commentaire mis à jour avec succès.",
        "commentaire": comment.to_dict(),
    }), 201 if created else 200


@bp.put("/<int:comment_id>")
@login_required
def update_comment(comment_id):
    comment = _get(comment_id)
    if not is_owner_or_admin(comment.user_id):
        raise ApiError("Vous n'êtes pas autorisé à modifier ce commentaire.", 403)
    data = payload()
    if "commentaire" in data:
        comment.commentaire = _clean_text(data["commentaire"], "Le commentaire ne peut pas être vide.")
    if "rating" in data:
        comment.rating = _clean_rating(data["rating"])
    comment.updated_at = utcnow()
    db.session.commit()
    return jsonify({"message": "Commentaire mis à jour avec succès.", "commentaire": comment.to_dict()})


@bp.delete("/<int:comment_id>")
@login_required
def delete_comment(comment_id):
    comment = _get(comment_id)
    if not is_owner_or_admin(comment.user_id):
        raise ApiError("Vous n'êtes pas autorisé à supprimer ce commentaire.", 403)
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"message": "Commentaire supprimé avec succès."})


@bp.post("/<int:comment_id>/reponse")
@login_required
def add_reply(comment_id):
    comment = _get(comment_id)
    comment.reponse_texte = _clean_text(payload().get("texte"), "Le texte de la réponse est requis.")
    comment.reponse_par_id, comment.reponse_le = g.user.id, utcnow()
    db.session.commit()
    return jsonify({"message": "Réponse ajoutée avec succès.", "commentaire": comment.to_dict()})


def _reply_owned(comment_id) -> Commentaire:
    comment = _get(comment_id)
    if not comment.reponse_texte:
        raise ApiError("Ce commentaire n'a pas de réponse.")
    if not is_owner_or_admin(comment.reponse_par_id):
        raise ApiError("Vous n'êtes pas autorisé à modifier cette réponse.", 403)
    return comment


@bp.put("/<int:comment_id>/reponse")
@login_required
def update_reply(comment_id):
    comment = _reply_owned(comment_id)
    comment.reponse_texte = _clean_text(payload().get("texte"), "Le texte de la réponse est requis.")
    comment.reponse_le = utcnow()
    db.session.commit()
    return jsonify({"message": "Réponse mise à jour avec succès.", "commentaire": comment.to_dict()})


@bp.delete("/<int:comment_id>/reponse")
@login_required
def delete_reply(comment_id):
    comment = _reply_owned(comment_id)
    comment.reponse_texte = comment.reponse_par_id = comment.reponse_le = None
    db.session.commit()
    return jsonify({"message": "Réponse supprimée avec succès.", "commentaire": comment.to_dict()})

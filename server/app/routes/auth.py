import re

from flask import Blueprint, g, jsonify

from ..auth import generate_token, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import User
from ..utils import parse_date, payload

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _auth_response(user, status=200):
    return jsonify({"token": generate_token(user.id), "user": user.to_public()}), status


@bp.post("/register")
def register():
    data = payload()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    nom, prenom = (data.get("nom") or "").strip(), (data.get("prenom") or "").strip()

    errors = []
    if not EMAIL_RE.match(email):
        errors.append({"path": "email", "msg": "Email invalide"})
    if len(password) < 6:
        errors.append({"path": "password", "msg": "6 caractères minimum"})
    if not nom:
        errors.append({"path": "nom", "msg": "Nom requis"})
    if not prenom:
        errors.append({"path": "prenom", "msg": "Prénom requis"})
    if errors:
        raise ApiError("Données d'inscription invalides.", 400, errors=errors)

    if User.query.filter_by(email=email).first():
        raise ApiError("Cet email est déjà utilisé.")

    user = User(nom=nom, prenom=prenom, email=email, telephone=data.get("telephone") or None,
                date_naissance=parse_date(data.get("dateNaissance")))
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return _auth_response(user, 201)


@bp.post("/login")
def login():
    data = payload()
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(data.get("password") or ""):
        raise ApiError("Email ou mot de passe incorrect.", 401)
    return _auth_response(user)


@bp.get("/me")
@login_required
def me():
    return jsonify(g.user.to_dict())

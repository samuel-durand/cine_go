"""Authentification JWT et décorateurs d'accès."""
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, request

from .errors import ApiError
from .extensions import db
from .models import User


def generate_token(user_id: int) -> str:
    payload = {
        "id": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=current_app.config["JWT_EXPIRE_DAYS"]),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def _load_user():
    header = request.headers.get("Authorization", "")
    token = header.replace("Bearer ", "", 1).strip()
    if not token:
        raise ApiError("Token manquant. Accès refusé.", 401)
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
        user = db.session.get(User, int(payload["id"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise ApiError("Token invalide.", 401)
    if not user:
        raise ApiError("Utilisateur non trouvé.", 401)
    return user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user = _load_user()
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.user = _load_user()
        if g.user.role != "admin":
            raise ApiError("Accès refusé. Droits administrateur requis.", 403)
        return fn(*args, **kwargs)
    return wrapper


def is_owner_or_admin(owner_id) -> bool:
    return g.user.role == "admin" or g.user.id == owner_id

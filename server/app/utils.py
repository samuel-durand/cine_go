"""Petits utilitaires partagés par les routes."""
import os
import random
import time
from datetime import date, datetime
from pathlib import Path

from flask import current_app, request
from werkzeug.utils import secure_filename

from .errors import ApiError
from .extensions import db

ALLOWED_IMAGE_EXT = {".jpeg", ".jpg", ".png", ".gif", ".webp"}


def payload() -> dict:
    """Corps de la requête, en JSON ou en multipart/form-data."""
    if request.is_json:
        return request.get_json(silent=True) or {}
    return request.form.to_dict()


def get_or_404(model, obj_id, message: str):
    obj = db.session.get(model, obj_id)
    if obj is None:
        raise ApiError(message, 404)
    return obj


def parse_id(value, message="Identifiant invalide."):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(message, 400)


def to_bool(value) -> bool:
    return value is True or str(value).lower() in ("true", "1", "on", "yes")


def to_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_date(value):
    """Accepte 'YYYY-MM-DD' ou une date ISO complète ; renvoie un objet date."""
    if value in (None, ""):
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    text = str(value)
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        raise ApiError(f"Date invalide : {text}", 400)


def parse_list(value):
    """Liste depuis un tableau JSON ou une chaîne séparée par des virgules."""
    if value is None:
        return None
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return [v.strip() for v in str(value).split(",") if v.strip()]


def save_uploaded_image(field="image"):
    """Enregistre l'image envoyée (si présente) et renvoie son URL publique."""
    file = request.files.get(field)
    if not file or not file.filename:
        return None
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXT or not (file.mimetype or "").startswith("image/"):
        raise ApiError("Seuls les fichiers image (JPEG, PNG, GIF, WEBP) sont autorisés.", 400)
    upload_dir: Path = current_app.config["UPLOAD_DIR"]
    upload_dir.mkdir(parents=True, exist_ok=True)
    base = secure_filename(Path(file.filename).stem) or "image"
    filename = f"{base}-{int(time.time() * 1000)}-{random.randint(0, 10**9)}{ext}"
    file.save(upload_dir / filename)
    return f"/uploads/public/{filename}"


def delete_uploaded_image(url):
    """Supprime un ancien fichier uploadé localement (ignore les URL externes)."""
    if not url or not url.startswith("/uploads/public/"):
        return
    path = current_app.config["UPLOAD_DIR"] / Path(url).name
    if path.exists():
        os.remove(path)

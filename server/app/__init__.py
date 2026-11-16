"""API Ciné Go (Flask + MySQL)."""
import logging
import sys

from flask import Flask, abort, send_from_directory
from flask_cors import CORS

from .config import Config
from .errors import register_error_handlers
from .extensions import db

# La console Windows (cp1252) ne sait pas afficher les émojis des messages : on force l'UTF-8
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")


def create_app(config_object=Config, **overrides) -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_object)
    app.config.update(overrides)
    app.json.ensure_ascii = False
    app.json.sort_keys = False
    logging.basicConfig(level=logging.INFO)

    db.init_app(app)
    _setup_cors(app)
    register_error_handlers(app)
    _register_blueprints(app)
    _register_static(app)

    from .cli import register_cli
    register_cli(app)
    return app


def _setup_cors(app):
    origins = app.config["ALLOWED_ORIGINS"]
    if app.config["IS_PRODUCTION"] and not origins:
        app.logger.error("❌ FRONTEND_URL ou ALLOWED_ORIGINS doit être défini en production")
    # En développement sans configuration, toutes les origines sont autorisées
    CORS(app, resources={r"/api/*": {"origins": origins or "*"}}, supports_credentials=True)


def _register_blueprints(app):
    from .routes import (auth, cinemas, commentaires, films, genres, payments, reservations,
                         salles, seances, tickets, users, utils)

    for module in (auth, films, genres, cinemas, salles, seances, reservations, users,
                   payments, tickets, commentaires, utils):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}


def _register_static(app):
    upload_dir = app.config["UPLOAD_DIR"]

    # Images uploadées (servies aussi sous /api pour passer par le proxy Vite)
    @app.get("/uploads/public/<path:filename>")
    @app.get("/api/uploads/public/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(upload_dir, filename)

    # En production, Flask peut servir le build React (SPA)
    build_dir = app.config["CLIENT_BUILD_DIR"]
    if app.config["IS_PRODUCTION"] and build_dir.exists():
        @app.get("/", defaults={"path": ""})
        @app.get("/<path:path>")
        def spa(path):
            if path.startswith("api/"):
                abort(404)
            if path and (build_dir / path).is_file():
                return send_from_directory(build_dir, path)
            return send_from_directory(build_dir, "index.html")

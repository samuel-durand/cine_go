from flask import jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    """Erreur métier renvoyée au client sous la forme {"message": ...}."""

    def __init__(self, message: str, status: int = 400, **extra):
        super().__init__(message)
        self.message = message
        self.status = status
        self.extra = extra


def register_error_handlers(app):
    from .extensions import db

    @app.errorhandler(ApiError)
    def handle_api_error(err):
        return jsonify({"message": err.message, **err.extra}), err.status

    @app.errorhandler(IntegrityError)
    def handle_integrity(err):
        db.session.rollback()
        return jsonify({"message": "Conflit de données (doublon ou référence invalide)."}), 400

    @app.errorhandler(HTTPException)
    def handle_http(err):
        messages = {404: "Ressource non trouvée.", 405: "Méthode non autorisée.",
                    413: "Fichier trop volumineux (5 Mo max)."}
        return jsonify({"message": messages.get(err.code, err.description)}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        db.session.rollback()
        app.logger.exception(err)
        return jsonify({"message": str(err) if app.debug else "Erreur interne du serveur."}), 500

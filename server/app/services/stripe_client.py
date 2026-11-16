"""Accès centralisé au SDK Stripe."""
import stripe as stripe_sdk
from flask import current_app

from ..errors import ApiError


def is_configured() -> bool:
    return bool(current_app.config.get("STRIPE_SECRET_KEY"))


def get():
    if not is_configured():
        raise ApiError("Stripe n'est pas configuré côté serveur.", 500)
    stripe_sdk.api_key = current_app.config["STRIPE_SECRET_KEY"]
    return stripe_sdk

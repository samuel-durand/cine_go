from flask import Blueprint, current_app, g, jsonify

from ..auth import login_required
from ..errors import ApiError
from ..models import Seance, iso
from ..services import stripe_client
from ..services.seats import compute_order
from ..utils import get_or_404, parse_id, payload

bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def load_bookable_seance(seance_id) -> Seance:
    seance = get_or_404(Seance, parse_id(seance_id, "Séance requise."), "Séance introuvable.")
    if not seance.actif:
        raise ApiError("Cette séance n'est plus disponible.")
    if seance.bloque:
        raise ApiError(seance.raison_blocage or "Cette séance est bloquée et ne peut pas être réservée.")
    return seance


@bp.post("/create-payment-intent")
@login_required
def create_payment_intent():
    stripe = stripe_client.get()
    data = payload()
    seance = load_bookable_seance(data.get("seanceId"))
    seats, count, total = compute_order(seance, data.get("seats") or [], data.get("nombrePlaces"))
    if seance.places_disponibles < count:
        raise ApiError("Pas assez de places disponibles.")

    currency = current_app.config["STRIPE_CURRENCY"]
    intent = stripe.PaymentIntent.create(
        amount=round(total * 100),
        currency=currency,
        metadata={
            "userId": str(g.user.id),
            "seanceId": str(seance.id),
            "nombrePlaces": str(count),
            "seatIds": ",".join(s["seatId"] for s in seats),
        },
    )
    return jsonify({
        "clientSecret": intent.client_secret,
        "amount": total,
        "currency": currency,
        "seance": {"id": str(seance.id), "titre": seance.film.titre if seance.film else "",
                   "date": iso(seance.date), "heure": seance.heure},
    })

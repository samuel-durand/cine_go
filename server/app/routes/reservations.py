from flask import Blueprint, current_app, g, jsonify
from sqlalchemy.exc import IntegrityError

from ..auth import admin_required, is_owner_or_admin, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import PAIEMENTS, STATUTS, Reservation, ReservationSiege, Seance, SiegeReserve
from ..services import stripe_client
from ..services.email import send_reservation_confirmation_async
from ..services.seats import compute_order
from ..utils import get_or_404, payload
from .payments import load_bookable_seance

bp = Blueprint("reservations", __name__, url_prefix="/api/reservations")

LIST_VIEW = {"seance_kwargs": {"film_fields": ("titre", "image", "duree")}}
DETAIL_VIEW = {"seance_kwargs": {"film_full": True}}


@bp.get("/my-reservations")
@login_required
def my_reservations():
    reservations = (Reservation.query.filter_by(user_id=g.user.id)
                    .order_by(Reservation.date_reservation.desc()).all())
    return jsonify([r.to_dict(with_user=False, **LIST_VIEW) for r in reservations])


@bp.get("/all")
@admin_required
def all_reservations():
    reservations = Reservation.query.order_by(Reservation.date_reservation.desc()).all()
    return jsonify([r.to_dict(**LIST_VIEW) for r in reservations])


@bp.get("/<int:reservation_id>")
@login_required
def get_reservation(reservation_id):
    reservation = get_or_404(Reservation, reservation_id, "Réservation non trouvée.")
    if not is_owner_or_admin(reservation.user_id):
        raise ApiError("Accès refusé.", 403)
    return jsonify(reservation.to_dict(**DETAIL_VIEW))


def _verify_payment(intent, *, total, count, seance):
    if not intent or intent.status != "succeeded":
        raise ApiError("Paiement non confirmé.")
    if intent.amount != round(total * 100):
        raise ApiError("Montant du paiement invalide.")
    metadata = intent.metadata or {}
    if metadata.get("userId") != str(g.user.id):
        raise ApiError("Paiement non associé à cet utilisateur.")
    if metadata.get("seanceId") != str(seance.id):
        raise ApiError("Paiement non associé à cette séance.")
    if int(metadata.get("nombrePlaces") or 0) != count:
        raise ApiError("Incohérence entre paiement et sélection de sièges.")


@bp.post("")
@login_required
def create_reservation():
    data = payload()
    payment_intent_id = data.get("paymentIntentId")
    if not payment_intent_id:
        raise ApiError("Le paiement est requis pour confirmer la réservation.")
    stripe = stripe_client.get()

    # Verrou de ligne sur la séance (SELECT ... FOR UPDATE) : sérialise les
    # réservations concurrentes sur une même séance.
    seance = load_bookable_seance(data.get("seanceId"))
    db.session.refresh(seance, with_for_update=True)

    seats, count, total = compute_order(seance, data.get("seats") or [], data.get("nombrePlaces"))
    if seance.places_disponibles < count:
        raise ApiError("Pas assez de places disponibles.")

    _verify_payment(stripe.PaymentIntent.retrieve(payment_intent_id), total=total, count=count, seance=seance)
    if Reservation.query.filter_by(payment_intent_id=payment_intent_id).first():
        raise ApiError("Ce paiement a déjà été utilisé.")

    labels = [s["label"] for s in seats] or list(data.get("places") or [])
    reservation = Reservation(user_id=g.user.id, seance_id=seance.id, places=labels,
                              nombre_places=count, prix_total=total, paiement="paye",
                              statut="confirmee", payment_intent_id=payment_intent_id)
    for seat in seats:
        reservation.sieges.append(ReservationSiege(
            seat_id=seat["seatId"], label=seat["label"], row=seat["row"], number=seat["number"],
            type=seat["type"], prix=(seance.prix or 0) + seat["priceModifier"]))
    db.session.add(reservation)
    db.session.flush()
    for seat in seats:
        db.session.add(SiegeReserve(seance_id=seance.id, reservation_id=reservation.id,
                                    seat_id=seat["seatId"], label=seat["label"], row=seat["row"],
                                    number=seat["number"], type=seat["type"]))
    seance.places_disponibles = max(0, seance.places_disponibles - count)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError("Un des sièges vient d'être réservé par quelqu'un d'autre.", 409)

    send_reservation_confirmation_async(current_app._get_current_object(), reservation.id)
    return jsonify(reservation.to_dict(with_user=False, **LIST_VIEW)), 201


def release_seats(reservation: Reservation):
    """Libère les sièges et les places d'une réservation."""
    seance = db.session.get(Seance, reservation.seance_id)
    SiegeReserve.query.filter_by(reservation_id=reservation.id).delete()
    if seance:
        released = len(reservation.sieges) or reservation.nombre_places or 0
        seance.places_disponibles = min(seance.places_total, seance.places_disponibles + released)


@bp.put("/<int:reservation_id>/cancel")
@login_required
def cancel_reservation(reservation_id):
    reservation = get_or_404(Reservation, reservation_id, "Réservation non trouvée.")
    if not is_owner_or_admin(reservation.user_id):
        raise ApiError("Accès refusé.", 403)
    if reservation.statut == "annulee":
        raise ApiError("Cette réservation est déjà annulée.")

    if stripe_client.is_configured() and reservation.payment_intent_id and reservation.paiement == "paye":
        try:
            stripe_client.get().Refund.create(payment_intent=reservation.payment_intent_id)
        except Exception as exc:  # noqa: BLE001
            current_app.logger.error("Erreur de remboursement Stripe : %s", exc)
            raise ApiError("Le remboursement Stripe a échoué, la réservation n'a pas été annulée.", 500)

    reservation.statut, reservation.paiement = "annulee", "rembourse"
    release_seats(reservation)
    db.session.commit()
    return jsonify({"message": "Réservation annulée avec succès.",
                    "reservation": reservation.to_dict(**LIST_VIEW)})


@bp.put("/<int:reservation_id>/status")
@admin_required
def update_status(reservation_id):
    reservation = get_or_404(Reservation, reservation_id, "Réservation non trouvée.")
    data = payload()
    statut, paiement = data.get("statut"), data.get("paiement")
    if statut and statut not in STATUTS or paiement and paiement not in PAIEMENTS:
        raise ApiError("Statut ou paiement invalide.")
    if statut == "annulee" and reservation.statut != "annulee":
        release_seats(reservation)
    reservation.statut = statut or reservation.statut
    reservation.paiement = paiement or reservation.paiement
    db.session.commit()
    return jsonify(reservation.to_dict(**LIST_VIEW))

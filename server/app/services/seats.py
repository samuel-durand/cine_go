"""Gestion des plans de salle et validation des sièges."""
import copy
import math
import string

from ..errors import ApiError

SEAT_ERRORS = {
    "PLAN_NOT_AVAILABLE": "Cette salle ne dispose pas de plan de sièges.",
    "NO_SEATS_SELECTED": "Veuillez sélectionner au moins un siège.",
    "INVALID_SEAT": "Sélection de sièges invalide.",
}


def count_plan_seats(plan) -> int:
    return sum(len(row.get("seats") or []) for row in (plan or {}).get("rows") or [])


def create_plan(row_count, seats_per_row, *, seat_type="standard", limit=None,
                price_modifier=0, accessible_rows=()):
    """Construit un plan rectangulaire (rangées A, B, C...)."""
    rows = []
    for i in range(row_count):
        name = string.ascii_uppercase[i] if i < 26 else f"R{i + 1}"
        seats = []
        for j in range(seats_per_row):
            if limit is not None and i * seats_per_row + j >= limit:
                break
            seat_id = f"{name}{j + 1}"
            seats.append({
                "seatId": seat_id, "label": seat_id, "row": name, "number": j + 1,
                "type": seat_type, "accessible": name in accessible_rows,
                "priceModifier": price_modifier,
            })
        if seats:
            rows.append({"name": name, "seats": seats})
    return {"rows": rows}


def plan_for_salle(salle) -> dict:
    """Plan à figer dans une séance : celui de la salle, sinon un plan généré."""
    if salle.plan and salle.plan.get("rows"):
        return copy.deepcopy(dict(salle.plan))
    capacity = salle.capacite or 100
    per_row = max(4, min(20, round(math.sqrt(capacity))))
    seat_type = salle.type if salle.type in ("vip", "premium") else "standard"
    modifier = {"vip": 5, "premium": 2}.get(salle.type, 0)
    return create_plan(math.ceil(capacity / per_row), per_row, seat_type=seat_type,
                       limit=capacity, price_modifier=modifier)


def validate_seat_selection(seance, requested_seats):
    """Vérifie les sièges demandés et calcule le prix total.

    Renvoie (sièges normalisés, prix total). Lève ApiError si invalide.
    """
    rows = (seance.plan or {}).get("rows") or []
    if not rows:
        raise ApiError(SEAT_ERRORS["PLAN_NOT_AVAILABLE"])
    if not isinstance(requested_seats, list) or not requested_seats:
        raise ApiError(SEAT_ERRORS["NO_SEATS_SELECTED"])

    index = {}
    for row in rows:
        for seat in row.get("seats") or []:
            if seat.get("seatId"):
                index[seat["seatId"]] = seat
            if seat.get("label"):
                index.setdefault(seat["label"], seat)

    reserved = {s.seat_id for s in seance.sieges_reserves}
    seen = set()
    normalized = []
    for request_seat in requested_seats:
        key = (request_seat or {}).get("seatId") or (request_seat or {}).get("label")
        if not key:
            raise ApiError(SEAT_ERRORS["INVALID_SEAT"])
        seat = index.get(key)
        if seat is None:
            raise ApiError(f"Siège introuvable ({key}).")
        if seat["seatId"] in seen:
            raise ApiError(f"Le siège {seat['seatId']} a déjà été sélectionné.")
        seen.add(seat["seatId"])
        if seat["seatId"] in reserved:
            raise ApiError(f"Le siège {seat.get('label', '')} n'est plus disponible.")
        normalized.append({
            "seatId": seat["seatId"], "label": seat["label"], "row": seat["row"],
            "number": seat["number"], "type": seat.get("type", "standard"),
            "accessible": bool(seat.get("accessible")),
            "priceModifier": seat.get("priceModifier") or 0,
        })

    total = sum((seance.prix or 0) + s["priceModifier"] for s in normalized)
    return normalized, round(total, 2)


def compute_order(seance, seats, nombre_places):
    """Calcule (sièges, nombre de places, prix total) pour une commande."""
    if (seance.plan or {}).get("rows"):
        normalized, total = validate_seat_selection(seance, seats)
        return normalized, len(normalized), total
    count = int(nombre_places) if str(nombre_places or "").isdigit() else 0
    if count < 1:
        raise ApiError("Nombre de places invalide.")
    return [], count, round(seance.prix * count, 2)

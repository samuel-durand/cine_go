"""
Migration des données de l'ancienne base MongoDB vers MySQL.

Usage (depuis server/) :
    pip install pymongo
    python scripts/migrate_from_mongo.py "mongodb+srv://.../cinego"
    python scripts/migrate_from_mongo.py "<uri>" --reset   # vide d'abord les tables MySQL

Les ObjectId Mongo sont remplacés par des identifiants entiers MySQL. Les mots
de passe (bcrypt) sont repris tels quels : les utilisateurs gardent leur mot
de passe.
"""
import argparse
import sys
from datetime import date, datetime
from pathlib import Path

from pymongo import MongoClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import (Cinema, Commentaire, Film, FilmRating, Genre, Reservation,  # noqa: E402
                        ReservationSiege, Salle, Seance, SiegeReserve, User)


def as_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.today()


def clean_plan(plan):
    rows = []
    for row in (plan or {}).get("rows") or []:
        rows.append({"name": row.get("name"), "seats": [
            {k: s.get(k) for k in ("seatId", "label", "row", "number", "type", "accessible", "priceModifier")}
            for s in row.get("seats") or []
        ]})
    return {"rows": rows}


def migrate(mongo, reset: bool):
    ids = {}  # (collection, str(ObjectId)) -> id MySQL

    def new_id(col, doc, obj):
        db.session.add(obj)
        db.session.flush()
        ids[(col, str(doc["_id"]))] = obj.id
        return obj

    def ref(col, value):
        return ids.get((col, str(value))) if value else None

    if reset:
        db.drop_all()
    db.create_all()

    for d in mongo.users.find():
        new_id("users", d, User(nom=d.get("nom", ""), prenom=d.get("prenom", ""), email=d["email"],
                                password_hash=d["password"], role=d.get("role", "user"),
                                telephone=d.get("telephone"),
                                date_naissance=as_date(d["dateNaissance"]) if d.get("dateNaissance") else None,
                                created_at=d.get("createdAt") or datetime.utcnow()))
    for d in mongo.genres.find():
        new_id("genres", d, Genre(nom=d["nom"], description=d.get("description", ""), actif=d.get("actif", True)))
    for d in mongo.cinemas.find():
        new_id("cinemas", d, Cinema(nom=d["nom"], adresse=d.get("adresse", ""), ville=d.get("ville", ""),
                                    code_postal=d.get("codePostal", ""), telephone=d.get("telephone"),
                                    email=d.get("email"), description=d.get("description", ""),
                                    image=d.get("image", ""), actif=d.get("actif", True)))
    for d in mongo.films.find():
        film = new_id("films", d, Film(
            titre=d["titre"], description=d.get("description", ""), duree=d.get("duree", 120),
            genre_id=ref("genres", d.get("genre")), realisateur=d.get("realisateur", "Inconnu"),
            acteurs=d.get("acteurs", []), image=d.get("image", ""), trailer_url=d.get("trailerUrl", ""),
            date_sortie=as_date(d.get("dateSortie")), note=d.get("note", 0),
            average_rating=float(d.get("averageRating") or 0), prix=d.get("prix", 10),
            actif=d.get("actif", True)))
        for r in d.get("ratings", []):
            if ref("users", r.get("user")):
                db.session.add(FilmRating(film_id=film.id, user_id=ref("users", r["user"]), rating=r["rating"]))
    for d in mongo.salles.find():
        if not ref("cinemas", d.get("cinema")):
            print(f"  ! salle ignorée (cinéma introuvable) : {d.get('nom')}")
            continue
        new_id("salles", d, Salle(cinema_id=ref("cinemas", d["cinema"]), nom=d["nom"],
                                  type=d.get("type", "classic"), capacite=d.get("capacite", 100),
                                  description=d.get("description", ""), equipements=d.get("equipements", []),
                                  plan=clean_plan(d.get("plan")), actif=d.get("actif", True)))
    seance_seats = {}
    for d in mongo.seances.find():
        if not (ref("films", d.get("film")) and ref("salles", d.get("salle"))):
            continue
        new_id("seances", d, Seance(film_id=ref("films", d["film"]), salle_id=ref("salles", d["salle"]),
                                    date=as_date(d["date"]), heure=d["heure"], plan=clean_plan(d.get("plan")),
                                    bloque=d.get("bloque", False), raison_blocage=d.get("raisonBlocage", ""),
                                    places_total=d.get("placesTotal", 100),
                                    places_disponibles=d.get("placesDisponibles", 100),
                                    prix=d.get("prix", 10), actif=d.get("actif", True)))
        seance_seats[str(d["_id"])] = d.get("siegesReserves", [])
    for d in mongo.reservations.find():
        if not (ref("users", d.get("user")) and ref("seances", d.get("seance"))):
            continue
        res = new_id("reservations", d, Reservation(
            user_id=ref("users", d["user"]), seance_id=ref("seances", d["seance"]), places=d.get("places", []),
            nombre_places=d.get("nombrePlaces", 1), prix_total=d.get("prixTotal", 0),
            statut=d.get("statut", "en_attente"), paiement=d.get("paiement", "en_attente"),
            payment_intent_id=d.get("paymentIntentId"),
            date_reservation=d.get("dateReservation") or datetime.utcnow()))
        for s in d.get("sieges", []):
            db.session.add(ReservationSiege(reservation_id=res.id, seat_id=s["seatId"], label=s["label"],
                                            row=s["row"], number=s["number"], type=s.get("type", "standard"),
                                            prix=s.get("prix", 0)))
    for seance_oid, seats in seance_seats.items():
        for s in seats:
            res_id = ref("reservations", s.get("reservation"))
            if res_id:
                db.session.add(SiegeReserve(seance_id=ref("seances", seance_oid), reservation_id=res_id,
                                            seat_id=s["seatId"], label=s["label"], row=s["row"],
                                            number=s["number"], type=s.get("type", "standard")))
    for d in mongo.commentaires.find():
        if not (ref("films", d.get("film")) and ref("users", d.get("user"))):
            continue
        rep = d.get("reponse") or {}
        db.session.add(Commentaire(
            film_id=ref("films", d["film"]), user_id=ref("users", d["user"]), commentaire=d["commentaire"],
            rating=d.get("rating", 0), created_at=d.get("createdAt") or datetime.utcnow(),
            updated_at=d.get("updatedAt") or datetime.utcnow(), reponse_texte=rep.get("texte"),
            reponse_par_id=ref("users", rep.get("reponduPar")), reponse_le=rep.get("reponduLe")))
    db.session.commit()

    counts = {}
    for col, _ in ids:
        counts[col] = counts.get(col, 0) + 1
    print("✅ Migration terminée :", ", ".join(f"{n} {c}" for c, n in counts.items()))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mongodb_uri")
    parser.add_argument("--reset", action="store_true", help="Supprime et recrée les tables MySQL")
    args = parser.parse_args()
    mongo = MongoClient(args.mongodb_uri).get_default_database("cinego")
    with create_app().app_context():
        migrate(mongo, args.reset)


if __name__ == "__main__":
    main()

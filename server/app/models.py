"""Modèles SQLAlchemy (MySQL).

Chaque modèle expose `to_dict()` qui reproduit le format JSON de l'ancienne
API Express/MongoDB (`_id` en chaîne, relations « peuplées » imbriquées) afin
que le client React n'ait pas à changer.
"""
from datetime import date, datetime, timezone

import bcrypt
from sqlalchemy import JSON, UniqueConstraint
from sqlalchemy.ext.mutable import MutableDict, MutableList

from .extensions import db

SEAT_TYPES = ("standard", "vip", "premium", "accessible")
SALLE_TYPES = ("classic", "vip", "premium", "imax", "4dx")
STATUTS = ("en_attente", "confirmee", "annulee")
PAIEMENTS = ("en_attente", "paye", "rembourse")


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(value):
    """Sérialise une date/datetime au format ISO UTC utilisé par le front."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"
    if isinstance(value, date):
        return value.strftime("%Y-%m-%dT00:00:00.000Z")
    return value


def sid(value):
    return str(value) if value is not None else None


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)


# --------------------------------------------------------------------------- #
# Utilisateurs
# --------------------------------------------------------------------------- #
class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("user", "admin", name="user_role"), nullable=False, default="user")
    telephone = db.Column(db.String(30))
    date_naissance = db.Column(db.Date)

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(10)).decode()

    def check_password(self, password: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode(), self.password_hash.encode())
        except ValueError:
            return False

    def to_public(self):
        """Format court renvoyé à la connexion/inscription."""
        return {"id": sid(self.id), "_id": sid(self.id), "nom": self.nom, "prenom": self.prenom,
                "email": self.email, "role": self.role}

    def to_ref(self):
        """Format « peuplé » (nom prenom email)."""
        return {"_id": sid(self.id), "nom": self.nom, "prenom": self.prenom, "email": self.email}

    def to_dict(self):
        return {
            **self.to_public(),
            "telephone": self.telephone,
            "dateNaissance": iso(self.date_naissance),
            "createdAt": iso(self.created_at),
        }


# --------------------------------------------------------------------------- #
# Catalogue
# --------------------------------------------------------------------------- #
class Genre(TimestampMixin, db.Model):
    __tablename__ = "genres"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(80), nullable=False, unique=True)
    description = db.Column(db.Text, default="")
    actif = db.Column(db.Boolean, nullable=False, default=True)

    def to_ref(self, with_description=False):
        data = {"_id": sid(self.id), "nom": self.nom}
        if with_description:
            data["description"] = self.description or ""
        return data

    def to_dict(self):
        return {"_id": sid(self.id), "nom": self.nom, "description": self.description or "",
                "actif": self.actif, "createdAt": iso(self.created_at)}


class Film(TimestampMixin, db.Model):
    __tablename__ = "films"

    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    duree = db.Column(db.Integer, nullable=False)
    genre_id = db.Column(db.Integer, db.ForeignKey("genres.id"), nullable=False, index=True)
    realisateur = db.Column(db.String(255), nullable=False)
    acteurs = db.Column(MutableList.as_mutable(JSON), nullable=False, default=list)
    image = db.Column(db.String(500), default="")
    trailer_url = db.Column(db.String(500), default="")
    date_sortie = db.Column(db.Date, nullable=False)
    note = db.Column(db.Float, nullable=False, default=0)
    average_rating = db.Column(db.Float, nullable=False, default=0)
    prix = db.Column(db.Float, nullable=False)
    actif = db.Column(db.Boolean, nullable=False, default=True)
    # Informations enrichies (import Pathé) : visuel paysage, avertissement, popularité
    backdrop = db.Column(db.String(500), default="")
    backdrop_color = db.Column(db.String(9))
    avertissement = db.Column(db.Text)
    nationalite = db.Column(db.String(120))
    titre_original = db.Column(db.String(255))
    home_order = db.Column(db.Integer)          # ordre de mise en avant sur l'accueil
    attente_order = db.Column(db.Integer)       # rang « les plus attendus » (1 = le plus attendu)
    envies = db.Column(db.Integer, default=0)   # nombre de personnes qui veulent le voir
    source_ref = db.Column(db.String(120), index=True)  # identifiant de la source d'import

    genre = db.relationship("Genre", lazy="joined")
    ratings = db.relationship("FilmRating", back_populates="film", cascade="all, delete-orphan")

    def recalculate_average(self):
        values = [r.rating for r in self.ratings]
        self.average_rating = round(sum(values) / len(values), 1) if values else 0

    def to_ref(self, fields=("titre", "duree", "image"), with_genre=False):
        data = {"_id": sid(self.id)}
        mapping = {"titre": self.titre, "duree": self.duree, "image": self.image or "",
                   "prix": self.prix, "dateSortie": iso(self.date_sortie),
                   "backdrop": self.backdrop or ""}
        for f in fields:
            data[f] = mapping[f]
        if with_genre:
            data["genre"] = self.genre.to_ref() if self.genre else None
        return data

    def to_dict(self, genre_description=False):
        return {
            "_id": sid(self.id),
            "titre": self.titre,
            "description": self.description,
            "duree": self.duree,
            "genre": self.genre.to_ref(genre_description) if self.genre else None,
            "realisateur": self.realisateur,
            "acteurs": list(self.acteurs or []),
            "image": self.image or "",
            "trailerUrl": self.trailer_url or "",
            "dateSortie": iso(self.date_sortie),
            "note": self.note,
            "averageRating": self.average_rating,
            "ratings": [{"user": sid(r.user_id), "rating": r.rating} for r in self.ratings],
            "prix": self.prix,
            "actif": self.actif,
            "backdrop": self.backdrop or "",
            "backdropColor": self.backdrop_color,
            "avertissement": (self.avertissement or "").strip() or None,
            "nationalite": self.nationalite,
            "titreOriginal": self.titre_original,
            "homeOrder": self.home_order,
            "attenteOrder": self.attente_order,
            "envies": self.envies or 0,
            "createdAt": iso(self.created_at),
        }


class FilmRating(TimestampMixin, db.Model):
    __tablename__ = "film_ratings"
    __table_args__ = (UniqueConstraint("film_id", "user_id", name="uq_rating_film_user"),)

    id = db.Column(db.Integer, primary_key=True)
    film_id = db.Column(db.Integer, db.ForeignKey("films.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = db.Column(db.Float, nullable=False)

    film = db.relationship("Film", back_populates="ratings")


# --------------------------------------------------------------------------- #
# Cinémas et salles
# --------------------------------------------------------------------------- #
class Cinema(TimestampMixin, db.Model):
    __tablename__ = "cinemas"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(150), nullable=False)
    adresse = db.Column(db.String(255), nullable=False)
    ville = db.Column(db.String(120), nullable=False, index=True)
    code_postal = db.Column(db.String(10), nullable=False)
    telephone = db.Column(db.String(30))
    email = db.Column(db.String(255))
    description = db.Column(db.Text, default="")
    image = db.Column(db.String(500), default="")
    actif = db.Column(db.Boolean, nullable=False, default=True)

    salles = db.relationship("Salle", back_populates="cinema")

    def to_ref(self):
        return {"_id": sid(self.id), "nom": self.nom, "ville": self.ville, "adresse": self.adresse,
                "codePostal": self.code_postal, "telephone": self.telephone, "email": self.email}

    def to_dict(self):
        return {**self.to_ref(), "description": self.description or "", "image": self.image or "",
                "actif": self.actif, "createdAt": iso(self.created_at)}


class Salle(TimestampMixin, db.Model):
    __tablename__ = "salles"

    id = db.Column(db.Integer, primary_key=True)
    cinema_id = db.Column(db.Integer, db.ForeignKey("cinemas.id"), nullable=False, index=True)
    nom = db.Column(db.String(100), nullable=False)
    type = db.Column(db.Enum(*SALLE_TYPES, name="salle_type"), nullable=False, default="classic")
    capacite = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, default="")
    equipements = db.Column(MutableList.as_mutable(JSON), nullable=False, default=list)
    # Plan de salle : {"rows": [{"name": "A", "seats": [{seatId, label, row, number, type, accessible, priceModifier}]}]}
    plan = db.Column(MutableDict.as_mutable(JSON), nullable=False, default=lambda: {"rows": []})
    actif = db.Column(db.Boolean, nullable=False, default=True)

    cinema = db.relationship("Cinema", back_populates="salles", lazy="joined")

    def to_ref(self, with_cinema=True):
        data = {"_id": sid(self.id), "nom": self.nom, "type": self.type, "capacite": self.capacite}
        if with_cinema:
            data["cinema"] = self.cinema.to_ref() if self.cinema else None
        return data

    def to_dict(self):
        return {
            **self.to_ref(),
            "description": self.description or "",
            "equipements": list(self.equipements or []),
            "plan": self.plan or {"rows": []},
            "actif": self.actif,
            "createdAt": iso(self.created_at),
        }


# --------------------------------------------------------------------------- #
# Séances et réservations
# --------------------------------------------------------------------------- #
class Seance(TimestampMixin, db.Model):
    __tablename__ = "seances"
    __table_args__ = (db.Index("ix_seance_date_film", "date", "film_id"),)

    id = db.Column(db.Integer, primary_key=True)
    film_id = db.Column(db.Integer, db.ForeignKey("films.id", ondelete="CASCADE"), nullable=False, index=True)
    salle_id = db.Column(db.Integer, db.ForeignKey("salles.id", ondelete="CASCADE"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    heure = db.Column(db.String(5), nullable=False)
    # Copie figée du plan de la salle au moment de la création de la séance
    plan = db.Column(MutableDict.as_mutable(JSON), nullable=False, default=lambda: {"rows": []})
    bloque = db.Column(db.Boolean, nullable=False, default=False)
    raison_blocage = db.Column(db.String(255), default="")
    places_total = db.Column(db.Integer, nullable=False, default=100)
    places_disponibles = db.Column(db.Integer, nullable=False, default=100)
    prix = db.Column(db.Float, nullable=False)
    actif = db.Column(db.Boolean, nullable=False, default=True)

    film = db.relationship("Film", lazy="joined")
    salle = db.relationship("Salle", lazy="joined")
    sieges_reserves = db.relationship("SiegeReserve", back_populates="seance",
                                      cascade="all, delete-orphan")

    def to_dict(self, *, with_plan=False, film_fields=("titre", "duree", "image"),
                film_genre=True, film_full=False, salle_cinema=True):
        if film_full and self.film:
            film = self.film.to_dict()
        else:
            film = self.film.to_ref(film_fields, with_genre=film_genre) if self.film else None
        data = {
            "_id": sid(self.id),
            "film": film,
            "salle": self.salle.to_ref(with_cinema=salle_cinema) if self.salle else None,
            "date": iso(self.date),
            "heure": self.heure,
            "bloque": self.bloque,
            "raisonBlocage": self.raison_blocage or "",
            "placesTotal": self.places_total,
            "placesDisponibles": self.places_disponibles,
            "prix": self.prix,
            "actif": self.actif,
            "createdAt": iso(self.created_at),
        }
        if with_plan:
            data["plan"] = self.plan or {"rows": []}
            data["siegesReserves"] = [s.to_dict() for s in self.sieges_reserves]
        return data


class Reservation(db.Model):
    __tablename__ = "reservations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seance_id = db.Column(db.Integer, db.ForeignKey("seances.id", ondelete="CASCADE"), nullable=False, index=True)
    places = db.Column(MutableList.as_mutable(JSON), nullable=False, default=list)
    nombre_places = db.Column(db.Integer, nullable=False)
    prix_total = db.Column(db.Float, nullable=False)
    statut = db.Column(db.Enum(*STATUTS, name="reservation_statut"), nullable=False, default="en_attente")
    paiement = db.Column(db.Enum(*PAIEMENTS, name="reservation_paiement"), nullable=False, default="en_attente")
    payment_intent_id = db.Column(db.String(255), unique=True)
    date_reservation = db.Column(db.DateTime, nullable=False, default=utcnow)

    user = db.relationship("User", lazy="joined")
    seance = db.relationship("Seance", lazy="joined")
    sieges = db.relationship("ReservationSiege", back_populates="reservation",
                             cascade="all, delete-orphan", order_by="ReservationSiege.id")

    def to_dict(self, *, with_user=True, seance_kwargs=None):
        seance_kwargs = seance_kwargs or {}
        return {
            "_id": sid(self.id),
            "user": self.user.to_ref() if with_user and self.user else sid(self.user_id),
            "seance": self.seance.to_dict(**seance_kwargs) if self.seance else None,
            "places": list(self.places or []),
            "sieges": [s.to_dict() for s in self.sieges],
            "nombrePlaces": self.nombre_places,
            "prixTotal": self.prix_total,
            "statut": self.statut,
            "paiement": self.paiement,
            "paymentIntentId": self.payment_intent_id,
            "dateReservation": iso(self.date_reservation),
        }


class ReservationSiege(db.Model):
    """Sièges achetés dans une réservation (historique, conservé après annulation)."""
    __tablename__ = "reservation_sieges"

    id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey("reservations.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    seat_id = db.Column(db.String(20), nullable=False)
    label = db.Column(db.String(20), nullable=False)
    row = db.Column(db.String(10), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Enum(*SEAT_TYPES, name="siege_type"), nullable=False, default="standard")
    prix = db.Column(db.Float, nullable=False, default=0)

    reservation = db.relationship("Reservation", back_populates="sieges")

    def to_dict(self):
        return {"seatId": self.seat_id, "label": self.label, "row": self.row,
                "number": self.number, "type": self.type, "prix": self.prix}


class SiegeReserve(db.Model):
    """Occupation d'un siège pour une séance.

    La contrainte d'unicité (séance, siège) garantit au niveau de MySQL qu'un
    siège ne peut pas être vendu deux fois, même en cas de requêtes simultanées.
    """
    __tablename__ = "sieges_reserves"
    __table_args__ = (UniqueConstraint("seance_id", "seat_id", name="uq_siege_seance"),)

    id = db.Column(db.Integer, primary_key=True)
    seance_id = db.Column(db.Integer, db.ForeignKey("seances.id", ondelete="CASCADE"), nullable=False)
    reservation_id = db.Column(db.Integer, db.ForeignKey("reservations.id", ondelete="CASCADE"),
                               nullable=False, index=True)
    seat_id = db.Column(db.String(20), nullable=False)
    label = db.Column(db.String(20), nullable=False)
    row = db.Column(db.String(10), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Enum(*SEAT_TYPES, name="siege_reserve_type"), nullable=False, default="standard")

    seance = db.relationship("Seance", back_populates="sieges_reserves")

    def to_dict(self):
        return {"seatId": self.seat_id, "label": self.label, "row": self.row, "number": self.number,
                "type": self.type, "reservation": sid(self.reservation_id)}


# --------------------------------------------------------------------------- #
# Commentaires
# --------------------------------------------------------------------------- #
class Commentaire(db.Model):
    __tablename__ = "commentaires"
    __table_args__ = (UniqueConstraint("film_id", "user_id", name="uq_commentaire_film_user"),)

    id = db.Column(db.Integer, primary_key=True)
    film_id = db.Column(db.Integer, db.ForeignKey("films.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    commentaire = db.Column(db.String(1000), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    # Réponse (une seule par commentaire)
    reponse_texte = db.Column(db.String(1000))
    reponse_par_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    reponse_le = db.Column(db.DateTime)

    film = db.relationship("Film")
    user = db.relationship("User", foreign_keys=[user_id], lazy="joined")
    reponse_par = db.relationship("User", foreign_keys=[reponse_par_id], lazy="joined")

    def to_dict(self, with_film=False):
        data = {
            "_id": sid(self.id),
            "film": {"_id": sid(self.film_id), "titre": self.film.titre} if with_film and self.film
            else sid(self.film_id),
            "user": self.user.to_ref() if self.user else None,
            "commentaire": self.commentaire,
            "rating": self.rating,
            "createdAt": iso(self.created_at),
            "updatedAt": iso(self.updated_at),
        }
        if self.reponse_texte:
            data["reponse"] = {
                "texte": self.reponse_texte,
                "reponduPar": self.reponse_par.to_ref() if self.reponse_par else None,
                "reponduLe": iso(self.reponse_le),
            }
        return data

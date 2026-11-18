"""Génération réaliste des séances.

Chaque salle enchaîne les séances de l'ouverture (10h) jusqu'à la dernière séance
(22h30) : début suivant = fin du film + battement (publicités, ménage), arrondi au
quart d'heure. Les films sont répartis en tourniquet pondéré : les films les plus
mis en avant passent plus souvent, mais chaque film à l'affiche est programmé.
"""
import random
from datetime import date, timedelta

from ..extensions import db
from ..models import Film, Reservation, Salle, Seance
from .seats import count_plan_seats, plan_for_salle

OUVERTURE = 10 * 60          # 10:00
DERNIERE_SEANCE = 22 * 60 + 30  # 22:30 au plus tard
BATTEMENT = 20               # minutes entre la fin d'un film et la séance suivante
PAS = 15                     # horaires arrondis au quart d'heure


def _arrondi(minutes: int) -> int:
    return -(-minutes // PAS) * PAS


def _hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def films_a_programmer() -> list[Film]:
    """Films déjà sortis, du plus mis en avant au moins mis en avant."""
    films = Film.query.filter(Film.actif.is_(True), Film.date_sortie <= date.today()).all()
    return sorted(films, key=lambda f: (f.home_order is None, f.home_order or 0, -f.date_sortie.toordinal()))


def tourniquet(films: list[Film], seed: int) -> list[Film]:
    """Ordre de programmation d'une journée.

    D'abord chaque film une fois (mélangé) : dès qu'il y a autant de créneaux que de
    films, tous sont programmés. Puis des passages supplémentaires pour les films les
    plus mis en avant (top 10 : +5, 20 suivants : +2).
    """
    rng = random.Random(seed)
    premier_tour = list(films)
    rng.shuffle(premier_tour)
    bonus = []
    for rank, film in enumerate(films):
        bonus += [film] * (5 if rank < 10 else 2 if rank < 30 else 0)
    rng.shuffle(bonus)
    return premier_tour + bonus


def programme_jour(salles: list[Salle], films: list[Film], day: date) -> list[tuple[Salle, str, Film]]:
    """Programme d'une journée : liste de (salle, heure, film)."""
    queue = tourniquet(films, seed=day.toordinal())
    if not queue:
        return []
    position = 0
    programme = []
    for index, salle in enumerate(salles):
        debut = OUVERTURE + (index * PAS) % 60   # décalage pour étaler les horaires entre salles
        while debut <= DERNIERE_SEANCE:
            film = queue[position % len(queue)]
            position += 1
            programme.append((salle, _hhmm(debut), film))
            debut = _arrondi(debut + (film.duree or 120) + BATTEMENT)
    return programme


def generer_seances(days: int, reset: bool = False, echo=print) -> dict:
    """Génère les séances des `days` prochains jours.

    Sans `reset`, les salles ayant déjà des séances un jour donné sont laissées telles quelles.
    Avec `reset`, les séances futures sans réservation sont d'abord supprimées.
    """
    films = films_a_programmer()
    salles = Salle.query.filter_by(actif=True).order_by(Salle.cinema_id, Salle.id).all()
    if not films or not salles:
        raise ValueError("Il faut au moins un film déjà sorti et une salle active.")

    supprimees = 0
    if reset:
        reservees = {sid for (sid,) in db.session.query(Reservation.seance_id).distinct()}
        for seance in Seance.query.filter(Seance.date >= date.today()).all():
            if seance.id not in reservees:
                db.session.delete(seance)
                supprimees += 1
        db.session.commit()

    creees = 0
    for offset in range(days):
        day = date.today() + timedelta(days=offset)
        occupees = {sid for (sid,) in db.session.query(Seance.salle_id).filter(Seance.date == day).distinct()}
        for salle, heure, film in programme_jour(salles, films, day):
            if salle.id in occupees:
                continue
            plan = plan_for_salle(salle)
            total = count_plan_seats(plan) or salle.capacite
            db.session.add(Seance(film_id=film.id, salle_id=salle.id, date=day, heure=heure, plan=plan,
                                  places_total=total, places_disponibles=total, prix=film.prix))
            creees += 1
        db.session.commit()
        echo(f"✅ {day.isoformat()} : programme généré")
    return {"creees": creees, "supprimees": supprimees, "films": len(films), "salles": len(salles)}

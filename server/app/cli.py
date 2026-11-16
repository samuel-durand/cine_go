"""Commandes d'administration : `flask --app wsgi <commande>`.

  init-db                 crée les tables (idempotent)
  create-admin EMAIL PWD  crée un compte administrateur
  seed-genres             insère les genres par défaut
  seed-salles             crée un cinéma par défaut et ses salles
  seed-seances --days N   génère des séances pour les N prochains jours
"""
import random
from datetime import date, timedelta

import click

from .extensions import db
from .models import Cinema, Film, Genre, Salle, Seance, User
from .services.seats import count_plan_seats, create_plan, plan_for_salle

GENRES = {
    "action": "Films avec beaucoup d'action, de combats et de poursuites",
    "aventure": "Films d'aventure et d'exploration",
    "animation": "Films d'animation et dessins animés",
    "comedie": "Films comiques et humoristiques",
    "drame": "Films dramatiques et émotionnels",
    "fantastique": "Films fantastiques avec des éléments surnaturels",
    "horreur": "Films d'horreur et de suspense",
    "romance": "Films romantiques et d'amour",
    "science-fiction": "Films de science-fiction et futuristes",
    "thriller": "Films à suspense et thrillers",
    "documentaire": "Documentaires et films éducatifs",
    "famille": "Films pour toute la famille",
}

SALLES = [
    dict(nom="Salle 1", type="classic", capacite=150, description="Salle classique avec son stéréo",
         equipements=["Son stéréo", "Écran standard"], plan=lambda: create_plan(10, 15, limit=150)),
    dict(nom="Salle 2", type="classic", capacite=120, description="Salle classique",
         equipements=["Son stéréo", "Écran standard"], plan=lambda: create_plan(8, 15, limit=120)),
    dict(nom="Salle VIP", type="vip", capacite=50, description="Sièges inclinables et service premium",
         equipements=["Sièges inclinables", "Service premium", "Son Dolby Atmos"],
         plan=lambda: create_plan(5, 12, seat_type="vip", limit=50, price_modifier=5, accessible_rows=("A",))),
    dict(nom="Salle Premium", type="premium", capacite=80, description="Salle premium avec confort amélioré",
         equipements=["Sièges larges", "Son Dolby Atmos", "Écran 4K"],
         plan=lambda: create_plan(6, 14, seat_type="premium", limit=80, price_modifier=2)),
    dict(nom="IMAX", type="imax", capacite=200, description="Écran géant et son immersif",
         equipements=["Écran géant IMAX", "Son IMAX", "Projection 4K"],
         plan=lambda: create_plan(10, 20, seat_type="premium", limit=200, price_modifier=3)),
]

CRENEAUX = ["11:00", "14:00", "17:00", "20:00", "22:30"]


def add_missing_columns() -> list[str]:
    """Mini-migration : ajoute (nullable) les colonnes des modèles absentes de la base.

    `create_all` ne modifie pas les tables existantes ; cela permet de faire évoluer
    une base déjà en production sans outil de migration.
    """
    from sqlalchemy import inspect, text
    from sqlalchemy.schema import CreateColumn

    inspector = inspect(db.engine)
    added = []
    for table in db.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            continue
        existing = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing:
                continue
            ddl = str(CreateColumn(column).compile(dialect=db.engine.dialect)).replace(" NOT NULL", "")
            db.session.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {ddl}"))
            added.append(f"{table.name}.{column.name}")
    db.session.commit()
    return added


def register_cli(app):
    @app.cli.command("init-db")
    def init_db():
        """Crée les tables manquantes et ajoute les colonnes manquantes (idempotent)."""
        db.create_all()
        added = add_missing_columns()
        click.echo("✅ Tables créées." + (f" Colonnes ajoutées : {', '.join(added)}" if added else ""))

    @app.cli.command("import-pathe")
    @click.option("--upcoming", default=30, show_default=True, help="Nombre de films à venir les plus attendus")
    @click.option("--now", "now_limit", default=None, type=int, help="Nombre max de films au cinéma (défaut : tous)")
    def import_pathe(upcoming, now_limit):
        """Importe les films au cinéma et les plus attendus depuis pathe.fr."""
        from .services.pathe import import_from_pathe
        db.create_all()
        add_missing_columns()
        stats = import_from_pathe(upcoming_limit=upcoming, now_limit=now_limit, echo=click.echo)
        click.echo(f"✅ {stats['created']} créés, {stats['updated']} mis à jour, {stats['errors']} erreurs")

    @app.cli.command("create-admin")
    @click.argument("email", default="admin@cinego.com")
    @click.argument("password", default="admin123")
    def create_admin(email, password):
        email = email.lower()
        if User.query.filter_by(email=email).first():
            raise click.ClickException("Un utilisateur avec cet email existe déjà.")
        admin = User(nom="Admin", prenom="Administrateur", email=email, role="admin")
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        click.echo(f"✅ Administrateur créé : {email}\n⚠️  Pensez à changer le mot de passe.")

    @app.cli.command("seed-genres")
    def seed_genres():
        created = 0
        for nom, description in GENRES.items():
            if not Genre.query.filter_by(nom=nom).first():
                db.session.add(Genre(nom=nom, description=description))
                created += 1
        db.session.commit()
        click.echo(f"✅ {created} genre(s) créé(s).")

    @app.cli.command("seed-salles")
    def seed_salles():
        cinema = Cinema.query.filter_by(actif=True).first()
        if not cinema:
            cinema = Cinema(nom="Ciné Go Paris", adresse="1 Place du Cinéma", ville="Paris",
                            code_postal="75001", description="Cinéma principal créé automatiquement")
            db.session.add(cinema)
            db.session.flush()
            click.echo(f"✅ Cinéma par défaut créé : {cinema.nom}")
        created = 0
        for spec in SALLES:
            if Salle.query.filter_by(nom=spec["nom"], cinema_id=cinema.id).first():
                continue
            db.session.add(Salle(cinema_id=cinema.id, **{**spec, "plan": spec["plan"]()}))
            created += 1
        db.session.commit()
        click.echo(f"✅ {created} salle(s) créée(s) dans « {cinema.nom} ».")

    @app.cli.command("seed-seances")
    @click.option("--days", default=7, show_default=True, help="Nombre de jours à générer")
    def seed_seances(days):
        """Génère des séances (film déjà sorti aléatoire par créneau), sans doublons."""
        films = Film.query.filter(Film.actif.is_(True), Film.date_sortie <= date.today()).all()
        salles = Salle.query.filter_by(actif=True).all()
        if not films or not salles:
            raise click.ClickException("Il faut au moins un film actif et une salle active.")
        created = skipped = 0
        for offset in range(days):
            day = date.today() + timedelta(days=offset)
            for salle in salles:
                for heure in CRENEAUX:
                    if Seance.query.filter_by(salle_id=salle.id, date=day, heure=heure).first():
                        skipped += 1
                        continue
                    film = random.choice(films)
                    plan = plan_for_salle(salle)
                    total = count_plan_seats(plan) or salle.capacite
                    db.session.add(Seance(film_id=film.id, salle_id=salle.id, date=day, heure=heure,
                                          plan=plan, places_total=total, places_disponibles=total,
                                          prix=film.prix))
                    created += 1
            db.session.commit()
            click.echo(f"✅ {day.isoformat()} : séances générées")
        click.echo(f"Terminé : {created} créées, {skipped} déjà existantes.")

"""Commandes d'administration : `flask --app wsgi <commande>`.

  init-db                 crée les tables (idempotent)
  create-admin EMAIL PWD  crée un compte administrateur
  seed-genres             insère les genres par défaut
  seed-salles             crée un cinéma par défaut et ses salles
  seed-cinemas            crée le réseau de cinémas Ciné Go et leurs salles
  seed-seances --days N   programme les séances des N prochains jours (--reset pour refaire)
"""

import click

from .extensions import db
from .models import Cinema, Genre, Salle, User
from .services.seats import create_plan

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

CINEMAS = [
    dict(nom="Ciné Go Paris", adresse="1 Place du Cinéma", ville="Paris", code_postal="75001",
         description="Cinéma principal créé automatiquement"),
    dict(nom="Ciné Go Paris Bercy", adresse="2 cour Saint-Émilion", ville="Paris", code_postal="75012",
         description="Au cœur de Bercy Village, avec salle IMAX."),
    dict(nom="Ciné Go Lyon Part-Dieu", adresse="17 rue du Docteur Bouchut", ville="Lyon", code_postal="69003",
         description="À deux pas de la gare Part-Dieu."),
    dict(nom="Ciné Go Marseille Vieux-Port", adresse="36 quai du Port", ville="Marseille", code_postal="13002",
         description="Face au Vieux-Port."),
    dict(nom="Ciné Go Bordeaux", adresse="13 quai de Queyries", ville="Bordeaux", code_postal="33100",
         description="Sur la rive droite, quartier Bastide."),
    dict(nom="Ciné Go Lille", adresse="40 rue de Béthune", ville="Lille", code_postal="59000",
         description="En plein centre-ville."),
]


def _ensure_salles(cinema) -> int:
    """Crée les salles par défaut manquantes d'un cinéma ; renvoie le nombre créé."""
    created = 0
    for spec in SALLES:
        if not Salle.query.filter_by(nom=spec["nom"], cinema_id=cinema.id).first():
            db.session.add(Salle(cinema_id=cinema.id, **{**spec, "plan": spec["plan"]()}))
            created += 1
    return created


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
        """Crée un cinéma par défaut (si aucun) et ses salles."""
        cinema = Cinema.query.filter_by(actif=True).first()
        if not cinema:
            cinema = Cinema(**CINEMAS[0])
            db.session.add(cinema)
            db.session.flush()
            click.echo(f"✅ Cinéma par défaut créé : {cinema.nom}")
        created = _ensure_salles(cinema)
        db.session.commit()
        click.echo(f"✅ {created} salle(s) créée(s) dans « {cinema.nom} ».")

    @app.cli.command("seed-cinemas")
    def seed_cinemas():
        """Crée le réseau de cinémas Ciné Go (une salle de chaque type par cinéma)."""
        created = salles = 0
        for spec in CINEMAS:
            cinema = Cinema.query.filter_by(nom=spec["nom"]).first()
            if not cinema:
                cinema = Cinema(**spec)
                db.session.add(cinema)
                db.session.flush()
                created += 1
            salles += _ensure_salles(cinema)
        db.session.commit()
        click.echo(f"✅ {created} cinéma(s) et {salles} salle(s) créé(s).")

    @app.cli.command("seed-seances")
    @click.option("--days", default=7, show_default=True, help="Nombre de jours à programmer")
    @click.option("--reset", is_flag=True, help="Supprime d'abord les séances futures sans réservation")
    def seed_seances(days, reset):
        """Programme les séances de chaque salle (films à l'affiche, horaires enchaînés)."""
        from .services.programmation import generer_seances
        try:
            stats = generer_seances(days, reset=reset, echo=click.echo)
        except ValueError as exc:
            raise click.ClickException(str(exc))
        click.echo(f"Terminé : {stats['creees']} séances créées ({stats['films']} films, "
                   f"{stats['salles']} salles), {stats['supprimees']} supprimées.")

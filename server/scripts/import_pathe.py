"""
Import des films Pathé (au cinéma + les plus attendus) dans la base Ciné Go.

Équivalent de : flask --app wsgi import-pathe

Usage (depuis server/) :
    python scripts/import_pathe.py                  # tous les films au cinéma + 30 plus attendus
    python scripts/import_pathe.py --upcoming 50    # 50 films à venir
    python scripts/import_pathe.py --now 20         # limite les films au cinéma

Dépendance : pip install curl_cffi
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.services.pathe import import_from_pathe  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="Importe les films Pathé")
    parser.add_argument("--upcoming", type=int, default=30, help="Nombre de films à venir (défaut: 30)")
    parser.add_argument("--now", type=int, default=None, help="Nombre max de films au cinéma (défaut: tous)")
    args = parser.parse_args()

    with create_app().app_context():
        db.create_all()
        stats = import_from_pathe(upcoming_limit=args.upcoming, now_limit=args.now)
        print(f"\nTerminé : {stats['created']} créés, {stats['updated']} mis à jour, {stats['errors']} erreurs")


if __name__ == "__main__":
    main()

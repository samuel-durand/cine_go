"""
Import des films à l'affiche chez Pathé (pathe.fr) dans la base MongoDB Ciné Go.

Usage :
    python import_pathe.py            # importe les films à l'affiche (max 30)
    python import_pathe.py --limit 10 # limite le nombre de films
    python import_pathe.py --all      # inclut aussi les films à venir

Le script lit MONGODB_URI depuis server/.env et fait un upsert par titre
(pas de doublons si relancé).
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

# L'API Pathé bloque les clients HTTP classiques (empreinte TLS) :
# curl_cffi imite un vrai navigateur Chrome.
from curl_cffi import requests
from dotenv import dotenv_values
from pymongo import MongoClient

BASE_URL = "https://www.pathe.fr/api"
PRIX_DEFAUT = 10.0  # prix requis par le schéma Film


def get_mongodb_uri() -> str:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    uri = dotenv_values(env_path).get("MONGODB_URI")
    if not uri:
        sys.exit(f"MONGODB_URI introuvable dans {env_path}")
    return uri


def fetch_shows(include_coming_soon: bool) -> list[dict]:
    resp = requests.get(f"{BASE_URL}/shows", params={"language": "fr"}, impersonate="chrome", timeout=30)
    resp.raise_for_status()
    shows = resp.json()["shows"]
    films = [s for s in shows if s.get("isMovie")]
    if not include_coming_soon:
        # Films réellement à l'affiche : des séances dans les prochaines 24h
        films = [f for f in films if f.get("next24ShowtimesCount", 0) > 0]
    return films


def fetch_detail(slug: str) -> dict:
    resp = requests.get(f"{BASE_URL}/show/{slug}", params={"language": "fr"}, impersonate="chrome", timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_genre_id(db, nom: str):
    """Trouve ou crée le genre (le schéma Genre stocke le nom en minuscules)."""
    nom = nom.strip().lower()
    genre = db.genres.find_one({"nom": nom})
    if genre:
        return genre["_id"]
    result = db.genres.insert_one({
        "nom": nom,
        "description": "",
        "actif": True,
        "createdAt": datetime.now(timezone.utc),
    })
    return result.inserted_id


def pick_trailer(detail: dict) -> str:
    trailers = detail.get("trailers") or []
    if not trailers:
        return ""
    main = next((t for t in trailers if t.get("isMain")), trailers[0])
    return main.get("externalId") or ""


def build_film_doc(show: dict, detail: dict, genre_id) -> dict:
    release = (show.get("releaseAt") or {}).get("FR_FR")
    date_sortie = (
        datetime.fromisoformat(release).replace(tzinfo=timezone.utc)
        if release else datetime.now(timezone.utc)
    )
    poster = (show.get("posterPath") or {})
    # L'API renvoie parfois une chaîne, parfois une liste
    directors = detail.get("directors") or show.get("directors") or []
    if isinstance(directors, str):
        directors = [directors]
    acteurs = detail.get("actors") or []
    if isinstance(acteurs, str):
        acteurs = [a.strip() for a in acteurs.split(",")]
    return {
        "titre": show["title"],
        "description": detail.get("synopsis") or "Pas de description disponible.",
        "duree": show.get("duration") or detail.get("duration") or 120,
        "genre": genre_id,
        "realisateur": ", ".join(directors) or "Inconnu",
        "acteurs": acteurs,
        "image": poster.get("lg") or poster.get("md") or "",
        "trailerUrl": pick_trailer(detail),
        "dateSortie": date_sortie,
        "actif": True,
    }


def main():
    parser = argparse.ArgumentParser(description="Importe les films Pathé dans MongoDB")
    parser.add_argument("--limit", type=int, default=30, help="Nombre max de films (défaut: 30)")
    parser.add_argument("--all", action="store_true", help="Inclure aussi les films à venir")
    args = parser.parse_args()

    uri = get_mongodb_uri()
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client.get_default_database("cinego")
    client.admin.command("ping")
    print(f"Connecté à MongoDB ({db.name})")

    print("Récupération de la liste des films sur pathe.fr...")
    films = fetch_shows(include_coming_soon=args.all)[: args.limit]
    print(f"{len(films)} films à importer\n")

    created, updated, errors = 0, 0, 0
    for i, show in enumerate(films, 1):
        titre = show["title"]
        try:
            detail = fetch_detail(show["slug"])
            genres = show.get("genres") or detail.get("genres") or ["divers"]
            genre_id = get_genre_id(db, genres[0])
            doc = build_film_doc(show, detail, genre_id)

            result = db.films.update_one(
                {"titre": titre},
                {
                    "$set": doc,
                    "$setOnInsert": {
                        "prix": PRIX_DEFAUT,
                        "note": 0,
                        "ratings": [],
                        "averageRating": 0,
                        "createdAt": datetime.now(timezone.utc),
                    },
                },
                upsert=True,
            )
            if result.upserted_id:
                created += 1
                print(f"  [{i}/{len(films)}] + {titre}")
            else:
                updated += 1
                print(f"  [{i}/{len(films)}] ~ {titre} (mis à jour)")
        except Exception as e:
            errors += 1
            print(f"  [{i}/{len(films)}] ! {titre} : {e}")

    print(f"\nTerminé : {created} créés, {updated} mis à jour, {errors} erreurs")
    client.close()


if __name__ == "__main__":
    main()

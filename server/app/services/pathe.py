"""Import des films depuis l'API publique de pathe.fr.

Trois catégories sont importées :
  - les films au cinéma (au moins une séance dans les prochaines 24 h) ;
  - les plus attendus (sorties à venir, classées par `mostAwaitedOrder`) ;
  - leurs fiches détaillées (synopsis, casting, bande-annonce, visuels).

L'API Pathé bloque les clients HTTP classiques (empreinte TLS) : on utilise
curl_cffi, qui imite un vrai navigateur Chrome.
"""
import logging
from datetime import date

from ..extensions import db
from ..models import Film, Genre

log = logging.getLogger(__name__)
BASE_URL = "https://www.pathe.fr/api"
PRIX_DEFAUT = 10.0


def _get(path: str) -> dict:
    try:
        from curl_cffi import requests
    except ImportError as exc:  # pragma: no cover - dépendance optionnelle
        raise RuntimeError("Installez curl_cffi : pip install curl_cffi") from exc
    resp = requests.get(f"{BASE_URL}{path}", params={"language": "fr"}, impersonate="chrome", timeout=30)
    resp.raise_for_status()
    return resp.json()


def _as_list(value) -> list[str]:
    if not value:
        return []
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    return [str(v).strip() for v in value if str(v).strip()]


def _clean_html(text) -> str:
    """Synopsis Pathé : <br/> -> retours à la ligne, balises et entités supprimées."""
    import html
    import re
    text = re.sub(r"<br\s*/?>", "\n", text or "", flags=re.I)
    return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()


def _release(show) -> date | None:
    value = (show.get("releaseAt") or {}).get("FR_FR")
    try:
        return date.fromisoformat(value[:10]) if value else None
    except ValueError:
        return None


def _trailer(detail: dict) -> str:
    """Bande-annonce principale, en privilégiant la version française."""
    trailers = detail.get("trailers") or []
    if not trailers:
        return ""
    ranked = sorted(trailers, key=lambda t: (not t.get("isMain"), t.get("language") != "fr"))
    return ranked[0].get("externalId") or ""


def select_shows(shows: list[dict], *, upcoming_limit: int, now_limit: int | None) -> tuple[list, list]:
    """Sépare les films au cinéma et les plus attendus (à venir)."""
    today = date.today()
    movies = [s for s in shows if s.get("isMovie")]
    now = sorted((s for s in movies if s.get("next24ShowtimesCount", 0) > 0),
                 key=lambda s: (s.get("homeOrder") or 9999, s.get("genericOrder") or 9999))
    upcoming = sorted((s for s in movies if s.get("next24ShowtimesCount", 0) == 0
                       and (_release(s) or today) > today),
                      key=lambda s: s.get("mostAwaitedOrder") or 9999)
    return now[:now_limit] if now_limit else now, upcoming[:upcoming_limit]


def _genre(nom: str) -> Genre:
    nom = (nom or "divers").strip().lower()
    genre = Genre.query.filter_by(nom=nom).first()
    if not genre:
        genre = Genre(nom=nom, description="", actif=True)
        db.session.add(genre)
        db.session.flush()
    return genre


def _apply(film: Film, show: dict, detail: dict) -> None:
    poster = show.get("posterPath") or detail.get("posterPath") or {}
    background = show.get("backgroundPath") or detail.get("backgroundPath") or {}
    feelings = detail.get("feelings") or {}
    genres = show.get("genres") or detail.get("genres") or ["divers"]

    film.source_ref = f"pathe:{show['slug']}"
    film.titre = show["title"]
    film.titre_original = detail.get("originalTitle")
    film.description = _clean_html(detail.get("synopsis")) or "Pas de description disponible."
    film.duree = show.get("duration") or detail.get("duration") or 120
    film.genre_id = _genre(genres[0]).id
    film.realisateur = ", ".join(_as_list(detail.get("directors") or show.get("directors"))) or "Inconnu"
    film.acteurs = _as_list(detail.get("actors") or show.get("hubbleCasting"))
    film.image = poster.get("lg") or poster.get("md") or ""
    film.backdrop = background.get("lg") or background.get("md") or ""
    film.backdrop_color = show.get("backgroundDominantColor")
    film.trailer_url = _trailer(detail)
    film.date_sortie = _release(show) or date.today()
    film.avertissement = (show.get("warning") or detail.get("warning") or "").strip() or None
    film.nationalite = detail.get("nationality")
    film.home_order = show.get("homeOrder")
    film.attente_order = show.get("mostAwaitedOrder")
    film.envies = feelings.get("countWishList") or 0
    film.actif = True


def import_from_pathe(*, upcoming_limit: int = 30, now_limit: int | None = None, echo=print) -> dict:
    """Importe/actualise les films. Renvoie un compteur {created, updated, errors}."""
    now, upcoming = select_shows(_get("/shows")["shows"], upcoming_limit=upcoming_limit, now_limit=now_limit)
    echo(f"{len(now)} films au cinéma, {len(upcoming)} films à venir les plus attendus")

    stats = {"created": 0, "updated": 0, "errors": 0}
    shows = now + upcoming
    for i, show in enumerate(shows, 1):
        try:
            detail = _get(f"/show/{show['slug']}")
            ref = f"pathe:{show['slug']}"
            film = Film.query.filter_by(source_ref=ref).first() or Film.query.filter_by(titre=show["title"]).first()
            created = film is None
            with db.session.no_autoflush:
                if created:
                    film = Film(prix=PRIX_DEFAUT, note=0, average_rating=0)
                _apply(film, show, detail)
            db.session.add(film)
            db.session.commit()
            stats["created" if created else "updated"] += 1
            echo(f"  [{i}/{len(shows)}] {'+' if created else '~'} {film.titre}")
        except Exception as exc:  # noqa: BLE001 - on continue avec les autres films
            db.session.rollback()
            stats["errors"] += 1
            echo(f"  [{i}/{len(shows)}] ! {show.get('title')} : {exc}")
    return stats

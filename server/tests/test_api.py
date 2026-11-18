"""Tests de bout en bout de l'API (SQLite en mémoire, Stripe simulé).

Lancer depuis server/ :  python -m pytest -q
"""
from datetime import date, timedelta
from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db
from app.models import Cinema, Film, Genre, Salle, Seance, User
from app.services import stripe_client
from app.services.seats import create_plan, plan_for_salle


class FakeStripe:
    """Imite stripe.PaymentIntent / stripe.Refund."""
    intents = {}

    class PaymentIntent:
        @staticmethod
        def create(amount, currency, metadata):
            pid = f"pi_{len(FakeStripe.intents) + 1}"
            # Comme le vrai SDK : metadata est un StripeObject, pas un dict
            import stripe
            FakeStripe.intents[pid] = SimpleNamespace(
                id=pid, amount=amount, metadata=stripe.StripeObject.construct_from(metadata, "sk_test"),
                status="succeeded", client_secret=f"{pid}_secret")
            return FakeStripe.intents[pid]

        @staticmethod
        def retrieve(pid):
            return FakeStripe.intents[pid]

    class Refund:
        @staticmethod
        def create(payment_intent):
            return SimpleNamespace(id="re_1")


@pytest.fixture()
def app(monkeypatch):
    app = create_app(SQLALCHEMY_DATABASE_URI="sqlite://", SQLALCHEMY_ENGINE_OPTIONS={},
                     TESTING=True, STRIPE_SECRET_KEY="sk_test_fake",
                     JWT_SECRET="test-secret-key-long-enough-for-hs256!")
    monkeypatch.setattr(stripe_client, "get", lambda: FakeStripe)
    monkeypatch.setattr("app.routes.reservations.send_reservation_confirmation_async", lambda *a: None)
    with app.app_context():
        db.create_all()
        admin = User(nom="Admin", prenom="Ad", email="admin@test.fr", role="admin")
        admin.set_password("admin123")
        genre = Genre(nom="action")
        cinema = Cinema(nom="Ciné Go Lyon", adresse="1 rue", ville="Lyon", code_postal="69001")
        db.session.add_all([admin, genre, cinema])
        db.session.flush()
        salle = Salle(cinema_id=cinema.id, nom="Salle 1", type="classic", capacite=10,
                      plan=create_plan(2, 5, limit=10))
        film = Film(titre="Dune", description="Désert", duree=155, genre_id=genre.id,
                    realisateur="Villeneuve", acteurs=["Chalamet"], date_sortie=date.today(), prix=10)
        db.session.add_all([salle, film])
        db.session.flush()
        db.session.add(Seance(film_id=film.id, salle_id=salle.id, date=date.today() + timedelta(days=1),
                              heure="20:00", plan=plan_for_salle(salle), places_total=10,
                              places_disponibles=10, prix=10))
        db.session.commit()
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()


def auth_headers(client, email="admin@test.fr", password="admin123"):
    token = client.post("/api/auth/login", json={"email": email, "password": password}).get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_login_me(client):
    res = client.post("/api/auth/register", json={"email": "Jo@Test.fr", "password": "secret1",
                                                  "nom": "Doe", "prenom": "Jo"})
    assert res.status_code == 201
    body = res.get_json()
    assert body["user"]["email"] == "jo@test.fr" and body["user"]["role"] == "user"
    assert client.post("/api/auth/register", json={"email": "jo@test.fr", "password": "secret1",
                                                   "nom": "D", "prenom": "J"}).status_code == 400
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['token']}"}).get_json()
    assert me["prenom"] == "Jo" and me["id"] == me["_id"]
    assert client.post("/api/auth/login", json={"email": "jo@test.fr", "password": "bad"}).status_code == 401


def test_admin_routes_protected(client):
    assert client.get("/api/films/all").status_code == 401
    client.post("/api/auth/register", json={"email": "u@t.fr", "password": "secret1", "nom": "U", "prenom": "U"})
    assert client.get("/api/films/all", headers=auth_headers(client, "u@t.fr", "secret1")).status_code == 403
    assert client.get("/api/films/all", headers=auth_headers(client)).status_code == 200


def test_public_catalogue_shape(client):
    films = client.get("/api/films").get_json()
    assert films[0]["_id"] == "1" and films[0]["genre"]["nom"] == "action"
    detail = client.get("/api/films/1").get_json()
    assert detail["cinemas"][0]["nom"] == "Ciné Go Lyon" and detail["totalCommentaires"] == 0
    cinema = client.get("/api/cinemas/1").get_json()
    assert cinema["codePostal"] == "69001" and len(cinema["salles"]) == 1
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    seances = client.get(f"/api/seances?filmId=1&date={tomorrow}").get_json()
    assert len(seances) == 1
    assert seances[0]["salle"]["cinema"]["_id"] == "1"
    assert seances[0]["date"] == f"{tomorrow}T00:00:00.000Z"
    assert client.get("/api/seances?cinemaId=1").get_json()[0]["film"]["titre"] == "Dune"
    assert client.get("/api/seances/dates?filmId=1").get_json() == [tomorrow]
    assert client.get("/api/films/999").status_code == 404


def test_film_crud_multipart(client):
    headers = auth_headers(client)
    res = client.post("/api/films", headers=headers, data={
        "titre": "Alien", "description": "Espace", "duree": "117", "genre": "1",
        "realisateur": "Scott", "acteurs": "Weaver, Hurt", "dateSortie": "1979-10-31",
        "prix": "9.5", "actif": "true", "trailerUrl": ""})
    assert res.status_code == 201, res.get_json()
    film = res.get_json()
    assert film["acteurs"] == ["Weaver", "Hurt"] and film["prix"] == 9.5
    res = client.put(f"/api/films/{film['_id']}", headers=headers, data={"titre": "Alien (1979)", "actif": "false"})
    assert res.get_json()["titre"] == "Alien (1979)" and res.get_json()["actif"] is False
    assert client.delete(f"/api/films/{film['_id']}", headers=headers).status_code == 200


def test_booking_flow_and_cancel(client):
    client.post("/api/auth/register", json={"email": "c@t.fr", "password": "secret1", "nom": "C", "prenom": "C"})
    headers = auth_headers(client, "c@t.fr", "secret1")
    seats = [{"seatId": "A1"}, {"seatId": "A2"}]

    intent = client.post("/api/payments/create-payment-intent", headers=headers,
                         json={"seanceId": "1", "seats": seats}).get_json()
    assert intent["amount"] == 20
    pid = intent["clientSecret"].replace("_secret", "")

    res = client.post("/api/reservations", headers=headers,
                      json={"seanceId": "1", "seats": seats, "paymentIntentId": pid})
    assert res.status_code == 201, res.get_json()
    reservation = res.get_json()
    assert reservation["places"] == ["A1", "A2"] and reservation["statut"] == "confirmee"

    seance = client.get("/api/seances/1").get_json()
    assert seance["placesDisponibles"] == 8
    assert {s["seatId"] for s in seance["siegesReserves"]} == {"A1", "A2"}
    assert seance["film"]["description"] == "Désert"

    # Siège déjà pris / paiement réutilisé
    again = client.post("/api/payments/create-payment-intent", headers=headers,
                        json={"seanceId": "1", "seats": [{"seatId": "A1"}]})
    assert again.status_code == 400 and "plus disponible" in again.get_json()["message"]
    assert client.post("/api/reservations", headers=headers,
                       json={"seanceId": "1", "seats": [{"seatId": "B1"}], "paymentIntentId": pid}).status_code == 400

    ticket = client.get(f"/api/tickets/{reservation['_id']}", headers=headers).get_json()
    assert ticket["seance"]["salle"]["cinema"]["nom"] == "Ciné Go Lyon"
    valid = client.post("/api/tickets/validate", headers=headers,
                        json={"qrData": f'{{"reservationId": "{reservation["_id"]}"}}'}).get_json()
    assert valid["valid"] is True

    mine = client.get("/api/reservations/my-reservations", headers=headers).get_json()
    assert len(mine) == 1 and mine[0]["seance"]["film"]["titre"] == "Dune"

    assert client.put(f"/api/reservations/{reservation['_id']}/cancel", headers=headers).status_code == 200
    seance = client.get("/api/seances/1").get_json()
    assert seance["placesDisponibles"] == 10 and seance["siegesReserves"] == []


def test_comments_and_ratings(client):
    client.post("/api/auth/register", json={"email": "r@t.fr", "password": "secret1", "nom": "R", "prenom": "R"})
    user = auth_headers(client, "r@t.fr", "secret1")
    admin = auth_headers(client)

    assert client.post("/api/films/1/rating", headers=user, json={"rating": 8}).get_json()["averageRating"] == 8
    client.post("/api/films/1/rating", headers=admin, json={"rating": 5})
    assert client.get("/api/films/1/rating", headers=user).get_json() == {
        "userRating": 8, "averageRating": 6.5, "totalRatings": 2}

    res = client.post("/api/commentaires/film/1", headers=user, json={"commentaire": "Top", "rating": 9})
    assert res.status_code == 201
    cid = res.get_json()["commentaire"]["_id"]
    assert client.post("/api/commentaires/film/1", headers=user,
                       json={"commentaire": "Super", "rating": 9}).status_code == 200
    reply = client.post(f"/api/commentaires/{cid}/reponse", headers=admin, json={"texte": "Merci"}).get_json()
    assert reply["commentaire"]["reponse"]["reponduPar"]["email"] == "admin@test.fr"
    assert client.delete(f"/api/commentaires/{cid}/reponse", headers=user).status_code == 403
    comments = client.get("/api/commentaires/film/1").get_json()
    assert comments[0]["commentaire"] == "Super" and comments[0]["user"]["prenom"] == "R"
    assert client.get("/api/films/1").get_json()["totalCommentaires"] == 1


def test_admin_seance_and_planning(client):
    headers = auth_headers(client)
    day = (date.today() + timedelta(days=3)).isoformat()
    res = client.post("/api/seances", headers=headers,
                      json={"film": "1", "salle": "1", "date": day, "heure": "18:00", "prix": 12})
    assert res.status_code == 201 and res.get_json()["placesTotal"] == 10
    blocked = client.put("/api/seances/planning/1/block-date", headers=headers,
                         json={"date": day, "bloque": True, "raisonBlocage": "Maintenance"}).get_json()
    assert blocked["count"] == 1
    assert client.get(f"/api/seances?date={day}").get_json() == []
    planning = client.get(f"/api/seances/planning/1?startDate={day}&endDate={day}", headers=headers).get_json()
    assert planning[0]["bloque"] is True and planning[0]["raisonBlocage"] == "Maintenance"


def test_genre_and_cinema_rules(client):
    headers = auth_headers(client)
    assert client.post("/api/genres", headers=headers, json={"nom": "Action"}).status_code == 400
    assert client.delete("/api/genres/1", headers=headers).status_code == 400
    assert client.delete("/api/cinemas/1", headers=headers).status_code == 400
    salle = client.post("/api/salles", headers=headers,
                        json={"cinema": "1", "nom": "VIP", "type": "vip", "capacite": 20,
                              "equipements": ["Fauteuils"]}).get_json()
    assert salle["cinema"]["nom"] == "Ciné Go Lyon" and salle["equipements"] == ["Fauteuils"]


def test_pathe_selection_and_film_fields(app, client):
    """Tri au cinéma / plus attendus, sans appel réseau."""
    from app.services.pathe import _apply, select_shows

    future = (date.today() + timedelta(days=30)).isoformat()
    shows = [
        {"slug": "a", "title": "A", "isMovie": True, "next24ShowtimesCount": 5, "homeOrder": 2},
        {"slug": "b", "title": "B", "isMovie": True, "next24ShowtimesCount": 9, "homeOrder": 1},
        {"slug": "c", "title": "C", "isMovie": True, "next24ShowtimesCount": 0, "mostAwaitedOrder": 7,
         "releaseAt": {"FR_FR": future}},
        {"slug": "d", "title": "D", "isMovie": True, "next24ShowtimesCount": 0, "mostAwaitedOrder": 3,
         "releaseAt": {"FR_FR": future}},
        {"slug": "e", "title": "Concert", "isMovie": False, "next24ShowtimesCount": 3},
    ]
    now, upcoming = select_shows(shows, upcoming_limit=10, now_limit=None)
    assert [s["title"] for s in now] == ["B", "A"]
    assert [s["title"] for s in upcoming] == ["D", "C"]

    with app.app_context():
        film = Film(prix=10)
        _apply(film, {**shows[3], "duration": 120, "genres": ["Drame"], "warning": " Attention ",
                      "backgroundPath": {"lg": "https://img/bg.jpg"}, "posterPath": {"lg": "https://img/p.jpg"}},
               {"synopsis": "Ligne 1<br/>Ligne 2 &amp; fin", "directors": "X", "actors": "Y, Z",
                "feelings": {"countWishList": 1234},
                "trailers": [{"externalId": "https://v/en.mp4", "language": "en", "isMain": True},
                             {"externalId": "https://v/fr.mp4", "language": "fr", "isMain": True}]})
        db.session.add(film)
        db.session.commit()
        data = film.to_dict()
    assert data["description"] == "Ligne 1\nLigne 2 & fin"
    assert data["trailerUrl"] == "https://v/fr.mp4"
    assert data["backdrop"] == "https://img/bg.jpg" and data["envies"] == 1234
    assert data["avertissement"] == "Attention" and data["attenteOrder"] == 3
    assert data["acteurs"] == ["Y", "Z"] and data["genre"]["nom"] == "drame"


def test_add_missing_columns(app):
    """init-db ajoute les colonnes manquantes d'une base existante."""
    from sqlalchemy import inspect, text
    from app.cli import add_missing_columns

    with app.app_context():
        db.session.execute(text("ALTER TABLE films DROP COLUMN envies"))
        db.session.commit()
        assert "films.envies" in add_missing_columns()
        assert "envies" in {c["name"] for c in inspect(db.engine).get_columns("films")}
        assert add_missing_columns() == []


def test_programmation_enchaine_sans_chevauchement(app):
    from app.services.programmation import DERNIERE_SEANCE, generer_seances, programme_jour, films_a_programmer

    with app.app_context():
        genre_id = Genre.query.first().id
        for i in range(6):
            db.session.add(Film(titre=f"F{i}", description="d", duree=90 + 20 * i, genre_id=genre_id,
                                realisateur="r", acteurs=[], date_sortie=date.today(), prix=9))
        db.session.add(Film(titre="Futur", description="d", duree=100, genre_id=genre_id, realisateur="r",
                            acteurs=[], date_sortie=date.today() + timedelta(days=30), prix=9))
        db.session.commit()
        for i in range(2):
            db.session.add(Salle(cinema_id=1, nom=f"Extra {i}", type="classic", capacite=10,
                                 plan=create_plan(2, 5, limit=10)))
        db.session.commit()

        films = films_a_programmer()
        assert "Futur" not in {f.titre for f in films}
        salles = Salle.query.all()
        programme = programme_jour(salles, films, date.today())
        minutes = lambda h: int(h[:2]) * 60 + int(h[3:])
        for salle in salles:
            seances = [(minutes(h), f) for s, h, f in programme if s.id == salle.id]
            assert seances and all(t <= DERNIERE_SEANCE for t, _ in seances)
            for (t1, f1), (t2, _) in zip(seances, seances[1:]):
                assert t2 >= t1 + f1.duree, "deux séances se chevauchent dans la même salle"

        stats = generer_seances(2, reset=True, echo=lambda *_: None)
        assert stats["creees"] > 0 and stats["supprimees"] == 1   # la séance de la fixture
        programmes = {s.film.titre for s in Seance.query.all()}
        assert {f"F{i}" for i in range(6)} <= programmes and "Futur" not in programmes

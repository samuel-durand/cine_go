import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Charge server/.env en priorité, puis le .env à la racine du projet
for env_file in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
    if env_file.exists():
        load_dotenv(env_file)
        break


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        # Accepte "mysql://..." et force le driver PyMySQL
        if url.startswith("mysql://"):
            url = "mysql+pymysql://" + url[len("mysql://"):]
        return url
    user = os.getenv("MYSQL_USER", "root")
    password = os.getenv("MYSQL_PASSWORD", "")
    host = os.getenv("MYSQL_HOST", "localhost")
    port = os.getenv("MYSQL_PORT", "3306")
    name = os.getenv("MYSQL_DATABASE", "cinego")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"


class Config:
    ENV = os.getenv("FLASK_ENV", os.getenv("NODE_ENV", "development"))
    IS_PRODUCTION = ENV == "production"

    SECRET_KEY = os.getenv("JWT_SECRET", "secret")
    JWT_SECRET = os.getenv("JWT_SECRET", "secret")
    JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}

    UPLOAD_DIR = BASE_DIR / "uploads" / "public"
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 Mo

    ALLOWED_ORIGINS = [
        o.strip()
        for o in (os.getenv("ALLOWED_ORIGINS", "") + "," + os.getenv("FRONTEND_URL", "")).split(",")
        if o.strip()
    ]

    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "eur")

    CLIENT_BUILD_DIR = BASE_DIR.parent / "client" / "build"

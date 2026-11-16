"""Point d'entrée : `python wsgi.py` (dev) ou `gunicorn wsgi:app` (prod)."""
import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=not app.config["IS_PRODUCTION"])

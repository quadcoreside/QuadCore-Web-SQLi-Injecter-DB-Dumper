from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration via variables d'environnement préfixées ``QCSQLI_`` ou fichier .env."""

    model_config = SettingsConfigDict(env_prefix="QCSQLI_", env_file=".env", extra="ignore")

    # Réseau — bind localhost par défaut : pas de relais SSRF ouvert (leçon de l'audit).
    host: str = "127.0.0.1"
    port: int = 8000
    token: str | None = None

    # Moteur
    searxng_url: str = "http://searxng:8080"
    concurrency: int = 10
    per_host_delay: float = 0.0

    # Persistance
    db_path: str = "quadcore.sqlite3"


settings = Settings()

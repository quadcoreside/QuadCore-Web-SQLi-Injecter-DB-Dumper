# syntax=docker/dockerfile:1
#
# QuadCore SQLi — API image.
# Builds `api/` + `engine/` (pure async SQLi library, no web deps) and serves them
# with uvicorn. The `web/` SPA is built and served separately (see docker/web/ and
# docker-compose.yml) — it is NOT part of this image.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    QCSQLI_DB_PATH=/data/quadcore.sqlite3

WORKDIR /app

# Only what `pip install .` needs: packaging metadata + the two packages it ships
# (see [tool.setuptools.packages.find] in pyproject.toml). No tests, no legacy/, no
# dev extras -> lean runtime image.
COPY pyproject.toml ./
COPY engine ./engine
COPY api ./api

RUN pip install --no-cache-dir .

# Run as a non-root user; keep the SQLite data dir writable by it.
RUN useradd --create-home --uid 1000 quadcore \
    && mkdir -p /data \
    && chown -R quadcore:quadcore /data /app
USER quadcore

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]

from __future__ import annotations

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.target import build_raw


class ErrorDetector:
    """Détection error-based : injecte un guillemet et cherche une erreur SQL
    qui n'existait pas dans la réponse de référence."""

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        baseline = await client.get(point.target.url)
        if has_sql_error(baseline.text):
            return None  # déjà en erreur : signal non fiable
        probe = await client.get(build_raw(point, "'"))
        if has_sql_error(probe.text):
            return DetectionResult(
                technique=Technique.ERROR,
                point=point,
                confidence=0.9,
                details="Erreur SQL déclenchée par un guillemet simple",
            )
        return None

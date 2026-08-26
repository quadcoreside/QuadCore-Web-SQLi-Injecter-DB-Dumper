from __future__ import annotations

from difflib import SequenceMatcher

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.target import build_url


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


class BooleanDetector:
    """Détection boolean-blind : la condition TRUE (``AND 1=1``) ressemble à la page de
    référence, la condition FALSE (``AND 1=2``) en diffère nettement."""

    def __init__(self, threshold: float = 0.95) -> None:
        self.threshold = threshold

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        true_resp = await client.get(build_url(point, "AND 1=1"))
        false_resp = await client.get(build_url(point, "AND 1=2"))
        if has_sql_error(true_resp.text) or has_sql_error(false_resp.text):
            return None

        tf_sim = _similarity(true_resp.text, false_resp.text)
        if tf_sim >= self.threshold:
            return None  # TRUE et FALSE identiques : pas d'effet booléen

        baseline = await client.get(point.target.url)
        if _similarity(true_resp.text, baseline.text) >= self.threshold:
            return DetectionResult(
                technique=Technique.BOOLEAN,
                point=point,
                confidence=0.85,
                details=f"TRUE/FALSE divergent (similarité={tf_sim:.2f})",
            )
        return None

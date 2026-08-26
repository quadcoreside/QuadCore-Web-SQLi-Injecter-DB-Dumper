from __future__ import annotations

import statistics
import time

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.tamper.base import Tamper
from engine.target import build_url


class TimeDetector:
    """Détection time-blind par MÉDIANE d'échantillons.

    On mesure ``samples`` requêtes de référence (``SLEEP(0)``) et ``samples`` requêtes
    retardées (``SLEEP(delay)``) puis on compare les médianes. La médiane absorbe les
    pics de latence isolés (jitter réseau) qui pourraient tromper un unique échantillon.

    On ne signale que si ``median(probe) - median(base) >= max(delay*ratio, min_delta)``,
    ce qui exige un écart à la fois proportionnel au délai injecté et supérieur à une
    marge plancher (évite de signaler une cible simplement lente/instable).
    """

    def __init__(
        self,
        delay_seconds: int = 5,
        threshold_ratio: float = 0.6,
        samples: int = 3,
        min_delta: float = 0.5,
        tamper: list[Tamper] | None = None,
    ) -> None:
        self.delay_seconds = delay_seconds
        self.threshold_ratio = threshold_ratio
        self.samples = max(1, samples)
        self.min_delta = min_delta
        self.tamper = tamper

    async def _timed_get(self, client: AsyncHttpClient, url: str) -> tuple[str, float]:
        start = time.perf_counter()
        resp = await client.get(url)
        return resp.text, time.perf_counter() - start

    async def _median_elapsed(
        self, client: AsyncHttpClient, url: str
    ) -> tuple[list[str], float]:
        texts: list[str] = []
        elapsed: list[float] = []
        for _ in range(self.samples):
            text, dt = await self._timed_get(client, url)
            texts.append(text)
            elapsed.append(dt)
        return texts, statistics.median(elapsed)

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        base_url = build_url(point, "AND SLEEP(0)", self.tamper)
        base_texts, base_median = await self._median_elapsed(client, base_url)
        if any(has_sql_error(t) for t in base_texts):
            return None

        probe_url = build_url(point, f"AND SLEEP({self.delay_seconds})", self.tamper)
        _, probe_median = await self._median_elapsed(client, probe_url)

        delta = probe_median - base_median
        required = max(self.delay_seconds * self.threshold_ratio, self.min_delta)
        if delta >= required:
            return DetectionResult(
                technique=Technique.TIME,
                point=point,
                confidence=0.85,
                details=(
                    f"Délai médian {delta:.1f}s sur {self.samples} échantillons "
                    f"(seuil {required:.1f}s)"
                ),
            )
        return None

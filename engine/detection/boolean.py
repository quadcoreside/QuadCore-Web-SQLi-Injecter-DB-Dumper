from __future__ import annotations

import random
from difflib import SequenceMatcher

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.tamper.base import Tamper
from engine.target import build_url


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


class BooleanDetector:
    """Détection boolean-blind robuste aux faux positifs.

    Un point n'est signalé que si, pour CHAQUE paire TRUE/FALSE testée :
    - la page TRUE ressemble à la référence (similarité >= seuil),
    - la page FALSE en diffère nettement (similarité < seuil).

    On teste d'abord la paire classique ``1=1``/``1=2`` puis une ou plusieurs paires
    orthogonales bâties sur des entiers ALÉATOIRES (``a=a`` vs ``a=b`` avec a!=b), tirés
    à chaque exécution. Une page qui ne réagit qu'aux constantes connues (cache, WAF
    ayant « appris » 1=1/1=2) échoue sur la paire aléatoire et n'est pas signalée.
    """

    def __init__(
        self,
        threshold: float = 0.95,
        random_pairs: int = 1,
        tamper: list[Tamper] | None = None,
    ) -> None:
        self.threshold = threshold
        self.random_pairs = random_pairs
        self.tamper = tamper

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        baseline = await client.get(point.target.url)
        if has_sql_error(baseline.text):
            return None

        pairs: list[tuple[str, str]] = [("1=1", "1=2")]
        for _ in range(max(0, self.random_pairs)):
            a = random.randint(10, 99)
            b = random.randint(100, 999)  # plage disjointe => a != b garanti
            pairs.append((f"{a}={a}", f"{a}={b}"))

        for true_cond, false_cond in pairs:
            if not await self._pair_confirms(client, point, baseline.text, true_cond, false_cond):
                return None

        return DetectionResult(
            technique=Technique.BOOLEAN,
            point=point,
            confidence=0.9,
            details=f"{len(pairs)} paires TRUE/FALSE cohérentes (seuil={self.threshold:.2f})",
        )

    async def _pair_confirms(
        self,
        client: AsyncHttpClient,
        point: InjectionPoint,
        baseline_text: str,
        true_cond: str,
        false_cond: str,
    ) -> bool:
        true_resp = await client.get(build_url(point, f"AND {true_cond}", self.tamper))
        false_resp = await client.get(build_url(point, f"AND {false_cond}", self.tamper))
        if has_sql_error(true_resp.text) or has_sql_error(false_resp.text):
            return False
        true_like = _similarity(true_resp.text, baseline_text) >= self.threshold
        false_differs = _similarity(false_resp.text, baseline_text) < self.threshold
        return true_like and false_differs

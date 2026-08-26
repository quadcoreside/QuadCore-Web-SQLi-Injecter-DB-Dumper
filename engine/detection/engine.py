from __future__ import annotations

from typing import Protocol

from engine.detection.base import DetectionResult
from engine.detection.boolean import BooleanDetector
from engine.detection.error import ErrorDetector
from engine.detection.timing import TimeDetector
from engine.detection.union import UnionDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, InjectionPoint, Target
from engine.target import injection_points


class Detector(Protocol):
    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None: ...


def default_detectors() -> list[Detector]:
    return [ErrorDetector(), BooleanDetector(), TimeDetector(), UnionDetector()]


class DetectionEngine:
    """Orchestre les détecteurs sur les points d'injection d'une cible et collecte
    toutes les techniques disponibles (utile pour choisir la voie d'exploitation)."""

    def __init__(
        self,
        detectors: list[Detector] | None = None,
        contexts: list[InjectionContext] | None = None,
    ) -> None:
        self.detectors = detectors if detectors is not None else default_detectors()
        self.contexts = contexts

    async def scan_point(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> list[DetectionResult]:
        results: list[DetectionResult] = []
        for detector in self.detectors:
            result = await detector.detect(client, point)
            if result is not None:
                results.append(result)
        return results

    async def scan_target(
        self, client: AsyncHttpClient, target: Target
    ) -> list[DetectionResult]:
        results: list[DetectionResult] = []
        for point in injection_points(target, self.contexts):
            results.extend(await self.scan_point(client, point))
        return results

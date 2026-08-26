from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

from engine.detection.base import DetectionResult
from engine.detection.boolean import BooleanDetector
from engine.detection.config import DetectionConfig
from engine.detection.error import ErrorDetector
from engine.detection.timing import TimeDetector
from engine.detection.union import UnionDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, InjectionPoint, Target, Technique
from engine.tamper.base import Tamper
from engine.target import injection_points


class Detector(Protocol):
    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None: ...


def default_detectors(
    *,
    techniques: list[Technique] | None = None,
    tamper: list[Tamper] | None = None,
    config: DetectionConfig | None = None,
) -> list[Detector]:
    """Construit les détecteurs par défaut, éventuellement filtrés par technique,
    réglés par `config` et munis d'une chaîne de `tamper` appliquée aux payloads."""
    cfg = config or DetectionConfig()
    builders: dict[Technique, Callable[[], Detector]] = {
        Technique.ERROR: lambda: ErrorDetector(tamper=tamper),
        Technique.BOOLEAN: lambda: BooleanDetector(
            threshold=cfg.boolean_threshold,
            random_pairs=cfg.boolean_random_pairs,
            tamper=tamper,
        ),
        Technique.TIME: lambda: TimeDetector(
            delay_seconds=cfg.time_delay_seconds,
            threshold_ratio=cfg.time_threshold_ratio,
            samples=cfg.time_samples,
            min_delta=cfg.time_min_delta,
            tamper=tamper,
        ),
        Technique.UNION: lambda: UnionDetector(
            max_columns=cfg.union_max_columns, tamper=tamper
        ),
    }
    selected = techniques if techniques is not None else list(builders)
    return [builders[t]() for t in selected if t in builders]


class DetectionEngine:
    """Orchestre les détecteurs sur les points d'injection d'une cible et collecte
    toutes les techniques disponibles (utile pour choisir la voie d'exploitation).

    Configuration : passer directement une liste de `detectors`, ou laisser le moteur
    les construire à partir de `techniques`, `tamper` et `config` (réglage par technique).
    """

    def __init__(
        self,
        detectors: list[Detector] | None = None,
        contexts: list[InjectionContext] | None = None,
        *,
        techniques: list[Technique] | None = None,
        tamper: list[Tamper] | None = None,
        config: DetectionConfig | None = None,
    ) -> None:
        if detectors is not None:
            self.detectors = detectors
        else:
            self.detectors = default_detectors(
                techniques=techniques, tamper=tamper, config=config
            )
        self.contexts = contexts
        self.techniques = techniques
        self.tamper = tamper
        self.config = config

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

from __future__ import annotations

from dataclasses import dataclass

from engine.models import InjectionPoint, Technique


@dataclass
class DetectionResult:
    technique: Technique
    point: InjectionPoint
    confidence: float
    details: str = ""

from __future__ import annotations

import respx

from engine.detection.boolean import BooleanDetector
from engine.detection.engine import DetectionEngine
from engine.detection.error import ErrorDetector
from engine.detection.timing import TimeDetector
from engine.detection.union import UnionDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, Technique
from engine.target import parse_target
from tests.helpers.fake_app import FakeVulnerableApp, mount


@respx.mock
async def test_engine_collects_all_available_techniques():
    mount(FakeVulnerableApp())
    detectors = [
        ErrorDetector(),
        BooleanDetector(),
        TimeDetector(delay_seconds=1),
        UnionDetector(),
    ]
    engine = DetectionEngine(detectors=detectors, contexts=[InjectionContext.NUMERIC])
    target = parse_target("http://t/p?id=1")
    async with AsyncHttpClient() as c:
        results = await engine.scan_target(c, target)
    techniques = {r.technique for r in results}
    assert techniques == {
        Technique.ERROR,
        Technique.BOOLEAN,
        Technique.TIME,
        Technique.UNION,
    }


@respx.mock
async def test_engine_returns_nothing_on_non_injectable_target():
    mount(
        FakeVulnerableApp(
            error_based=False, boolean_based=False, time_based=False, union_based=False
        )
    )
    detectors = [
        ErrorDetector(),
        BooleanDetector(),
        TimeDetector(delay_seconds=1),
        UnionDetector(),
    ]
    engine = DetectionEngine(detectors=detectors, contexts=[InjectionContext.NUMERIC])
    target = parse_target("http://t/p?id=1")
    async with AsyncHttpClient() as c:
        results = await engine.scan_target(c, target)
    assert results == []

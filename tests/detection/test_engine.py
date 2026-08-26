from __future__ import annotations

import respx

from engine.detection.boolean import BooleanDetector
from engine.detection.config import DetectionConfig
from engine.detection.engine import DetectionEngine, default_detectors
from engine.detection.error import ErrorDetector
from engine.detection.timing import TimeDetector
from engine.detection.union import UnionDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, Technique
from engine.tamper.tampers import Space2Comment
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


@respx.mock
async def test_engine_builds_detectors_from_techniques_and_config():
    # Aucun détecteur passé : le moteur les construit à partir des techniques + config.
    mount(FakeVulnerableApp())
    config = DetectionConfig(time_delay_seconds=1, time_threshold_ratio=0.5, time_samples=1)
    engine = DetectionEngine(
        contexts=[InjectionContext.NUMERIC],
        techniques=[Technique.ERROR, Technique.UNION],
        config=config,
    )
    assert {type(d).__name__ for d in engine.detectors} == {"ErrorDetector", "UnionDetector"}
    target = parse_target("http://t/p?id=1")
    async with AsyncHttpClient() as c:
        results = await engine.scan_target(c, target)
    assert {r.technique for r in results} == {Technique.ERROR, Technique.UNION}


@respx.mock
async def test_engine_detects_through_tamper_chain():
    # La chaîne de tampers est appliquée aux payloads ; la détection reste effective.
    mount(FakeVulnerableApp())
    config = DetectionConfig(time_delay_seconds=1, time_threshold_ratio=0.5, time_samples=1)
    engine = DetectionEngine(
        contexts=[InjectionContext.NUMERIC],
        tamper=[Space2Comment()],
        config=config,
    )
    target = parse_target("http://t/p?id=1")
    async with AsyncHttpClient() as c:
        results = await engine.scan_target(c, target)
    assert {r.technique for r in results} == {
        Technique.ERROR,
        Technique.BOOLEAN,
        Technique.TIME,
        Technique.UNION,
    }


def test_default_detectors_no_args_yields_all_four():
    names = {type(d).__name__ for d in default_detectors()}
    assert names == {"ErrorDetector", "BooleanDetector", "TimeDetector", "UnionDetector"}

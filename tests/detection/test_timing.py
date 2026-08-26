from __future__ import annotations

import respx

from engine.detection.timing import TimeDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, Technique
from engine.target import injection_points, parse_target
from tests.helpers.fake_app import FakeVulnerableApp, mount


def _numeric_point():
    t = parse_target("http://t/p?id=1")
    return injection_points(t, [InjectionContext.NUMERIC])[0]


@respx.mock
async def test_time_detector_positive():
    mount(FakeVulnerableApp(time_scale=1.0))
    async with AsyncHttpClient() as c:
        result = await TimeDetector(delay_seconds=1).detect(c, _numeric_point())
    assert result is not None
    assert result.technique is Technique.TIME


@respx.mock
async def test_time_detector_negative_when_no_delay():
    mount(FakeVulnerableApp(time_based=False))
    async with AsyncHttpClient() as c:
        result = await TimeDetector(delay_seconds=1, samples=3).detect(c, _numeric_point())
    assert result is None


@respx.mock
async def test_time_detector_ignores_isolated_latency_spike():
    # Page NON vulnérable au temps (SLEEP ignoré) mais présentant un unique pic de latence
    # sur le 1er échantillon retardé. Ordre des requêtes : 3 base puis 3 sonde.
    # Un détecteur mono-échantillon serait trompé ; la médiane absorbe le pic.
    mount(FakeVulnerableApp(time_based=False, extra_latency_seq=[0, 0, 0, 0.7, 0, 0]))
    async with AsyncHttpClient() as c:
        result = await TimeDetector(
            delay_seconds=1, threshold_ratio=0.5, samples=3
        ).detect(c, _numeric_point())
    assert result is None

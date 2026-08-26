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
        result = await TimeDetector(delay_seconds=1).detect(c, _numeric_point())
    assert result is None

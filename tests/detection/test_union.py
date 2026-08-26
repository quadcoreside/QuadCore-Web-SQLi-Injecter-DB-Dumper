from __future__ import annotations

import respx

from engine.detection.union import UnionDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, Technique
from engine.target import injection_points, parse_target
from tests.helpers.fake_app import FakeVulnerableApp, mount


def _numeric_point():
    t = parse_target("http://t/p?id=1")
    return injection_points(t, [InjectionContext.NUMERIC])[0]


@respx.mock
async def test_union_detector_finds_columns_and_visible_column():
    mount(FakeVulnerableApp(visible_columns=3, visible_index=2))
    async with AsyncHttpClient() as c:
        result = await UnionDetector().detect(c, _numeric_point())
    assert result is not None
    assert result.technique is Technique.UNION
    assert "colonnes=3" in result.details
    assert "colonne_visible=2" in result.details


@respx.mock
async def test_union_detector_negative_when_union_blocked():
    mount(FakeVulnerableApp(union_based=False))
    async with AsyncHttpClient() as c:
        result = await UnionDetector().detect(c, _numeric_point())
    assert result is None

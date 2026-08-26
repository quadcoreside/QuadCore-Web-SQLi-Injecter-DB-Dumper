from __future__ import annotations

import respx

from engine.detection.boolean import BooleanDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, Technique
from engine.target import injection_points, parse_target
from tests.helpers.fake_app import FakeVulnerableApp, mount


def _numeric_point():
    t = parse_target("http://t/p?id=1")
    return injection_points(t, [InjectionContext.NUMERIC])[0]


@respx.mock
async def test_boolean_detector_positive():
    mount(FakeVulnerableApp(error_based=False))  # forcer la voie blind
    async with AsyncHttpClient() as c:
        result = await BooleanDetector().detect(c, _numeric_point())
    assert result is not None
    assert result.technique is Technique.BOOLEAN


@respx.mock
async def test_boolean_detector_negative_when_no_boolean_effect():
    mount(FakeVulnerableApp(error_based=False, boolean_based=False))
    async with AsyncHttpClient() as c:
        result = await BooleanDetector().detect(c, _numeric_point())
    assert result is None


@respx.mock
async def test_boolean_detector_rejects_page_reacting_only_to_classic_payloads():
    # La page ne « diffère » que sur la constante FALSE 1=2 (cache/WAF ayant appris les
    # payloads connus). La paire aléatoire a=a / a=b ne produit aucun effet booléen :
    # le second contrôle orthogonal élimine ce faux positif.
    mount(FakeVulnerableApp(error_based=False, boolean_only_classic=True))
    async with AsyncHttpClient() as c:
        result = await BooleanDetector().detect(c, _numeric_point())
    assert result is None

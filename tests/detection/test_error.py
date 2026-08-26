from __future__ import annotations

import respx

from engine.detection.error import ErrorDetector
from engine.http.client import AsyncHttpClient
from engine.models import InjectionContext, Technique
from engine.target import injection_points, parse_target
from tests.helpers.fake_app import FakeVulnerableApp, mount


def _numeric_point():
    t = parse_target("http://t/p?id=1")
    return injection_points(t, [InjectionContext.NUMERIC])[0]


@respx.mock
async def test_error_detector_flags_vulnerable_target():
    mount(FakeVulnerableApp())
    async with AsyncHttpClient() as c:
        result = await ErrorDetector().detect(c, _numeric_point())
    assert result is not None
    assert result.technique is Technique.ERROR


@respx.mock
async def test_error_detector_negative_when_errors_suppressed():
    mount(FakeVulnerableApp(error_based=False))
    async with AsyncHttpClient() as c:
        result = await ErrorDetector().detect(c, _numeric_point())
    assert result is None


@respx.mock
async def test_error_detector_rejects_page_that_always_errors_on_quote():
    # Gabarit d'erreur générique : toute présence d'un guillemet renvoie l'« erreur »,
    # même équilibré. Le différentiel (guillemet doublé) ne se répare pas -> pas de flag.
    mount(FakeVulnerableApp(error_on_any_quote=True))
    async with AsyncHttpClient() as c:
        result = await ErrorDetector().detect(c, _numeric_point())
    assert result is None

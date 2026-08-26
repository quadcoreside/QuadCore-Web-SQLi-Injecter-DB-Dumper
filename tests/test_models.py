from __future__ import annotations

from engine.models import (
    Finding,
    HttpResponse,
    InjectionContext,
    InjectionPoint,
    Param,
    Target,
    Technique,
)


def test_enums_have_expected_values():
    assert InjectionContext.SINGLE_QUOTE.value == "single_quote"
    assert Technique.UNION.value == "union"


def test_finding_defaults():
    f = Finding(url="u", param="id", context=InjectionContext.NUMERIC, technique=Technique.ERROR)
    assert f.confidence == 1.0
    assert f.dbms is None


def test_target_and_point_compose():
    t = Target(url="http://x/p?id=1", base="http://x/p", params=[Param("id", "1")])
    pt = InjectionPoint(target=t, param=t.params[0], context=InjectionContext.NUMERIC)
    assert pt.param.name == "id"
    r = HttpResponse(status=200, text="ok", elapsed=0.1, length=2, url="http://x/p")
    assert r.length == 2

from __future__ import annotations

from urllib.parse import parse_qs, urlsplit

from engine.models import InjectionContext
from engine.target import build_raw, build_url, injection_points, parse_target


def test_parse_target_extracts_params():
    t = parse_target("http://x/page.php?id=1&cat=news")
    assert t.base == "http://x/page.php"
    assert [(p.name, p.value) for p in t.params] == [("id", "1"), ("cat", "news")]


def test_injection_points_cover_params_and_contexts():
    t = parse_target("http://x/p?id=1&cat=2")
    pts = injection_points(t, contexts=[InjectionContext.NUMERIC, InjectionContext.SINGLE_QUOTE])
    assert len(pts) == 4  # 2 params x 2 contextes


def test_build_url_preserves_other_params():
    t = parse_target("http://x/p?id=1&cat=news")
    pt = injection_points(t, contexts=[InjectionContext.NUMERIC])[0]  # cible id
    url = build_url(pt, "UNION SELECT 1")
    q = parse_qs(urlsplit(url).query)
    assert q["cat"] == ["news"]  # autre param intact
    assert "UNION SELECT 1" in q["id"][0]  # payload injecté sur id
    assert q["id"][0].startswith("1")  # valeur d'origine conservée


def test_build_url_single_quote_context_wraps_and_comments():
    t = parse_target("http://x/p?id=1")
    pt = injection_points(t, contexts=[InjectionContext.SINGLE_QUOTE])[0]
    url = build_url(pt, "AND 1=1")
    dec = parse_qs(urlsplit(url).query)["id"][0]
    assert dec == "1' AND 1=1-- -"


def test_build_raw_appends_suffix_and_preserves_others():
    t = parse_target("http://x/p?id=1&cat=news")
    pt = injection_points(t, contexts=[InjectionContext.NUMERIC])[0]  # cible id
    url = build_raw(pt, "'")
    q = parse_qs(urlsplit(url).query)
    assert q["id"] == ["1'"]
    assert q["cat"] == ["news"]

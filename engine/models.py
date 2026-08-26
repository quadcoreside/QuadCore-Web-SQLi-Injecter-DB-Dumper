from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class InjectionContext(StrEnum):
    NUMERIC = "numeric"
    SINGLE_QUOTE = "single_quote"
    DOUBLE_QUOTE = "double_quote"
    PAREN_SINGLE = "paren_single"
    PAREN_NUMERIC = "paren_numeric"


class Technique(StrEnum):
    ERROR = "error"
    BOOLEAN = "boolean"
    TIME = "time"
    UNION = "union"


@dataclass(frozen=True)
class HttpResponse:
    status: int
    text: str
    elapsed: float
    length: int
    url: str


@dataclass(frozen=True)
class Param:
    name: str
    value: str


@dataclass
class Target:
    url: str
    base: str
    params: list[Param]


@dataclass
class InjectionPoint:
    target: Target
    param: Param
    context: InjectionContext


@dataclass
class Finding:
    url: str
    param: str
    context: InjectionContext
    technique: Technique
    confidence: float = 1.0
    dbms: str | None = None

from __future__ import annotations

from engine.tamper.base import apply_chain
from engine.tamper.tampers import (
    HexLiterals,
    RandomCase,
    Space2Comment,
    UrlEncode,
    hexify,
    unhex_hex_cast,
)


def test_hexify():
    assert hexify("A") == "0x41"
    assert hexify("AB") == "0x4142"


def test_unhex_hex_cast_wraps_expr():
    assert unhex_hex_cast("x") == "unhex(hex(cast(x as char)))"


def test_space2comment():
    assert Space2Comment().apply("SELECT 1 FROM t") == "SELECT/**/1/**/FROM/**/t"


def test_randomcase_preserves_letters_case_insensitively():
    out = RandomCase().apply("select")
    assert out.lower() == "select"
    assert len(out) == len("select")


def test_hexliterals_converts_single_quoted_strings():
    # remplace 'abc' par sa forme hex 0x616263
    assert HexLiterals().apply("name='abc'") == "name=0x616263"


def test_urlencode_encodes_spaces_and_symbols():
    assert UrlEncode().apply("a b") == "a%20b"


def test_apply_chain_runs_in_order():
    chain = [Space2Comment(), UrlEncode()]
    assert apply_chain("a b", chain) == "a%2F%2A%2A%2Fb"  # ' ' -> /**/ -> urlencodé

from __future__ import annotations

import random
import re
from urllib.parse import quote


def hexify(s: str) -> str:
    return "0x" + s.encode().hex()


def unhex_hex_cast(expr: str) -> str:
    return f"unhex(hex(cast({expr} as char)))"


class RandomCase:
    def apply(self, payload: str) -> str:
        out = []
        for c in payload:
            if not c.isalpha():
                out.append(c)
            elif random.random() < 0.5:
                out.append(c.upper())
            else:
                out.append(c.lower())
        return "".join(out)


class Space2Comment:
    def apply(self, payload: str) -> str:
        return payload.replace(" ", "/**/")


class HexLiterals:
    _STRING = re.compile(r"'([^']*)'")

    def apply(self, payload: str) -> str:
        return self._STRING.sub(lambda m: hexify(m.group(1)), payload)


class UrlEncode:
    def apply(self, payload: str) -> str:
        return quote(payload, safe="")

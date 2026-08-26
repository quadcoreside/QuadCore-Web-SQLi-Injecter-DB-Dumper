"""Fausse application PHP+MySQL injectable, pour tests déterministes sans réseau réel.

Simule une page ``SELECT id,name,price FROM products WHERE id=<RAW>`` où ``<RAW>`` est
la valeur (URL-décodée) injectée sur le paramètre cible (contexte NUMÉRIQUE), avec un
mini-évaluateur SQL suffisant pour exercer détecteurs et extracteurs :

- **error-based** : un nombre impair de guillemets (hors commentaire) déclenche une erreur.
- **boolean-blind** : la clause ``AND <condition>`` est évaluée (``1=1``, ``1=2``,
  ``length((version()))>5``, ``ascii(substring((version()),1,1))>52``…) et change la page.
- **time-blind** : ``SLEEP(n)`` retarde la réponse (mis à l'échelle par ``time_scale``).
- **union-based** : ``UNION SELECT ...`` réfléchit la colonne visible en *évaluant* son
  expression (``concat``/``concat_ws``/``0x..``/``'str'``/``version()``/``database()``…).

Limitation connue (suffisante pour les tests) : évaluateur SQL volontairement partiel,
contexte numérique uniquement, injectable sur un seul paramètre.
"""

from __future__ import annotations

import asyncio
import re
from urllib.parse import parse_qs, urlsplit

import httpx

MYSQL_ERROR = (
    "You have an error in your SQL syntax; check the manual that corresponds to your "
    "MySQL server version for the right syntax to use near '' at line 1"
)
NORMAL = "Product found: Widget Pro, price 19.99 EUR, in stock, ref ABC123"
NO_RESULTS = "No results."

_SLEEP = re.compile(r"sleep\(\s*(\d+)", re.IGNORECASE)
_UNION_SELECT = re.compile(r"union\s+(?:all\s+)?select\s+", re.IGNORECASE)
_ORDER_BY = re.compile(r"order\s+by\s+(\d+)", re.IGNORECASE)
_CLAUSE = re.compile(r"\b(?:and|or)\b(.+)$", re.IGNORECASE)
_COMPARE = re.compile(r"(.+?)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)$")


def _page(content: str) -> httpx.Response:
    return httpx.Response(
        200, text=f"<html><body><div id='content'>{content}</div></body></html>"
    )


def _split_top_level(s: str, sep: str = ",") -> list[str]:
    parts: list[str] = []
    depth = 0
    cur = ""
    for ch in s:
        if ch == "(":
            depth += 1
            cur += ch
        elif ch == ")":
            depth -= 1
            cur += ch
        elif ch == sep and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    parts.append(cur)
    return parts


def _strip_outer_parens(s: str) -> str:
    s = s.strip()
    while s.startswith("(") and s.endswith(")"):
        depth = 0
        wraps = True
        for i, ch in enumerate(s):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0 and i != len(s) - 1:
                    wraps = False
                    break
        if wraps:
            s = s[1:-1].strip()
        else:
            break
    return s


class FakeVulnerableApp:
    def __init__(
        self,
        injectable_param: str = "id",
        visible_columns: int = 3,
        visible_index: int = 2,
        *,
        error_based: bool = True,
        boolean_based: bool = True,
        time_based: bool = True,
        union_based: bool = True,
        time_scale: float = 1.0,
        version: str = "5.7.40-log",
        user: str = "app@localhost",
        database: str = "shopdb",
        error_on_any_quote: bool = False,
        boolean_only_classic: bool = False,
        reflect_static: str | None = None,
        extra_latency_seq: list[float] | None = None,
    ) -> None:
        self.injectable_param = injectable_param
        self.visible_columns = visible_columns
        self.visible_index = visible_index
        self.error_based = error_based
        self.boolean_based = boolean_based
        self.time_based = time_based
        self.union_based = union_based
        self.time_scale = time_scale
        self.version = version
        self.user = user
        self.database = database
        # --- pièges pour éprouver la précision des détecteurs ---
        # error_on_any_quote : la page « erreur » apparaît dès qu'un guillemet est présent,
        #   quelle que soit la parité (gabarit d'erreur générique) -> tue l'error-based naïf.
        self.error_on_any_quote = error_on_any_quote
        # boolean_only_classic : seul le FALSE littéral « 1=2 » diffère, toute autre
        #   condition est vraie (special-casing des payloads connus) -> tue le boolean naïf.
        self.boolean_only_classic = boolean_only_classic
        # reflect_static : la colonne visible renvoie toujours cette bannière fixe au lieu
        #   d'évaluer l'expression injectée -> tue l'union à marqueur constant.
        self.reflect_static = reflect_static
        # extra_latency_seq : latence additionnelle (secondes) consommée requête par
        #   requête, indépendante de SLEEP() -> simule un pic de latence isolé (jitter).
        self.extra_latency_seq = extra_latency_seq

    # ---- HTTP ----
    def _broken(self) -> httpx.Response:
        return _page(MYSQL_ERROR) if self.error_based else _page(NO_RESULTS)

    async def handler(self, request: httpx.Request) -> httpx.Response:
        if self.extra_latency_seq:
            extra = self.extra_latency_seq.pop(0)
            if extra:
                await asyncio.sleep(extra * self.time_scale)
        q = parse_qs(urlsplit(str(request.url)).query, keep_blank_values=True)
        values = q.get(self.injectable_param)
        if not values:
            return _page(NORMAL)
        return await self._render(values[0])

    async def _render(self, value: str) -> httpx.Response:
        active = re.split(r"#|--\s", value, maxsplit=1)[0].replace("/**/", " ")

        if self.error_on_any_quote and "'" in active:
            return self._broken()
        if active.count("'") % 2 == 1:
            return self._broken()

        order = _ORDER_BY.search(active)
        if order:
            n = int(order.group(1))
            return self._broken() if n > self.visible_columns else _page(NORMAL)

        truth = self._boolean_truth(active) if self.boolean_based else True

        sleep_match = _SLEEP.search(active)
        if self.time_based and sleep_match and truth:
            await asyncio.sleep(min(int(sleep_match.group(1)), 5) * self.time_scale)

        union = _UNION_SELECT.search(active)
        if union:
            if not self.union_based:
                return self._broken()
            cols = _split_top_level(active[union.end():])
            if len(cols) != self.visible_columns:
                return self._broken()
            if self.reflect_static is not None:
                return _page(f"reflected:{self.reflect_static}")
            return _page(f"reflected:{self._eval_expr(cols[self.visible_index - 1])}")

        if not truth:
            return _page(NO_RESULTS)
        return _page(NORMAL)

    # ---- mini SQL ----
    def _boolean_truth(self, active: str) -> bool:
        m = _CLAUSE.search(active)
        if not m:
            return True
        cond = m.group(1).strip()
        if self.boolean_only_classic:
            # N'accorde d'effet booléen qu'à la constante FALSE bien connue.
            return cond != "1=2"
        return self._eval_condition(cond)

    def _eval_condition(self, cond: str) -> bool:
        cond = _strip_outer_parens(cond)
        m = _COMPARE.match(cond)
        if not m:
            return True
        lhs, op, rhs = self._eval_num(m.group(1)), m.group(2), self._eval_num(m.group(3))
        if lhs is None or rhs is None:
            return True
        return {
            "=": lhs == rhs,
            "!=": lhs != rhs,
            "<>": lhs != rhs,
            ">": lhs > rhs,
            "<": lhs < rhs,
            ">=": lhs >= rhs,
            "<=": lhs <= rhs,
        }[op]

    def _eval_num(self, term: str) -> int | None:
        term = term.strip()
        if re.fullmatch(r"\d+", term):
            return int(term)
        m = re.match(r"length\((.+)\)$", term, re.IGNORECASE)
        if m:
            return len(self._eval_expr(m.group(1)))
        m = re.match(r"ascii\(substring\((.+),(\d+),1\)\)$", term, re.IGNORECASE)
        if m:
            val = self._eval_expr(m.group(1))
            pos = int(m.group(2))
            return ord(val[pos - 1]) if 0 < pos <= len(val) else 0
        m = re.match(r"ascii\((.+)\)$", term, re.IGNORECASE)
        if m:
            val = self._eval_expr(m.group(1))
            return ord(val[0]) if val else 0
        return None

    def _eval_expr(self, expr: str) -> str:
        expr = _strip_outer_parens(expr.strip())
        low = expr.lower()
        if low in ("version()", "@@version"):
            return self.version
        if low in ("database()", "schema()"):
            return self.database
        if low in ("user()", "current_user()", "current_user", "system_user()"):
            return self.user
        if low == "null":
            return ""
        if expr.startswith("0x"):
            try:
                return bytes.fromhex(expr[2:]).decode(errors="ignore")
            except ValueError:
                return ""
        if len(expr) >= 2 and expr[0] == "'" and expr[-1] == "'":
            return expr[1:-1]
        m = re.match(r"concat_ws\((.+)\)$", expr, re.IGNORECASE)
        if m:
            args = _split_top_level(m.group(1))
            sep = self._eval_expr(args[0])
            return sep.join(self._eval_expr(a) for a in args[1:])
        m = re.match(r"concat\((.+)\)$", expr, re.IGNORECASE)
        if m:
            return "".join(self._eval_expr(a) for a in _split_top_level(m.group(1)))
        return expr


def mount(app: FakeVulnerableApp, host: str = "t"):
    """Enregistre la fausse app sur respx (à appeler dans un contexte ``@respx.mock``)."""
    import respx

    return respx.route(host=host).mock(side_effect=app.handler)

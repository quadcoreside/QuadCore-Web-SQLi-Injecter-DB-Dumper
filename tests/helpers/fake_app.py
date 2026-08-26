"""Fausse application PHP+MySQL injectable, pour tests déterministes sans réseau réel.

Simule une page ``SELECT id,name,price FROM products WHERE id=<RAW>`` où ``<RAW>`` est
la valeur (URL-décodée) injectée sur le paramètre cible (contexte NUMÉRIQUE). Elle
reproduit les comportements observables exploités par les détecteurs :

- **error-based** : un nombre impair de guillemets (hors commentaire) déclenche une
  erreur de syntaxe MySQL visible.
- **boolean-blind** : les clauses ``AND a=b`` / ``OR a=b`` changent la page (résultat vs
  « aucun résultat »).
- **time-blind** : ``SLEEP(n)`` retarde la réponse (mis à l'échelle par ``time_scale``).
- **union-based** : ``UNION SELECT ...`` avec le bon nombre de colonnes réfléchit la
  colonne visible ; un mauvais nombre de colonnes provoque une erreur.

Limitation connue (suffisante pour les tests) : le parsing SQL est volontairement naïf
(pas de virgules imbriquées dans la liste UNION, contexte numérique uniquement).
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

_AND_OR = re.compile(r"\b(and|or)\s+(\d+)\s*=\s*(\d+)")
_SLEEP = re.compile(r"sleep\(\s*(\d+)", re.IGNORECASE)
_UNION_SELECT = re.compile(r"union\s+(?:all\s+)?select\s+", re.IGNORECASE)


def _page(content: str) -> httpx.Response:
    return httpx.Response(
        200, text=f"<html><body><div id='content'>{content}</div></body></html>"
    )


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
    ) -> None:
        self.injectable_param = injectable_param
        self.visible_columns = visible_columns
        self.visible_index = visible_index
        self.error_based = error_based
        self.boolean_based = boolean_based
        self.time_based = time_based
        self.union_based = union_based
        self.time_scale = time_scale

    def _broken(self) -> httpx.Response:
        return _page(MYSQL_ERROR) if self.error_based else _page(NO_RESULTS)

    async def handler(self, request: httpx.Request) -> httpx.Response:
        q = parse_qs(urlsplit(str(request.url)).query, keep_blank_values=True)
        values = q.get(self.injectable_param)
        if not values:
            return _page(NORMAL)
        return await self._render(values[0])

    async def _render(self, value: str) -> httpx.Response:
        active = re.split(r"#|--\s", value, maxsplit=1)[0].replace("/**/", " ")
        low = active.lower()

        if active.count("'") % 2 == 1:
            return self._broken()

        truth = self._boolean_truth(low) if self.boolean_based else True

        sleep_match = _SLEEP.search(low)
        if self.time_based and sleep_match and truth:
            seconds = min(int(sleep_match.group(1)), 5)
            await asyncio.sleep(seconds * self.time_scale)

        union = _UNION_SELECT.search(active)
        if union and "union" in low and "select" in low:
            if not self.union_based:
                return self._broken()
            cols = [c.strip() for c in active[union.end():].split(",")]
            if len(cols) != self.visible_columns:
                return self._broken()
            visible = cols[self.visible_index - 1].strip("'\"")
            return _page(f"reflected:{visible}")

        if not truth:
            return _page(NO_RESULTS)
        return _page(NORMAL)

    @staticmethod
    def _boolean_truth(low: str) -> bool:
        truth = True
        for op, a, b in _AND_OR.findall(low):
            cond = int(a) == int(b)
            truth = (truth and cond) if op == "and" else (truth or cond)
        return truth


def mount(app: FakeVulnerableApp, host: str = "t"):
    """Enregistre la fausse app sur respx (à appeler dans un contexte ``@respx.mock``)."""
    import respx

    return respx.route(host=host).mock(side_effect=app.handler)

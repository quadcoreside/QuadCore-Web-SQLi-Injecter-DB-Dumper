from __future__ import annotations

import random
import string

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.tamper.base import Tamper
from engine.target import build_url

# Conservé pour compatibilité ; la détection utilise désormais des marqueurs aléatoires.
UNION_MARKER = "qCuNiOnMk"


def _random_marker() -> str:
    body = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"qm{body}qm"


class UnionDetector:
    """Détection UNION-based confirmée par marqueur aléatoire.

    Étapes :
    1. compter les colonnes (``UNION SELECT NULL,…`` jusqu'à disparition de l'erreur) ;
    2. optionnellement recouper ce nombre par ``ORDER BY`` (n valide, n+1 en erreur) ;
    3. trouver la colonne réfléchie avec un marqueur ALÉATOIRE ;
    4. CONFIRMER en réfléchissant un SECOND marqueur aléatoire, distinct, sur la même
       colonne. Une page qui affiche une bannière fixe (marqueur constant présent dans le
       gabarit) ne réfléchit pas ces valeurs fraîches et n'est pas signalée.
    """

    def __init__(self, max_columns: int = 20, tamper: list[Tamper] | None = None) -> None:
        self.max_columns = max_columns
        self.tamper = tamper

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        columns = await self._count_columns(client, point)
        if columns is None:
            return None

        order_ok = await self._order_by_confirms(client, point, columns)

        visible = await self._find_visible_column(client, point, columns)
        if visible is None:
            return None

        # Confirmation : un marqueur aléatoire tout neuf doit lui aussi apparaître.
        if not await self._reflects(client, point, columns, visible - 1, _random_marker()):
            return None

        crosscheck = ", ORDER BY confirmé" if order_ok else ""
        return DetectionResult(
            technique=Technique.UNION,
            point=point,
            confidence=0.97 if order_ok else 0.95,
            details=f"colonnes={columns}, colonne_visible={visible}{crosscheck}",
        )

    async def _count_columns(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> int | None:
        for n in range(1, self.max_columns + 1):
            payload = "UNION SELECT " + ",".join(["NULL"] * n)
            resp = await client.get(build_url(point, payload, self.tamper))
            if not has_sql_error(resp.text):
                return n
        return None

    async def _order_by_confirms(
        self, client: AsyncHttpClient, point: InjectionPoint, columns: int
    ) -> bool:
        ok = await client.get(build_url(point, f"ORDER BY {columns}", self.tamper))
        over = await client.get(build_url(point, f"ORDER BY {columns + 1}", self.tamper))
        return not has_sql_error(ok.text) and has_sql_error(over.text)

    async def _find_visible_column(
        self, client: AsyncHttpClient, point: InjectionPoint, columns: int
    ) -> int | None:
        for i in range(columns):
            if await self._reflects(client, point, columns, i, _random_marker()):
                return i + 1
        return None

    async def _reflects(
        self,
        client: AsyncHttpClient,
        point: InjectionPoint,
        columns: int,
        index: int,
        marker: str,
    ) -> bool:
        select_list = ["NULL"] * columns
        select_list[index] = f"'{marker}'"
        payload = "UNION SELECT " + ",".join(select_list)
        resp = await client.get(build_url(point, payload, self.tamper))
        return marker in resp.text

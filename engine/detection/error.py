from __future__ import annotations

from engine.detection.base import DetectionResult
from engine.detection.signatures import has_sql_error
from engine.http.client import AsyncHttpClient
from engine.models import InjectionPoint, Technique
from engine.tamper.base import Tamper
from engine.target import build_raw


class ErrorDetector:
    """Détection error-based par différentiel de guillemet.

    Ne signale que si le triplet est cohérent :
    - la référence ne contient PAS d'erreur SQL,
    - un guillemet simple (déséquilibré) FAIT apparaître l'erreur,
    - un guillemet doublé (rééquilibré) la FAIT disparaître.

    Cette troisième vérification élimine les pages qui contiennent toujours un
    « error » (WAF, gabarit d'erreur générique) et qui donneraient un faux positif
    sur le seul test du guillemet simple.
    """

    def __init__(self, tamper: list[Tamper] | None = None) -> None:
        self.tamper = tamper

    async def detect(
        self, client: AsyncHttpClient, point: InjectionPoint
    ) -> DetectionResult | None:
        baseline = await client.get(point.target.url)
        if has_sql_error(baseline.text):
            return None  # déjà en erreur : signal non fiable

        broken = await client.get(build_raw(point, "'", self.tamper))
        if not has_sql_error(broken.text):
            return None

        # Rééquilibrage : un guillemet doublé rétablit une syntaxe valide. Si l'erreur
        # persiste malgré tout, la page « erreur » n'est pas liée à notre injection.
        balanced = await client.get(build_raw(point, "''", self.tamper))
        if has_sql_error(balanced.text):
            return None

        return DetectionResult(
            technique=Technique.ERROR,
            point=point,
            confidence=0.95,
            details="Erreur SQL différentielle : guillemet simple déclenche, doublé réparé",
        )

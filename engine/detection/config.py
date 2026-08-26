from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DetectionConfig:
    """Réglage fin, par technique, des détecteurs construits par ``default_detectors``.

    Chaque champ a un défaut raisonnable pour un usage réel ; les tests peuvent en
    réduire l'ampleur (délai court, moins d'échantillons) via une instance dédiée.
    """

    # boolean-blind
    boolean_threshold: float = 0.95
    boolean_random_pairs: int = 1  # paires TRUE/FALSE aléatoires en plus de 1=1/1=2

    # time-blind
    time_delay_seconds: int = 5
    time_threshold_ratio: float = 0.6
    time_samples: int = 3
    time_min_delta: float = 0.5

    # union-based
    union_max_columns: int = 20

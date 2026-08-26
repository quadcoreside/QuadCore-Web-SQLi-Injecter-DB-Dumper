from __future__ import annotations

import re

# Signatures d'erreur SQL courantes (MySQL/MariaDB en priorité, plus quelques génériques).
MYSQL_ERROR_SIGNATURES: list[str] = [
    r"You have an error in your SQL syntax",
    r"check the manual that corresponds to your MySQL server version",
    r"MySQL server version for the right syntax",
    r"supplied argument is not a valid MySQL",
    r"valid MySQL result",
    r"mysqli?_fetch",
    r"mysqli?_query",
    r"mysqli?_num_rows",
    r"Warning.*\bmysqli?\b",
    r"MySqlException",
    r"com\.mysql\.jdbc",
    r"SQLSTATE\[",
    r"Unknown column '[^']+' in 'field list'",
    r"The used SELECT statements have a different number of columns",
]

_COMPILED = re.compile("|".join(MYSQL_ERROR_SIGNATURES), re.IGNORECASE)


def has_sql_error(text: str) -> bool:
    return bool(_COMPILED.search(text))

from __future__ import annotations

from engine.detection.signatures import has_sql_error


def test_detects_mysql_syntax_error():
    assert has_sql_error("You have an error in your SQL syntax; check the manual")


def test_detects_column_count_error():
    assert has_sql_error("The used SELECT statements have a different number of columns")


def test_no_false_positive_on_normal_page():
    assert not has_sql_error("<html><body>Welcome to the shop</body></html>")

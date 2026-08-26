from __future__ import annotations

from engine.dorks.library import DorkLibrary


def test_categories_and_all():
    lib = DorkLibrary()
    assert "generic" in lib.categories()
    assert lib.all()  # non vide
    assert len(lib.all()) == sum(len(lib.category(c)) for c in lib.categories())


def test_build_with_and_without_site():
    assert DorkLibrary.build("inurl:page.php?id=") == "inurl:page.php?id="
    assert (
        DorkLibrary.build("inurl:page.php?id=", site="example.com")
        == "inurl:page.php?id= site:example.com"
    )


def test_custom_dorks():
    lib = DorkLibrary({"x": ["a", "b"]})
    assert lib.categories() == ["x"]
    assert lib.all() == ["a", "b"]

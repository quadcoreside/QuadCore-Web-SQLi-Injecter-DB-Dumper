from __future__ import annotations

from engine.dorks.pipeline import filter_candidates, has_params, is_blocked


def test_is_blocked():
    assert is_blocked("https://www.google.com/search?q=x")
    assert is_blocked("https://github.com/user/repo")
    assert not is_blocked("https://shop.example.com/item.php?id=3")


def test_has_params():
    assert has_params("http://a/p.php?id=1")
    assert not has_params("http://a/p.php")


def test_filter_removes_blocked_and_paramless_and_dedupes():
    urls = [
        "http://shop.tld/item.php?id=1",
        "http://shop.tld/item.php?id=1",  # doublon
        "http://news.tld/a.php",  # sans param
        "https://www.google.com/x?id=1",  # blocklist
        "http://blog.tld/post.php?id=9",
    ]
    result = filter_candidates(urls)
    assert result == ["http://shop.tld/item.php?id=1", "http://blog.tld/post.php?id=9"]


def test_filter_dedupe_host():
    urls = [
        "http://shop.tld/item.php?id=1",
        "http://shop.tld/item.php?id=2",  # même host
        "http://blog.tld/post.php?id=9",
    ]
    result = filter_candidates(urls, dedupe_host=True)
    assert result == ["http://shop.tld/item.php?id=1", "http://blog.tld/post.php?id=9"]

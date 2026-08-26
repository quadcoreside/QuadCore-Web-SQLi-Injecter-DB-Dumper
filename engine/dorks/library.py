from __future__ import annotations

# Bibliothèque de dorks curée, par catégorie. Ciblent des URLs à paramètre susceptibles
# d'être injectables. Étendable via le constructeur de DorkLibrary.
DEFAULT_DORKS: dict[str, list[str]] = {
    "generic": [
        "inurl:index.php?id=",
        "inurl:page.php?id=",
        "inurl:view.php?id=",
        "inurl:show.php?id=",
        "inurl:read.php?id=",
    ],
    "ecommerce": [
        "inurl:product.php?id=",
        "inurl:item.php?id=",
        "inurl:category.php?id=",
        "inurl:cart.php?id=",
        "inurl:shop.php?id=",
    ],
    "news": [
        "inurl:news.php?id=",
        "inurl:article.php?id=",
        "inurl:story.php?id=",
        "inurl:press.php?id=",
    ],
    "cms": [
        "inurl:gallery.php?id=",
        "inurl:event.php?id=",
        "inurl:profile.php?id=",
        "inurl:content.php?id=",
    ],
}


class DorkLibrary:
    def __init__(self, dorks: dict[str, list[str]] | None = None) -> None:
        self.dorks = dorks if dorks is not None else DEFAULT_DORKS

    def categories(self) -> list[str]:
        return list(self.dorks)

    def category(self, name: str) -> list[str]:
        return list(self.dorks.get(name, []))

    def all(self) -> list[str]:
        return [dork for dorks in self.dorks.values() for dork in dorks]

    @staticmethod
    def build(template: str, site: str | None = None) -> str:
        """Compose une requête de dork, restreinte à un domaine si `site` est fourni."""
        return f"{template} site:{site}" if site else template

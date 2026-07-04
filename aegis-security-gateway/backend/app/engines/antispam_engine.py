from __future__ import annotations

import re
import unicodedata


BLACKLISTED_WORDS: list[str] = [
    "compra ahora",
    "oferta increible",
    "gana dinero",
    "trabaja desde casa",
    "haz clic aqui",
    "gratis",
    "bitcoin gratis",
    "criptomonedas facil",
    "prestamo rapido",
    "inversion garantizada",
    "viagra",
    "casino online",
    "apuestas deportivas",
    "contenido adulto",
    "verifica tu cuenta",
    "actualiza tus datos",
    "cuenta suspendida",
    "ganaste un premio",
]

MAX_ALLOWED_URLS = 2

_URL_PATTERN = re.compile(
    r"\b(?:https?|ftp)://[^\s<>\"{}|\\^`\[\]]+"
    r"|www\.[a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)


def _normalize(text: str) -> str:
    lowered = text.lower()
    nfkd = unicodedata.normalize("NFKD", lowered)
    ascii_text = nfkd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text).strip()


def analyze(content: str, author: str = "anonymous") -> dict:
    normalized = _normalize(content)

    for word in BLACKLISTED_WORDS:
        if _normalize(word) in normalized:
            return {
                "is_spam": True,
                "reason": "blacklisted_word",
                "score": 100,
                "detail": f"Palabra prohibida encontrada: '{word}'",
            }

    url_count = len(_URL_PATTERN.findall(content))
    if url_count > MAX_ALLOWED_URLS:
        return {
            "is_spam": True,
            "reason": "too_many_urls",
            "score": 80,
            "detail": f"Se encontraron {url_count} URLs (maximo permitido: {MAX_ALLOWED_URLS})",
        }

    return {
        "is_spam": False,
        "reason": None,
        "score": 0,
        "detail": "Mensaje aprobado por el filtro antispam",
    }

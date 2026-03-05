"""Shared image detection and conversion utilities (DRY)."""
import base64
from typing import Optional


def get_mimetype_from_bytes(data: bytes) -> Optional[str]:
    """Detect image mimetype from magic bytes. Returns None if not a known image type."""
    if not data or len(data) < 4:
        return None
    if data[:4] == b"\x89PNG":
        return "image/png"
    if data[:2] == b"\xff\xd8":
        return "image/jpeg"
    if data[:4] == b"GIF8":
        return "image/gif"
    if data[:4] == b"RIFF" and len(data) >= 12 and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def bytes_to_data_url(data: bytes, mimetype: str) -> str:
    """Convert image bytes to data URL for vision APIs."""
    b64 = base64.b64encode(data).decode("utf-8")
    return f"data:{mimetype};base64,{b64}"

"""Build user messages for LLM agents (text and vision)."""
import base64
from typing import Any, Dict, Optional

from .image_utils import bytes_to_data_url, get_mimetype_from_bytes
from .logger import get_logger

logger = get_logger(__name__)


def build_user_message(
    inputs: Dict[str, Any],
    system_prompt: Optional[str] = None,
) -> Any:
    """Build user message from inputs - returns string or list for vision models."""
    has_images = False
    image_content = []
    text_parts = []
    seen_images = set()

    if system_prompt:
        text_parts.append(system_prompt)

    for key, value in inputs.items():
        is_image, image_data = _detect_image(value, key)
        if is_image and image_data and image_data not in seen_images:
            has_images = True
            seen_images.add(image_data)
            image_content.append({
                "type": "image_url",
                "image_url": {"url": image_data},
            })
            if key not in ("data", "output", "image", "image_data"):
                text_parts.append(f"{key}:")
        elif not (has_images and key == "source"):
            if not is_image:
                text_parts.append(f"{key}: {value}")

    if has_images:
        content = []
        if text_parts:
            content.append({"type": "text", "text": "\n\n".join(text_parts)})
        elif system_prompt:
            content.append({"type": "text", "text": system_prompt})
        else:
            content.append({"type": "text", "text": "Process this image"})
        content.extend(image_content)
        return content

    if len(inputs) == 1:
        input_value = str(list(inputs.values())[0])
        return "\n\n".join(text_parts) if text_parts else input_value

    if text_parts:
        return "\n\n".join(text_parts)
    parts = [f"{k}: {v}" for k, v in inputs.items()]
    return "\n".join(parts)


def _detect_image(value: Any, _key: str) -> tuple[bool, Optional[str]]:
    """Detect if value is image data. Returns (is_image, image_data_or_none). Uses image_utils (DRY)."""
    if isinstance(value, str):
        if value.startswith("data:image/"):
            return True, value
        if value.startswith(("http://", "https://")) and any(
            ext in value.lower() for ext in [".png", ".jpg", ".jpeg", ".gif", ".webp"]
        ):
            return True, value
    elif isinstance(value, bytes):
        mimetype = get_mimetype_from_bytes(value)
        if mimetype:
            try:
                return True, bytes_to_data_url(value, mimetype)
            except Exception:
                pass
    elif isinstance(value, dict):
        if "image" in value:
            img = value["image"]
            if isinstance(img, str) and img.startswith("data:image/"):
                return True, img
            if isinstance(img, bytes):
                mimetype = get_mimetype_from_bytes(img)
                if mimetype:
                    try:
                        return True, bytes_to_data_url(img, mimetype)
                    except Exception:
                        pass
        if "image_data" in value:
            img = value["image_data"]
            if isinstance(img, str):
                try:
                    decoded = base64.b64decode(img)
                    mimetype = get_mimetype_from_bytes(decoded)
                    if mimetype:
                        return True, f"data:{mimetype};base64,{img}"
                except Exception:
                    pass
    return False, None

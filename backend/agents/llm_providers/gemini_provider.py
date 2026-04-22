"""Gemini provider strategy - supports text and vision models with image resizing."""
import asyncio
import base64
import io
from typing import Any, Dict

import httpx

try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

from .base import ILLMProviderStrategy
from ...utils.logger import get_logger

logger = get_logger(__name__)


class GeminiProviderStrategy(ILLMProviderStrategy):
    """Execute using Google Gemini API - supports text and vision models."""

    @property
    def provider_type(self) -> str:
        return "gemini"

    @staticmethod
    def _gemini_model_requires_generate_content_api(model: str) -> bool:
        """
        Use Vertex :generateContent / AI Studio REST instead of the OpenAI-compat chat API.

        Includes image-output models and **flash-lite** lines: the Vertex chat/completions
        endpoint has been observed to stall indefinitely for ``*-flash-lite*`` while
        ``:generateContent`` completes reliably for the same payload.
        """
        m = (model or "").lower()
        if "flash-lite" in m:
            return True
        return any(
            sub in m
            for sub in ("flash-image", "pro-image", "nano-banana", "banana")
        )

    @staticmethod
    def _user_message_ok_for_vertex_openai_chat(user_message: Any) -> bool:
        """
        Vertex OpenAI chat path matches workflow chat; vision with inline images still uses
        :generateContent so we keep image resize / native Gemini multimodal behavior.
        """
        if not isinstance(user_message, list):
            return True
        for item in user_message:
            if isinstance(item, dict) and item.get("type") == "image_url":
                return False
        return True

    async def _execute_vertex_openai_chat(
        self,
        user_message: Any,
        model: str,
        agent_config: Any,
    ) -> str:
        """Vertex + ADC: same endpoint as workflow chat (OpenAI-compatible chat/completions)."""
        from ...utils import vertex_gemini as _vertex

        project_id, location = _vertex.resolve_project_and_location(model)
        logger.info(
            "Gemini: Vertex OpenAI-compatible chat.completions (workflow-chat parity), "
            "project=%s location=%s model=%s",
            project_id,
            location,
            model,
        )
        client = _vertex.create_vertex_async_openai_client(project_id, location)
        try:
            messages = []
            if getattr(agent_config, "system_prompt", None):
                messages.append(
                    {"role": "system", "content": agent_config.system_prompt}
                )
            if isinstance(user_message, list):
                messages.append({"role": "user", "content": user_message})
            else:
                messages.append({"role": "user", "content": user_message})
            kwargs: Dict[str, Any] = {
                "model": _vertex.vertex_openai_model_id(model),
                "messages": messages,
            }
            if getattr(agent_config, "temperature", None) is not None:
                kwargs["temperature"] = agent_config.temperature
            if getattr(agent_config, "max_tokens", None) is not None:
                kwargs["max_tokens"] = agent_config.max_tokens
            response = await client.chat.completions.create(**kwargs)
            if not response.choices:
                return ""
            msg = response.choices[0].message
            if not msg:
                return ""
            content = msg.content
            if content is None:
                return ""
            if isinstance(content, list):
                # Multimodal assistant message; agent nodes expect string or image URL dict
                parts_out = []
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        parts_out.append(block.get("text", ""))
                    else:
                        parts_out.append(str(block))
                return "\n".join(parts_out)
            return content
        except Exception as e:
            status = getattr(e, "status_code", None)
            hint = ""
            if status == 403:
                hint = _vertex.build_vertex_http_403_remediation_hint()
            raise RuntimeError(
                f"Gemini (Vertex chat) request failed: {e}{hint}"
            ) from e
        finally:
            try:
                await client.close()
            except Exception:
                logger.debug(
                    "Vertex OpenAI client close failed (non-fatal)",
                    exc_info=True,
                )

    async def execute(
        self,
        user_message: Any,
        model: str,
        config: Dict[str, Any],
        agent_config: Any,
    ) -> Any:
        """Execute Gemini API request with text/vision support and image resizing."""
        if not PIL_AVAILABLE:
            logger.warning(
                "PIL/Pillow is NOT available for image resizing. Install with: pip install Pillow"
            )
        else:
            logger.debug("PIL/Pillow is available for image resizing")

        base_url = config.get(
            "base_url", "https://generativelanguage.googleapis.com/v1beta"
        )
        from ...utils import vertex_gemini as _vertex

        studio_key = (config.get("api_key") or config.get("apiKey") or "").strip()
        use_studio = bool(studio_key)
        if not use_studio and not _vertex.vertex_ai_configured():
            raise RuntimeError(
                "Gemini api_key is missing and Vertex AI is not configured "
                "(set GOOGLE_CLOUD_PROJECT or GCP_PROJECT and "
                "gcloud auth application-default login)."
            )

        if not use_studio:
            if not self._gemini_model_requires_generate_content_api(model):
                if self._user_message_ok_for_vertex_openai_chat(user_message):
                    return await self._execute_vertex_openai_chat(
                        user_message, model, agent_config
                    )

        parts = []
        total_image_tokens = 0
        total_text_tokens = 0

        logger.info(
            f"Building Gemini request: user_message type={type(user_message)}, "
            f"is_list={isinstance(user_message, list)}"
        )

        if isinstance(user_message, list):
            for i, item in enumerate(user_message):
                logger.debug(
                    f"   Item {i}: type={item.get('type')}, keys={list(item.keys())}"
                )
                if item.get("type") == "text":
                    text_content = item.get("text", "")
                    parts.append({"text": text_content})
                    logger.debug(f"   Added text part: {len(text_content)} chars")
                elif item.get("type") == "image_url":
                    image_url = item.get("image_url", {}).get("url", "")
                    logger.debug(f"   Processing image_url: {image_url[:50]}...")
                    if image_url.startswith("data:image/"):
                        try:
                            header, base64_data = image_url.split(",", 1)
                            mimetype = header.split(";")[0].split(":")[1]

                            base64_size = len(base64_data)
                            original_base64_size = base64_size

                            width = None
                            height = None
                            decoded = None
                            try:
                                decoded = base64.b64decode(base64_data)

                                if mimetype == "image/png" and decoded[:8] == b"\x89PNG\r\n\x1a\n":
                                    if len(decoded) >= 24:
                                        width = int.from_bytes(
                                            decoded[16:20], "big"
                                        )
                                        height = int.from_bytes(
                                            decoded[20:24], "big"
                                        )

                                elif mimetype in [
                                    "image/jpeg",
                                    "image/jpg",
                                ] and decoded[:2] == b"\xff\xd8":
                                    pos = 2
                                    while pos < len(decoded) - 8:
                                        if (
                                            decoded[pos] == 0xFF
                                            and decoded[pos + 1] >= 0xC0
                                            and decoded[pos + 1] <= 0xCF
                                        ):
                                            height = int.from_bytes(
                                                decoded[pos + 5 : pos + 7],
                                                "big",
                                            )
                                            width = int.from_bytes(
                                                decoded[pos + 7 : pos + 9],
                                                "big",
                                            )
                                            break
                                        pos += 1
                            except Exception as e:
                                logger.debug(
                                    f"   Could not parse image dimensions: {e}"
                                )

                            needs_resize = False
                            estimated_tokens = None
                            total_estimated_tokens = None

                            current_text_tokens = 0
                            system_prompt_len = (
                                len(agent_config.system_prompt)
                                if agent_config.system_prompt
                                else 0
                            )
                            if agent_config.system_prompt:
                                current_text_tokens += system_prompt_len // 4
                            text_parts_len = 0
                            for part in parts:
                                if "text" in part:
                                    part_len = len(part["text"])
                                    text_parts_len += part_len
                                    current_text_tokens += part_len // 4

                            logger.warning(
                                f"   ===== TEXT TOKEN CALCULATION ===== "
                                f"system_prompt={system_prompt_len:,} chars, "
                                f"text_parts={text_parts_len:,} chars, "
                                f"total_text_tokens={current_text_tokens:,}"
                            )

                            total_text_tokens = current_text_tokens
                            text_tokens = current_text_tokens

                            if width and height:
                                if width <= 384 and height <= 384:
                                    estimated_tokens = 258
                                else:
                                    tiles_per_width = (width + 767) // 768
                                    tiles_per_height = (height + 767) // 768
                                    total_tiles = (
                                        tiles_per_width * tiles_per_height
                                    )
                                    estimated_tokens = total_tiles * 258

                                total_with_this_image = (
                                    total_image_tokens
                                    + estimated_tokens
                                    + total_text_tokens
                                )

                                logger.info(
                                    f"   Image dimensions: {width}x{height} pixels, "
                                    f"{total_tiles} tiles, ~{estimated_tokens:,} tokens"
                                )
                                logger.info(
                                    f"   Estimated tokens: image={estimated_tokens:,}, "
                                    f"text={total_text_tokens:,}, "
                                    f"total_with_this_image={total_with_this_image:,}, "
                                    f"total_image_tokens_so_far={total_image_tokens:,}"
                                )

                                if (
                                    estimated_tokens > 50_000
                                    or total_with_this_image > 100_000
                                    or base64_size > 1_000_000
                                ):
                                    needs_resize = True
                                    logger.warning(
                                        f"   Image exceeds token limits "
                                        f"(image={estimated_tokens:,}, "
                                        f"total_with_this_image={total_with_this_image:,}, "
                                        f"base64={base64_size:,}) - resize needed!"
                                    )
                            else:
                                logger.warning(
                                    f"   Could not parse image dimensions "
                                    f"(width={width}, height={height})"
                                )
                                if base64_size > 300_000:
                                    logger.warning(
                                        f"   Base64 size ({base64_size:,} chars) "
                                        f"suggests large image. Attempting resize..."
                                    )
                                    needs_resize = True
                                    estimated_original_size = int(
                                        base64_size * 0.75
                                    )
                                    if mimetype == "image/jpeg":
                                        estimated_pixels = (
                                            estimated_original_size * 2
                                        )
                                    else:
                                        estimated_pixels = estimated_original_size
                                    estimated_dimension = int(
                                        (estimated_pixels) ** 0.5
                                    )
                                    width = estimated_dimension
                                    height = estimated_dimension
                                    if estimated_dimension <= 384:
                                        estimated_tokens = 258
                                    else:
                                        tiles_per_side = (
                                            estimated_dimension + 767
                                        ) // 768
                                        estimated_tiles = (
                                            tiles_per_side * tiles_per_side
                                        )
                                        estimated_tokens = (
                                            estimated_tiles * 258
                                        )
                                    total_estimated_tokens = (
                                        estimated_tokens + text_tokens
                                    )
                                    logger.info(
                                        f"   Estimated dimensions: ~{width}x{height} "
                                        f"pixels, ~{estimated_tokens:,} tokens"
                                    )

                            if needs_resize:
                                max_dimension = 800

                                logger.warning(
                                    f"   ===== RESIZE NEEDED! ===== PIL_AVAILABLE: "
                                    f"{PIL_AVAILABLE}, original_base64_size: "
                                    f"{original_base64_size:,} chars"
                                )
                                logger.warning(
                                    f"   ===== RESIZE TRIGGERED ===== estimated_tokens: "
                                    f"{estimated_tokens}, total_estimated_tokens: "
                                    f"{total_estimated_tokens if total_estimated_tokens is not None else 'None'}, "
                                    f"base64_size: {base64_size:,}"
                                )
                                logger.warning(
                                    f"   ===== RESIZE CONFIG ===== max_dimension: 800px, "
                                    f"PIL_AVAILABLE: {PIL_AVAILABLE}"
                                )
                                if not PIL_AVAILABLE:
                                    error_msg = (
                                        "Image is too large and PIL/Pillow is not "
                                        "available for automatic resizing. "
                                        "Please install Pillow (pip install Pillow) "
                                        "or resize the image manually to approximately "
                                        "2000x2000 pixels or smaller."
                                    )
                                    logger.error(error_msg)
                                    raise RuntimeError(error_msg)

                                logger.info("   Starting image resize process...")
                                if estimated_tokens is not None:
                                    total_tokens_str = (
                                        f"{total_estimated_tokens:,}"
                                        if total_estimated_tokens is not None
                                        else "unknown"
                                    )
                                    logger.warning(
                                        f"   Image is too large ({width}x{height} pixels "
                                        f"≈ {estimated_tokens:,} tokens, "
                                        f"total with text ≈ {total_tokens_str} tokens, "
                                        f"limit is 1,048,576). "
                                        f"Resizing to fit within limit "
                                        f"(target: ~{max_dimension}x{max_dimension} pixels)."
                                    )
                                else:
                                    logger.warning(
                                        f"   Image appears too large "
                                        f"(base64_size={base64_size:,} chars). "
                                        f"Resizing to fit within limit "
                                        f"(target: ~{max_dimension}x{max_dimension} pixels)."
                                    )

                                if PIL_AVAILABLE:
                                    try:
                                        if decoded is None:
                                            decoded = base64.b64decode(
                                                base64_data
                                            )
                                        img = Image.open(io.BytesIO(decoded))

                                        if width > height:
                                            new_width = max_dimension
                                            new_height = int(
                                                height
                                                * (max_dimension / width)
                                            )
                                        else:
                                            new_height = max_dimension
                                            new_width = int(
                                                width
                                                * (max_dimension / height)
                                            )

                                        img_resized = img.resize(
                                            (new_width, new_height),
                                            Image.Resampling.LANCZOS,
                                        )

                                        output_buffer = io.BytesIO()
                                        if mimetype == "image/png":
                                            img_resized.save(
                                                output_buffer,
                                                format="PNG",
                                                optimize=True,
                                            )
                                        elif mimetype in [
                                            "image/jpeg",
                                            "image/jpg",
                                        ]:
                                            img_resized.save(
                                                output_buffer,
                                                format="JPEG",
                                                quality=85,
                                                optimize=True,
                                            )
                                        else:
                                            img_resized.save(
                                                output_buffer,
                                                format="PNG",
                                                optimize=True,
                                            )
                                            mimetype = "image/png"

                                        resized_base64 = base64.b64encode(
                                            output_buffer.getvalue()
                                        ).decode("utf-8")
                                        old_base64_size = len(base64_data)
                                        logger.warning(
                                            f"   ===== FIRST RESIZE COMPLETE ===== "
                                            f"new_base64_size: {len(resized_base64):,} "
                                            f"chars (was {old_base64_size:,})"
                                        )
                                        base64_data = resized_base64

                                        if (
                                            new_width <= 384
                                            and new_height <= 384
                                        ):
                                            new_estimated_tokens = 258
                                        else:
                                            new_tiles_per_width = (
                                                new_width + 767
                                            ) // 768
                                            new_tiles_per_height = (
                                                new_height + 767
                                            ) // 768
                                            new_total_tiles = (
                                                new_tiles_per_width
                                                * new_tiles_per_height
                                            )
                                            new_estimated_tokens = (
                                                new_total_tiles * 258
                                            )

                                        new_total_with_this_image = (
                                            total_image_tokens
                                            + new_estimated_tokens
                                            + total_text_tokens
                                        )

                                        logger.info(
                                            f"   Resized image to {new_width}x{new_height} "
                                            f"pixels, {new_total_tiles} tiles, "
                                            f"~{new_estimated_tokens:,} tokens"
                                        )
                                        logger.info(
                                            f"   New total estimated tokens: "
                                            f"image={new_estimated_tokens:,}, "
                                            f"text={total_text_tokens:,}, "
                                            f"total_with_this_image="
                                            f"{new_total_with_this_image:,}, "
                                            f"total_image_tokens_so_far="
                                            f"{total_image_tokens:,}"
                                        )

                                        width = new_width
                                        height = new_height
                                        estimated_tokens = new_estimated_tokens

                                        if new_total_with_this_image > 500_000:
                                            logger.warning(
                                                "   Resized image still too large "
                                                f"({new_total_with_this_image:,} tokens). "
                                                "Resizing again more aggressively..."
                                            )
                                            max_dimension_2 = 600

                                            if width > height:
                                                new_width_2 = max_dimension_2
                                                new_height_2 = int(
                                                    height
                                                    * (max_dimension_2 / width)
                                                )
                                            else:
                                                new_height_2 = max_dimension_2
                                                new_width_2 = int(
                                                    width
                                                    * (max_dimension_2 / height)
                                                )

                                            img_resized_2 = img_resized.resize(
                                                (new_width_2, new_height_2),
                                                Image.Resampling.LANCZOS,
                                            )

                                            output_buffer_2 = io.BytesIO()
                                            if mimetype == "image/png":
                                                img_resized_2.save(
                                                    output_buffer_2,
                                                    format="PNG",
                                                    optimize=True,
                                                )
                                            elif mimetype in [
                                                "image/jpeg",
                                                "image/jpg",
                                            ]:
                                                img_resized_2.save(
                                                    output_buffer_2,
                                                    format="JPEG",
                                                    quality=80,
                                                    optimize=True,
                                                )
                                            else:
                                                img_resized_2.save(
                                                    output_buffer_2,
                                                    format="PNG",
                                                    optimize=True,
                                                )
                                                mimetype = "image/png"

                                            resized_base64_2 = base64.b64encode(
                                                output_buffer_2.getvalue()
                                            ).decode("utf-8")
                                            old_base64_size_2 = len(base64_data)
                                            logger.warning(
                                                f"   ===== SECOND RESIZE COMPLETE ===== "
                                                f"new_base64_size: "
                                                f"{len(resized_base64_2):,} chars "
                                                f"(was {old_base64_size_2:,})"
                                            )
                                            base64_data = resized_base64_2

                                            new_tiles_per_width_2 = (
                                                new_width_2 + 767
                                            ) // 768
                                            new_tiles_per_height_2 = (
                                                new_height_2 + 767
                                            ) // 768
                                            new_total_tiles_2 = (
                                                new_tiles_per_width_2
                                                * new_tiles_per_height_2
                                            )
                                            new_estimated_tokens_2 = (
                                                new_total_tiles_2 * 258
                                            )
                                            new_total_with_this_image_2 = (
                                                total_image_tokens
                                                + new_estimated_tokens_2
                                                + total_text_tokens
                                            )

                                            logger.info(
                                                f"   Second resize to "
                                                f"{new_width_2}x{new_height_2} pixels, "
                                                f"{new_total_tiles_2} tiles, "
                                                f"~{new_estimated_tokens_2:,} tokens"
                                            )
                                            logger.info(
                                                f"   Final total estimated tokens: "
                                                f"image={new_estimated_tokens_2:,}, "
                                                f"text={total_text_tokens:,}, "
                                                f"total_with_this_image="
                                                f"{new_total_with_this_image_2:,}, "
                                                f"total_image_tokens_so_far="
                                                f"{total_image_tokens:,}"
                                            )

                                            width = new_width_2
                                            height = new_height_2
                                            estimated_tokens = (
                                                new_estimated_tokens_2
                                            )

                                    except Exception as e:
                                        logger.error(
                                            f"   FAILED to resize image: {e}",
                                            exc_info=True,
                                        )
                                        error_msg = (
                                            f"Image is too large and automatic "
                                            f"resizing failed: {str(e)}. "
                                            "Please resize the image manually to "
                                            "approximately 2000x2000 pixels or smaller."
                                        )
                                        raise RuntimeError(error_msg)

                                new_base64_size = len(base64_data)
                                size_reduction = (
                                    original_base64_size - new_base64_size
                                )
                                size_reduction_pct = (
                                    (
                                        size_reduction
                                        / original_base64_size
                                        * 100
                                    )
                                    if original_base64_size > 0
                                    else 0
                                )
                                logger.warning(
                                    f"   ✓✓✓ Resize completed successfully! "
                                    f"Size: {original_base64_size:,} → "
                                    f"{new_base64_size:,} chars "
                                    f"({size_reduction_pct:.1f}% reduction)"
                                )
                                base64_size = new_base64_size
                            else:
                                estimated_original_size = int(
                                    base64_size * 0.75
                                )
                                if mimetype == "image/jpeg":
                                    estimated_pixels = (
                                        estimated_original_size * 2
                                    )
                                else:
                                    estimated_pixels = estimated_original_size
                                estimated_dimension = int(
                                    (estimated_pixels) ** 0.5
                                )
                                if estimated_dimension <= 384:
                                    estimated_tokens = 258
                                else:
                                    tiles_per_side = (
                                        estimated_dimension + 767
                                    ) // 768
                                    estimated_tiles = (
                                        tiles_per_side * tiles_per_side
                                    )
                                    estimated_tokens = (
                                        estimated_tiles * 258
                                    )

                                logger.info(
                                    f"   Image size estimate: "
                                    f"~{estimated_dimension}x{estimated_dimension} "
                                    f"pixels, ~{estimated_tokens:,} tokens"
                                )

                                if estimated_tokens > 800_000:
                                    error_msg = (
                                        f"Image appears to be too large "
                                        f"(estimated ~{estimated_dimension}x"
                                        f"{estimated_dimension} pixels ≈ "
                                        f"{estimated_tokens:,} tokens, "
                                        f"limit is 1,048,576). "
                                        "Please resize or compress the image "
                                        "before sending."
                                    )
                                    logger.error(error_msg)
                                    raise RuntimeError(error_msg)

                            if not needs_resize:
                                base64_size = len(base64_data)

                            final_base64_size = len(base64_data)
                            if final_base64_size > 2_000_000:
                                if not needs_resize:
                                    error_msg = (
                                        f"Image base64 data is too large "
                                        f"({final_base64_size:,} chars). "
                                        "Please compress or resize the image "
                                        "before sending."
                                    )
                                    logger.error(error_msg)
                                    raise RuntimeError(error_msg)
                                else:
                                    logger.warning(
                                        f"   WARNING: Resized image base64 size "
                                        f"({final_base64_size:,} chars) is "
                                        "still very large!"
                                    )

                            final_base64_size_before_add = len(base64_data)

                            logger.warning(
                                f"   ===== ADDING IMAGE TO PARTS ===== "
                                f"needs_resize={needs_resize}, "
                                f"final_base64_size="
                                f"{final_base64_size_before_add:,} chars"
                            )
                            logger.info(
                                "   ℹ️ Base64 size does NOT count as tokens "
                                "(only dimensions matter per Gemini docs)"
                            )
                            if needs_resize:
                                logger.warning(
                                    f"   ✓✓✓ Using RESIZED image data "
                                    f"(size: {final_base64_size_before_add:,} chars)"
                                )
                            else:
                                logger.warning(
                                    f"   ⚠⚠⚠ Using ORIGINAL image data "
                                    f"(size: {final_base64_size_before_add:,} chars) "
                                    "- NO RESIZE!"
                                )

                            parts.append(
                                {
                                    "inline_data": {
                                        "mime_type": mimetype,
                                        "data": base64_data,
                                    }
                                }
                            )
                            if estimated_tokens is not None:
                                total_image_tokens += estimated_tokens
                                logger.warning(
                                    f"   ✓ Image token estimate: "
                                    f"{estimated_tokens:,} (using Gemini 2.0+ "
                                    "formula: 768x768 tiles, 258 tokens/tile)"
                                )
                            else:
                                logger.warning(
                                    "   ⚠⚠⚠ Cannot update total_image_tokens - "
                                    "estimated_tokens is None!"
                                )

                            logger.warning(
                                f"   ✓ Image added to parts array. "
                                f"Current parts count: {len(parts)}"
                            )
                            if estimated_tokens is not None:
                                logger.warning(
                                    f"   ✓ Updated total_image_tokens: "
                                    f"{total_image_tokens:,} (added "
                                    f"{estimated_tokens:,} tokens from this image)"
                                )
                            else:
                                logger.warning(
                                    "   ⚠⚠⚠ Cannot log token update - "
                                    "estimated_tokens is None!"
                                )
                            if needs_resize:
                                logger.warning(
                                    f"   ✓✓✓ Added RESIZED image to parts: "
                                    f"mime_type={mimetype}, data_length="
                                    f"{final_base64_size_before_add:,} chars "
                                    f"(original was {original_base64_size:,} chars)"
                                )
                            else:
                                logger.warning(
                                    f"   ⚠⚠⚠ Added ORIGINAL image to parts: "
                                    f"mime_type={mimetype}, data_length="
                                    f"{final_base64_size_before_add:,} chars "
                                    "- NO RESIZE!"
                                )
                        except RuntimeError:
                            raise
                        except Exception as e:
                            logger.error(
                                f"   Failed to parse data URL: {e}",
                                exc_info=True,
                            )
                            logger.error(
                                f"   Image URL preview: "
                                f"{image_url[:100] if image_url else 'None'}..."
                            )
                            raise RuntimeError(
                                f"Failed to parse image data URL: {e}. "
                                f"Image URL preview: "
                                f"{image_url[:100] if image_url else 'None'}..."
                            )
                    elif image_url.startswith(("http://", "https://")):
                        parts.append(
                            {
                                "file_data": {
                                    "file_uri": image_url,
                                    "mime_type": "image/png",
                                }
                            }
                        )
                        logger.debug(
                            f"   Added file_data part: uri={image_url}"
                        )
        else:
            text_content = str(user_message)
            parts.append({"text": text_content})
            logger.debug(
                f"   Added text part (non-list): {len(text_content)} chars"
            )

        logger.debug(
            f"   Total parts: {len(parts)}, "
            f"Part types: {[list(p.keys()) for p in parts]}"
        )

        total_base64_size = 0
        for i, part in enumerate(parts):
            if "inline_data" in part:
                part_base64_size = len(
                    part["inline_data"].get("data", "")
                )
                total_base64_size += part_base64_size
                logger.warning(
                    f"   ===== PART {i} (image) ===== "
                    f"base64_size: {part_base64_size:,} chars"
                )
            elif "text" in part:
                logger.debug(f"   Part {i} (text): {len(part['text'])} chars")
        final_total_tokens = total_image_tokens + total_text_tokens
        logger.warning(
            f"   ===== FINAL PARTS SUMMARY ===== Total parts: {len(parts)}, "
            f"Total image base64 size: {total_base64_size:,} chars"
        )
        logger.warning(
            f"   ===== FINAL TOKEN ESTIMATE ===== Total image tokens: "
            f"{total_image_tokens:,}, Total text tokens: {total_text_tokens:,}, "
            f"GRAND TOTAL: {final_total_tokens:,} tokens (limit: 1,048,576)"
        )

        # Vertex :generateContent requires each Content to declare role "user" or "model";
        # AI Studio may omit it, but enterprise Vertex returns 400 otherwise.
        contents = [{"role": "user", "parts": parts}]
        request_data = {"contents": contents}

        if agent_config.system_prompt:
            request_data["systemInstruction"] = {
                "parts": [{"text": agent_config.system_prompt}]
            }
            logger.info(
                f"Gemini system instruction: {agent_config.system_prompt}"
            )

        logger.info(f"Gemini user message parts ({len(parts)} total):")
        for i, part in enumerate(parts):
            if "text" in part:
                text_preview = (
                    part["text"][:500] + "..."
                    if len(part["text"]) > 500
                    else part["text"]
                )
                logger.info(
                    f"   Part {i}: text ({len(part['text'])} chars) - "
                    f"{text_preview}"
                )
            elif "inline_data" in part:
                inline_data = part["inline_data"]
                data_length = len(inline_data.get("data", ""))
                logger.info(
                    f"   Part {i}: inline_data "
                    f"(mime_type={inline_data.get('mime_type')}, "
                    f"data_length={data_length} chars)"
                )
            elif "file_data" in part:
                file_data = part["file_data"]
                logger.info(
                    f"   Part {i}: file_data "
                    f"(file_uri={file_data.get('file_uri', '')[:100]}...)"
                )

        generation_config = {}
        if agent_config.temperature:
            generation_config["temperature"] = agent_config.temperature
        if agent_config.max_tokens:
            generation_config["maxOutputTokens"] = agent_config.max_tokens

        is_image_model = (
            "flash-image" in model.lower()
            or "pro-image" in model.lower()
            or "nano-banana" in model.lower()
            or "banana" in model.lower()
        )
        if is_image_model:
            generation_config["responseModalities"] = ["TEXT", "IMAGE"]
            logger.info(
                f"Image generation model detected: {model}, "
                "requesting TEXT and IMAGE outputs"
            )

        if generation_config:
            request_data["generationConfig"] = generation_config

        max_retries = 3
        retry_delay = 2.0
        response = None
        data = None

        for attempt in range(max_retries):
            try:
                response = None
                if use_studio:
                    async with httpx.AsyncClient(timeout=300.0) as client:
                        response = await client.post(
                            f"{base_url}/models/{model}:generateContent?key={studio_key}",
                            headers={"Content-Type": "application/json"},
                            json=request_data,
                        )
                    if _vertex.should_fallback_studio_to_vertex(response):
                        logger.warning(
                            "Gemini Developer API request failed (HTTP %s); falling back to Vertex AI with ADC",
                            response.status_code,
                        )
                        use_studio = False
                        response = await _vertex.post_vertex_generate_content(
                            model, request_data
                        )
                else:
                    response = await _vertex.post_vertex_generate_content(
                        model, request_data
                    )

                if response.status_code == 200:
                    try:
                        data = response.json()
                        break
                    except Exception as e:
                        logger.error(
                            f"Failed to parse Gemini API response as JSON: "
                            f"{e}"
                        )
                        logger.error(
                            f"Response status: {response.status_code}, "
                            f"Response text: {response.text[:500]}"
                        )
                        raise RuntimeError(
                            f"Failed to parse Gemini API response: {e}"
                        )

                if response.status_code == 429:
                    try:
                        error_data = response.json()
                        retry_info = None
                        if (
                            "error" in error_data
                            and "details" in error_data["error"]
                        ):
                            for detail in error_data["error"]["details"]:
                                if (
                                    detail.get("@type")
                                    == "type.googleapis.com/google.rpc.RetryInfo"
                                ):
                                    retry_info = detail.get("retryDelay")
                                    if retry_info:
                                        delay_str = retry_info.replace(
                                            "s", ""
                                        )
                                        try:
                                            retry_delay = float(
                                                delay_str
                                            )
                                        except ValueError:
                                            retry_delay = 2.0
                        else:
                            retry_delay = 2.0 * (2**attempt)

                        if attempt < max_retries - 1:
                            logger.warning(
                                f"Rate limit exceeded (429), retrying in "
                                f"{retry_delay:.1f}s "
                                f"(attempt {attempt + 1}/{max_retries})..."
                            )
                            await asyncio.sleep(retry_delay)
                            continue
                        else:
                            raise RuntimeError(
                                f"Gemini API rate limit exceeded after "
                                f"{max_retries} attempts. "
                                "Please wait and try again later. "
                                f"Error: {response.text}"
                            )
                    except (ValueError, KeyError) as e:
                        if attempt < max_retries - 1:
                            retry_delay = 2.0 * (2**attempt)
                            logger.warning(
                                f"Rate limit exceeded (429), retrying in "
                                f"{retry_delay:.1f}s "
                                f"(attempt {attempt + 1}/{max_retries})..."
                            )
                            await asyncio.sleep(retry_delay)
                            continue
                        else:
                            raise RuntimeError(
                                f"Gemini API request failed with status "
                                f"{response.status_code}: {response.text}"
                            )

                if response.status_code != 200:
                    error_text = (
                        response.text[:500]
                        if response.text
                        else "No error message"
                    )
                    vertex_403_hint = ""
                    if not use_studio and response.status_code == 403:
                        vertex_403_hint = (
                            _vertex.build_vertex_http_403_remediation_hint()
                        )
                    try:
                        error_data = response.json()
                        if (
                            "error" in error_data
                            and isinstance(
                                error_data["error"], dict
                            )
                        ):
                            error_message = error_data["error"].get(
                                "message", error_text
                            )
                            error_code = error_data["error"].get(
                                "code", response.status_code
                            )
                            raise RuntimeError(
                                f"Gemini API error ({error_code}): "
                                f"{error_message}{vertex_403_hint}"
                            )
                    except (ValueError, KeyError, TypeError):
                        pass
                    raise RuntimeError(
                        f"Gemini API request failed with status "
                        f"{response.status_code}: {error_text}"
                        f"{vertex_403_hint}"
                    )
            except RuntimeError:
                raise
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Gemini API request exception "
                        f"(attempt {attempt + 1}/{max_retries}): "
                        f"{type(e).__name__}: {str(e)}"
                    )
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    logger.error(
                        f"Gemini API request failed after {max_retries} "
                        f"attempts: {type(e).__name__}: {str(e)}"
                    )
                    raise RuntimeError(
                        f"Gemini API request failed: "
                        f"{type(e).__name__}: {str(e)}"
                    )

        if data is None:
            error_msg = (
                "Gemini API request completed but no data received"
            )
            if response:
                error_msg += (
                    f". Response status: {response.status_code}, "
                    f"Response text: "
                    f"{response.text[:500] if response.text else 'empty'}"
                )
            logger.error(error_msg)
            return ""

        logger.info(
            f"Gemini API response structure: "
            f"candidates={len(data.get('candidates', []))}, "
            f"keys={list(data.keys())}"
        )
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            logger.debug(f"   Candidate keys: {list(candidate.keys())}")
            if "content" in candidate:
                logger.debug(
                    f"   Content keys: "
                    f"{list(candidate['content'].keys())}"
                )
                if "parts" in candidate["content"]:
                    logger.debug(
                        f"   Parts count: "
                        f"{len(candidate['content']['parts'])}, "
                        f"Part keys: "
                        f"{[list(p.keys()) for p in candidate['content']['parts']]}"
                    )

        if "error" in data:
            error_msg = data["error"].get("message", "Unknown error")
            error_details = data["error"].get("details", [])
            logger.error(
                f"Gemini API error: {error_msg}, details: {error_details}"
            )
            raise RuntimeError(f"Gemini API error: {error_msg}")

        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            finish_reason = candidate.get("finishReason", "")
            if finish_reason:
                logger.info(f"   Gemini finish reason: {finish_reason}")
            else:
                logger.info("   Gemini finish reason: (not provided)")

            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                is_image_model = (
                    "flash-image" in model.lower()
                    or "pro-image" in model.lower()
                    or "nano-banana" in model.lower()
                    or "banana" in model.lower()
                )

                text_parts = []
                image_parts = []

                for i, part in enumerate(parts):
                    logger.debug(
                        f"   Part {i}: keys={list(part.keys())}"
                    )
                    if "text" in part and part["text"]:
                        text_parts.append(part["text"])
                        logger.debug(
                            f"   Found text part: {len(part['text'])} chars"
                        )
                    elif "inlineData" in part:
                        inline_data = part["inlineData"]
                        mime_type = inline_data.get(
                            "mimeType", "image/jpeg"
                        )
                        image_data = inline_data.get("data", "")
                        if image_data:
                            image_parts.append(
                                f"data:{mime_type};base64,{image_data}"
                            )
                            logger.info(
                                f"Extracted image from Gemini response: "
                                f"{len(image_data)} chars of base64 data, "
                                f"mime_type: {mime_type}"
                            )
                        else:
                            logger.warning(
                                "inlineData found but 'data' field is empty"
                            )
                    elif "inline_data" in part:
                        inline_data = part["inline_data"]
                        mime_type = inline_data.get(
                            "mime_type", "image/jpeg"
                        )
                        image_data = inline_data.get("data", "")
                        if image_data:
                            image_parts.append(
                                f"data:{mime_type};base64,{image_data}"
                            )
                            logger.info(
                                "Extracted image from Gemini response "
                                f"(snake_case): {len(image_data)} chars of "
                                f"base64 data, mime_type: {mime_type}"
                            )
                        else:
                            logger.warning(
                                "inline_data found but 'data' field is empty"
                            )
                    else:
                        logger.warning(
                            f"Part {i} has unknown structure: {part}"
                        )

                if image_parts:
                    if len(image_parts) == 1:
                        logger.info(
                            "Returning single image as base64 data URL"
                        )
                        return image_parts[0]
                    else:
                        result = {
                            "images": image_parts,
                            "text": "\n".join(text_parts)
                            if text_parts
                            else None,
                        }
                        logger.info(
                            f"Returning {len(image_parts)} images with text"
                        )
                        return result

                if is_image_model and not image_parts:
                    logger.warning(
                        f"Image generation model '{model}' returned text but "
                        f"no images. Text parts: {len(text_parts)}, "
                        f"Parts structure: "
                        f"{[list(p.keys()) for p in parts]}"
                    )

                if text_parts:
                    logger.debug(
                        f"Returning text: {len(text_parts)} parts, "
                        f"total length: "
                        f"{sum(len(t) for t in text_parts)}"
                    )
                    return "\n".join(text_parts)

                logger.error(
                    "Gemini returned no content (no text or images). "
                    f"Parts: {len(parts)}, Finish reason: {finish_reason}"
                )
                logger.error(
                    "   This usually means the API call succeeded but "
                    "returned empty content. Check the model configuration "
                    "and prompt."
                )
                logger.error(
                    f"   Part structures: "
                    f"{[list(p.keys()) for p in parts]}"
                )
                logger.error(f"   Full parts data: {parts}")
                return ""
            else:
                logger.error(
                    "Candidate has no 'content' or 'parts'. "
                    f"Candidate keys: {list(candidate.keys())}"
                )
                logger.error(f"   Full candidate data: {candidate}")
                return ""
        else:
            if "error" in data:
                error_msg = data["error"].get("message", "Unknown error")
                error_details = data["error"].get("details", [])
                logger.error(
                    f"Gemini API error: {error_msg}, "
                    f"details: {error_details}"
                )
                raise RuntimeError(f"Gemini API error: {error_msg}")
            logger.error(
                "Gemini API response has no candidates. "
                f"Response keys: {list(data.keys())}"
            )
            logger.error(f"   Full response data: {data}")
            return ""

        logger.error(
            f"Unexpected Gemini API response format: {data}"
        )
        return ""

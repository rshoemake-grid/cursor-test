"""
Read mode strategies for LocalFileSystemHandler (SRP).
Each strategy handles one read mode: tail, lines, batch, or full.
"""
import io
import json
import time
from pathlib import Path
from typing import Any, Dict, List

from ..utils.image_utils import get_mimetype_from_bytes, bytes_to_data_url
from ..utils.line_utils import parse_json_line


def read_tail(path: Path, config: Dict[str, Any], encoding: str) -> Dict[str, Any]:
    """Read last N lines from file (tail mode)."""
    num_lines = config.get("tail_lines", 10)
    follow = config.get("tail_follow", False)
    wait_timeout = config.get("tail_wait_timeout", 5.0)
    parse_json = config.get("parse_json_lines", True)

    lines = []
    with open(path, "r", encoding=encoding) as f:
        f.seek(0, io.SEEK_END)
        file_size = f.tell()

        if file_size == 0:
            return {
                "lines": [],
                "total_lines": 0,
                "file_path": str(path),
                "read_mode": "tail",
                "tail_lines": num_lines,
                "follow": follow,
            }

        chunk_size = min(8192, file_size)
        position = file_size
        buffer = ""
        lines_found: List[str] = []

        while position > 0 and len(lines_found) < num_lines:
            read_size = min(chunk_size, position)
            position -= read_size
            f.seek(position)
            chunk = f.read(read_size) + buffer
            chunk_lines = chunk.split("\n")
            buffer = chunk_lines[0]

            for line in reversed(chunk_lines[1:]):
                if line.strip():
                    lines_found.insert(0, line)
                    if len(lines_found) >= num_lines:
                        break

        if buffer.strip() and len(lines_found) < num_lines:
            lines_found.insert(0, buffer)

        for idx, line in enumerate(lines_found[-num_lines:]):
            ln = len(lines_found) - num_lines + idx + 1
            lines.append(parse_json_line(line, ln, parse_json))

    if follow:
        initial_size = file_size
        start_time = time.time()
        while time.time() - start_time < wait_timeout:
            time.sleep(0.5)
            current_size = path.stat().st_size
            if current_size > initial_size:
                with open(path, "r", encoding=encoding) as f:
                    f.seek(initial_size)
                    new_content = f.read()
                    for new_line in new_content.split("\n"):
                        if new_line.strip():
                            lines.append(
                                parse_json_line(
                                    new_line, len(lines) + 1, parse_json, is_new=True
                                )
                            )
                initial_size = current_size
                start_time = time.time()

    return {
        "lines": lines,
        "total_lines": len(lines),
        "file_path": str(path),
        "read_mode": "tail",
        "tail_lines": num_lines,
        "follow": follow,
        "file_size": file_size,
    }


def read_lines(path: Path, config: Dict[str, Any], encoding: str) -> Dict[str, Any]:
    """Read file line by line (lines mode)."""
    skip_empty = config.get("skip_empty_lines", True)
    parse_json = config.get("parse_json_lines", True)
    max_lines = config.get("max_lines")

    lines: List[Dict[str, Any]] = []
    line_count = 0
    with open(path, "r", encoding=encoding) as f:
        for line in f:
            line = line.rstrip("\n\r")
            if skip_empty and not line:
                continue
            if max_lines and line_count >= max_lines:
                break
            lines.append(parse_json_line(line, line_count + 1, parse_json))
            line_count += 1

    return {
        "lines": lines,
        "total_lines": line_count,
        "file_path": str(path),
        "read_mode": "lines",
    }


def read_batch(path: Path, config: Dict[str, Any], encoding: str) -> Dict[str, Any]:
    """Read file in batches (batch mode)."""
    batch_size = config.get("batch_size", 1000)
    skip_empty = config.get("skip_empty_lines", True)
    parse_json = config.get("parse_json_lines", True)
    start_line = config.get("start_line", 0)

    batches: List[Dict[str, Any]] = []
    current_batch: List[Dict[str, Any]] = []
    line_count = 0
    batch_number = 0

    with open(path, "r", encoding=encoding) as f:
        for _ in range(start_line):
            try:
                next(f)
            except StopIteration:
                break

        for line in f:
            line = line.rstrip("\n\r")
            if skip_empty and not line:
                continue
            current_batch.append(
                parse_json_line(line, start_line + line_count + 1, parse_json)
            )
            line_count += 1
            if len(current_batch) >= batch_size:
                batches.append(
                    {
                        "batch_number": batch_number,
                        "start_line": start_line + (batch_number * batch_size),
                        "end_line": start_line + line_count,
                        "lines": current_batch,
                    }
                )
                batch_number += 1
                current_batch = []

    if current_batch:
        batches.append(
            {
                "batch_number": batch_number,
                "start_line": start_line + (batch_number * batch_size),
                "end_line": start_line + line_count,
                "lines": current_batch,
            }
        )

    return {
        "batches": batches,
        "total_batches": len(batches),
        "total_lines": line_count,
        "batch_size": batch_size,
        "file_path": str(path),
        "read_mode": "batch",
    }


def _is_image_file(path: Path) -> bool:
    """Check if file is an image by extension or magic bytes."""
    image_extensions = {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico", ".heic", ".heif"
    }
    if path.suffix.lower() in image_extensions:
        return True
    try:
        with open(path, "rb") as f:
            magic = f.read(8)
        if magic[:4] == b"\x89PNG":
            return True
        if magic[:3] == b"\xff\xd8\xff":
            return True
        if magic[:4] == b"GIF8":
            return True
        if magic[:4] == b"RIFF" and b"WEBP" in magic:
            return True
    except Exception:
        pass
    return False


def read_full(path: Path, config: Dict[str, Any], encoding: str) -> Any:
    """Read entire file (full mode). Handles text, JSON, and images."""
    if _is_image_file(path):
        with open(path, "rb") as f:
            data = f.read()
        mimetype = get_mimetype_from_bytes(data)
        if not mimetype:
            import mimetypes
            mimetype, _ = mimetypes.guess_type(str(path))
        if not mimetype:
            ext = path.suffix.lower()
            mimetype = {
                ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
                ".gif": "image/gif", ".webp": "image/webp",
            }.get(ext, "image/jpeg")
        return bytes_to_data_url(data, mimetype)

    with open(path, "r", encoding=encoding) as f:
        content = f.read()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return content


READ_MODE_STRATEGIES = {
    "tail": read_tail,
    "lines": read_lines,
    "batch": read_batch,
    "full": read_full,
}

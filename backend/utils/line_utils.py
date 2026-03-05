"""Shared line parsing utilities (DRY)."""
import json
from typing import Any, Dict


def parse_json_line(line: str, line_number: int, parse_json: bool, **extra: Any) -> Dict[str, Any]:
    """Parse a line, optionally as JSON. Returns dict with line_number, content, raw, and any extra keys."""
    line = line.rstrip("\n\r")
    if parse_json:
        try:
            parsed = json.loads(line)
            return {"line_number": line_number, "content": parsed, "raw": line, **extra}
        except json.JSONDecodeError:
            return {"line_number": line_number, "content": line, "raw": line, **extra}
    return {"line_number": line_number, "content": line, "raw": line, **extra}

#!/usr/bin/env python3
"""
Emit FastAPI OpenAPI path templates for Java parity testing.

Usage (from repository root):
  python backend/scripts/export_openapi_paths.py

Writes: backend-java/src/test/resources/parity/python-openapi-paths.json

Run after adding or renaming routes in the Python API so OpenApiParityTest stays current.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


def main() -> None:
    from backend.main import app

    paths = sorted(app.openapi()["paths"].keys())
    out = _ROOT / "backend-java" / "src" / "test" / "resources" / "parity" / "python-openapi-paths.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(paths, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(paths)} paths to {out}")


if __name__ == "__main__":
    main()

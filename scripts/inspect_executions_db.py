#!/usr/bin/env python3
"""
Inspect workflow executions in the local SQLite DB (same file as Spring Boot default).

Usage:
  python3 scripts/inspect_executions_db.py
  python3 scripts/inspect_executions_db.py exec-abc-... exec-def-...
  WORKFLOW_SQLITE_DB=/path/to/workflows.db python3 scripts/inspect_executions_db.py exec-...

Repo default: workflows.db at repository root (see backend-java SqlitePathEnvironmentPostProcessor).
"""
from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path


def default_db_path() -> Path:
    env = os.environ.get("WORKFLOW_SQLITE_DB", "").strip()
    if env:
        return Path(env).expanduser().resolve()
    root = Path(__file__).resolve().parent.parent
    return root / "workflows.db"


def fetch_execution_rows(
    conn: sqlite3.Connection, ids: list[str] | None, recent_limit: int = 25
) -> list[sqlite3.Row]:
    """Return execution rows joined to users.username (owner_username)."""
    conn.row_factory = sqlite3.Row
    if ids:
        placeholders = ",".join("?" * len(ids))
        return conn.execute(
            f"""
            SELECT e.id, e.workflow_id, e.user_id, e.status, e.started_at, e.completed_at,
                   u.username AS owner_username
            FROM executions e
            LEFT JOIN users u ON u.id = e.user_id
            WHERE e.id IN ({placeholders})
            ORDER BY e.started_at DESC
            """,
            ids,
        ).fetchall()
    return conn.execute(
        f"""
        SELECT e.id, e.workflow_id, e.user_id, e.status, e.started_at, e.completed_at,
               u.username AS owner_username
        FROM executions e
        LEFT JOIN users u ON u.id = e.user_id
        ORDER BY e.started_at DESC
        LIMIT {int(recent_limit)}
        """
    ).fetchall()


def main() -> int:
    db = default_db_path()
    if not db.is_file():
        print(f"Database file not found: {db}", file=sys.stderr)
        print("Set WORKFLOW_SQLITE_DB or run from repo with workflows.db at root.", file=sys.stderr)
        return 1

    ids = [a for a in sys.argv[1:] if a.strip()]
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='executions'"
        )
        if cur.fetchone() is None:
            print("Table 'executions' does not exist.", file=sys.stderr)
            return 1

        rows = fetch_execution_rows(conn, ids if ids else None, recent_limit=25)

        if not rows:
            print("No matching rows." if ids else "No executions in database.")
            return 0

        cols = list(rows[0].keys())
        widths = {
            c: max(
                len(c),
                *(len("" if r[c] is None else str(r[c])) for r in rows),
            )
            for c in cols
        }

        def line(values: dict[str, object]) -> str:
            return "  ".join(
                str(values[c])[:200].ljust(widths[c]) for c in cols
            )

        print(f"Database: {db}")
        print(line({c: c for c in cols}))
        print("-" * (sum(widths[c] for c in cols) + 2 * (len(cols) - 1)))
        for r in rows:
            print(line({c: ("" if r[c] is None else str(r[c])) for c in cols}))

        if ids:
            missing = set(ids) - {r["id"] for r in rows}
            if missing:
                print("\nIDs not found in DB:", ", ".join(sorted(missing)), file=sys.stderr)
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

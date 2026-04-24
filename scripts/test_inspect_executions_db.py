"""Unit tests for inspect_executions_db (import by path to avoid stdlib `inspect` name clash)."""
from __future__ import annotations

import importlib.util
import sqlite3
import unittest
from pathlib import Path


def _load_inspect_module():
    path = Path(__file__).resolve().parent / "inspect_executions_db.py"
    spec = importlib.util.spec_from_file_location("workflow_exec_db_inspect", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TestFetchExecutionRows(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = _load_inspect_module()
        self.conn = sqlite3.connect(":memory:")
        self.conn.executescript(
            """
            CREATE TABLE users (
                id VARCHAR NOT NULL PRIMARY KEY,
                username VARCHAR NOT NULL
            );
            CREATE TABLE executions (
                id VARCHAR NOT NULL PRIMARY KEY,
                workflow_id VARCHAR NOT NULL,
                user_id VARCHAR,
                status VARCHAR NOT NULL,
                state TEXT NOT NULL,
                started_at DATETIME,
                completed_at DATETIME,
                FOREIGN KEY(user_id) REFERENCES users (id)
            );
            INSERT INTO users (id, username) VALUES ('user-1', 'alice');
            INSERT INTO executions (id, workflow_id, user_id, status, state, started_at)
            VALUES ('exec-one', 'wf-1', 'user-1', 'running', '{}', '2020-01-01');
            """
        )

    def tearDown(self) -> None:
        self.conn.close()

    def test_fetch_by_id_returns_owner_username(self) -> None:
        rows = self.mod.fetch_execution_rows(self.conn, ["exec-one"], recent_limit=25)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["id"], "exec-one")
        self.assertEqual(rows[0]["user_id"], "user-1")
        self.assertEqual(rows[0]["owner_username"], "alice")

    def test_fetch_recent_when_ids_none(self) -> None:
        rows = self.mod.fetch_execution_rows(self.conn, None, recent_limit=10)
        self.assertEqual(len(rows), 1)


if __name__ == "__main__":
    unittest.main()

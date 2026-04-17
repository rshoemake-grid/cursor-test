"""Path utils for local file browser (no heavy backend imports)."""

from pathlib import Path

import pytest

from backend.utils.path_utils import compute_local_browser_can_go_up


def test_compute_can_go_up_unrestricted(monkeypatch, tmp_path):
    monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
    base = tmp_path
    nested = tmp_path / "a" / "b"
    nested.mkdir(parents=True)
    assert compute_local_browser_can_go_up(nested, base) is True
    assert compute_local_browser_can_go_up(base, base) is True


def test_compute_can_go_up_restricted(monkeypatch, tmp_path):
    monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
    base = tmp_path.resolve()
    nested = (tmp_path / "sub").resolve()
    nested.mkdir()
    assert compute_local_browser_can_go_up(nested, base) is True
    assert compute_local_browser_can_go_up(base, base) is False


def test_compute_can_go_up_unrestricted_at_filesystem_root(monkeypatch):
    monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
    root = Path("/").resolve()
    assert compute_local_browser_can_go_up(root, root) is False

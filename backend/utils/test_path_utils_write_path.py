"""Tests for local filesystem write path resolution (symlink-avoidance when unrestricted)."""

from pathlib import Path

import pytest

from backend.utils.path_utils import (
    combine_local_write_path_with_pattern,
    resolve_local_filesystem_write_path,
)


def test_resolve_write_path_requires_non_empty():
    with pytest.raises(ValueError, match="file_path is required"):
        resolve_local_filesystem_write_path("")
    with pytest.raises(ValueError, match="file_path is required"):
        resolve_local_filesystem_write_path("   ")


def test_resolve_write_path_unrestricted_relative(monkeypatch, tmp_path):
    monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
    monkeypatch.chdir(tmp_path)
    p = resolve_local_filesystem_write_path("out/nested/file.txt")
    assert p == Path(tmp_path / "out/nested/file.txt").resolve()
    assert p.is_absolute()


def test_resolve_write_path_unrestricted_absolute_normpath(monkeypatch, tmp_path):
    monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
    base = tmp_path.resolve()
    p = resolve_local_filesystem_write_path(str(base / "a" / ".." / "b" / "c.txt"))
    assert p == base / "b" / "c.txt"


def test_resolve_write_path_restricted_inside_base(monkeypatch, tmp_path):
    monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
    (tmp_path / "sub").mkdir()
    target = tmp_path / "sub" / "out.txt"
    p = resolve_local_filesystem_write_path(str(target))
    assert p == target.resolve()


def test_combine_pattern_unrestricted(monkeypatch, tmp_path):
    monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
    d = tmp_path / "dir"
    d.mkdir()
    p = combine_local_write_path_with_pattern(d, "out.json")
    assert p == tmp_path / "dir" / "out.json"


def test_combine_pattern_restricted(monkeypatch, tmp_path):
    monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
    d = tmp_path / "dir"
    d.mkdir()
    p = combine_local_write_path_with_pattern(d, "out.json")
    assert p == (d / "out.json").resolve()

"""Security tests: path traversal, directory read with malicious file_pattern."""
import os
import tempfile
import pytest
from pathlib import Path

from backend.inputs.input_sources import LocalFileSystemHandler


class TestPathTraversalMaliciousFilePattern:
    """LocalFileSystemHandler.read with file_pattern that could yield paths outside base."""

    def test_directory_read_rejects_paths_outside_base_from_glob(self, tmp_path):
        """file_pattern like ../ escapes - glob results outside base_dir are rejected."""
        base_dir = tmp_path / "allowed"
        base_dir.mkdir()
        (base_dir / "valid.json").write_text('{"ok": true}')
        sibling = tmp_path / "sibling"
        sibling.mkdir()
        (sibling / "secret.json").write_text('{"secret": true}')
        config = {
            "file_path": str(base_dir),
            "file_pattern": "../sibling/*.json",
        }
        with pytest.raises(ValueError, match="outside directory"):
            LocalFileSystemHandler.read(config)

    def test_directory_read_rejects_absolute_path_in_pattern(self, tmp_path):
        """file_pattern as absolute path outside base is rejected."""
        base_dir = tmp_path / "allowed"
        base_dir.mkdir()
        (base_dir / "valid.json").write_text('{"ok": true}')
        outside = tmp_path / "outside"
        outside.mkdir()
        (outside / "secret.json").write_text('{"secret": true}')
        config = {
            "file_path": str(base_dir),
            "file_pattern": str(outside / "*.json"),
        }
        try:
            result = LocalFileSystemHandler.read(config)
            assert not any("secret" in str(r) for r in (result if isinstance(result, list) else [result]))
        except (ValueError, FileNotFoundError):
            pass


class TestDirectoryReadPathsOutsideBase:
    def test_directory_read_validates_each_glob_result(self, tmp_path):
        base_dir = tmp_path / "base"
        base_dir.mkdir()
        (base_dir / "a.json").write_text('{"a": 1}')
        (base_dir / "b.json").write_text('{"b": 2}')
        config = {
            "file_path": str(base_dir),
            "file_pattern": "*.json",
        }
        result = LocalFileSystemHandler.read(config)
        assert len(result) == 2
        assert {"a": 1} in result
        assert {"b": 2} in result

class TestFileReaderToolPathValidation:
    """T-4: FileReaderTool rejects paths outside base when LOCAL_FILE_BASE_PATH set."""

    @pytest.mark.asyncio
    async def test_file_reader_rejects_path_outside_base(self, tmp_path, monkeypatch):
        """FileReaderTool returns error when path is outside LOCAL_FILE_BASE_PATH."""
        monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
        # Clear config cache so new env is picked up
        try:
            from backend.config import clear_settings_cache
            clear_settings_cache()
        except Exception:
            pass

        from backend.tools.builtin_tools import FileReaderTool
        tool = FileReaderTool()

        # Path outside base - use /etc/passwd or sibling
        outside = tmp_path.parent / "outside_base"
        outside.mkdir(exist_ok=True)
        (outside / "secret.txt").write_text("secret")
        outside_file = str(outside / "secret.txt")

        result = await tool.execute(outside_file)
        assert "error" in result
        assert "outside" in result["error"].lower() or "base" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_file_reader_allows_path_inside_base(self, tmp_path, monkeypatch):
        """FileReaderTool allows path inside LOCAL_FILE_BASE_PATH."""
        monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
        try:
            from backend.config import clear_settings_cache
            clear_settings_cache()
        except Exception:
            pass

        allowed = tmp_path / "allowed.txt"
        allowed.write_text("hello")

        from backend.tools.builtin_tools import FileReaderTool
        tool = FileReaderTool()
        result = await tool.execute(str(allowed))
        assert "error" not in result or "content" in result
        assert result.get("content") == "hello" or result.get("lines_read", 0) >= 1


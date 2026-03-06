"""Tests for path validation utilities (path traversal protection)."""
import os
import tempfile
import pytest
from pathlib import Path

from backend.utils.path_utils import get_local_file_base_path, validate_path_within_base


class TestGetLocalFileBasePath:
    def test_defaults_to_cwd_when_not_set(self, monkeypatch):
        monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
        base = get_local_file_base_path()
        assert base == Path(os.getcwd()).resolve()

    def test_uses_env_when_set(self, monkeypatch, tmp_path):
        monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
        base = get_local_file_base_path()
        assert base == tmp_path.resolve()


class TestValidatePathWithinBase:
    """validate_path_within_base only runs when LOCAL_FILE_BASE_PATH is set."""

    def test_skips_validation_when_not_set(self, monkeypatch, tmp_path):
        monkeypatch.delenv("LOCAL_FILE_BASE_PATH", raising=False)
        validate_path_within_base(Path("/etc/passwd"))

    def test_allows_path_inside_base_when_set(self, monkeypatch, tmp_path):
        monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
        allowed = tmp_path / "subdir" / "file.txt"
        allowed.parent.mkdir(parents=True, exist_ok=True)
        allowed.touch()
        validate_path_within_base(allowed.resolve())

    def test_raises_for_path_outside_base_when_set(self, monkeypatch, tmp_path):
        monkeypatch.setenv("LOCAL_FILE_BASE_PATH", str(tmp_path))
        outside = Path("/etc/passwd") if Path("/etc/passwd").exists() else Path("/nonexistent_outside")
        with pytest.raises(ValueError, match="outside allowed base directory"):
            validate_path_within_base(outside)

def test_startup_fails_when_production_and_no_local_file_base_path():
    """T-2: Startup fails when ENVIRONMENT=production and LOCAL_FILE_BASE_PATH unset."""
    import subprocess
    import sys
    import os

    env = dict(os.environ)
    env["ENVIRONMENT"] = "production"
    env.pop("LOCAL_FILE_BASE_PATH", None)
    env.pop("SECRET_KEY", None)
    env["SECRET_KEY"] = "test-secret-for-startup-check"

    code = """
import os
import sys
os.environ["ENVIRONMENT"] = "production"
os.environ.pop("LOCAL_FILE_BASE_PATH", None)
os.environ.setdefault("SECRET_KEY", "test-secret")
try:
    from backend.main import startup_event
    import asyncio
    asyncio.run(startup_event())
    sys.exit(1)
except RuntimeError as e:
    if "LOCAL_FILE_BASE_PATH" in str(e):
        sys.exit(0)
    raise
"""
    result = subprocess.run(
        [sys.executable, "-c", code],
        cwd=".",
        capture_output=True,
        text=True,
        env=env,
    )
    assert result.returncode == 0, (result.stdout or "") + (result.stderr or "")


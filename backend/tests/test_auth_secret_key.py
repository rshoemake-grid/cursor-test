"""Tests for SECRET_KEY validation in production."""
import subprocess
import sys
import os
import pytest


def test_secret_key_required_in_production():
    """ENVIRONMENT=production and no SECRET_KEY should raise RuntimeError."""
    env = dict(os.environ)
    env["ENVIRONMENT"] = "production"
    env.pop("SECRET_KEY", None)
    code = """
import os
import sys
os.environ["ENVIRONMENT"] = "production"
os.environ.pop("SECRET_KEY", None)
try:
    from backend.auth import auth
    sys.exit(1)
except RuntimeError as e:
    if "SECRET_KEY" in str(e):
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

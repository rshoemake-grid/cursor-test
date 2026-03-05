"""Unit tests for backend.utils.log_utils."""
import pytest
from unittest.mock import Mock

from backend.utils.log_utils import serialize_log_for_json


def test_uses_model_dump_when_available():
    log = Mock()
    log.model_dump.return_value = {"timestamp": "2026-01-01", "level": "INFO", "message": "test"}
    result = serialize_log_for_json(log)
    assert result == {"timestamp": "2026-01-01", "level": "INFO", "message": "test"}
    log.model_dump.assert_called_once_with(mode="json")


def test_returns_log_as_is_when_no_model_dump():
    log = {"timestamp": "2026-01-01", "level": "INFO", "message": "test"}
    result = serialize_log_for_json(log)
    assert result is log

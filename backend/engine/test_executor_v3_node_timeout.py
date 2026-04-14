"""Per-node execution wall-clock timeout (NODE_EXECUTION_TIMEOUT_SEC)."""
import asyncio

import pytest

from backend.engine.executor_v3 import (
    await_with_node_timeout,
    node_execution_timeout_seconds,
)


def test_node_execution_timeout_seconds_default(monkeypatch):
    monkeypatch.delenv("NODE_EXECUTION_TIMEOUT_SEC", raising=False)
    assert node_execution_timeout_seconds() == 900.0


def test_node_execution_timeout_seconds_zero_disables(monkeypatch):
    monkeypatch.setenv("NODE_EXECUTION_TIMEOUT_SEC", "0")
    assert node_execution_timeout_seconds() is None


def test_node_execution_timeout_seconds_custom(monkeypatch):
    monkeypatch.setenv("NODE_EXECUTION_TIMEOUT_SEC", "123")
    assert node_execution_timeout_seconds() == 123.0


def test_node_execution_timeout_seconds_invalid_falls_back(monkeypatch):
    monkeypatch.setenv("NODE_EXECUTION_TIMEOUT_SEC", "not-a-number")
    assert node_execution_timeout_seconds() == 900.0


@pytest.mark.asyncio
async def test_await_with_node_timeout_passes_through_when_disabled():
    async def quick():
        return 42

    assert await await_with_node_timeout(quick(), node_id="n1", timeout=None) == 42


@pytest.mark.asyncio
async def test_await_with_node_timeout_raises_on_expiry():
    async def slow():
        await asyncio.sleep(1.0)

    with pytest.raises(TimeoutError, match="n-slow"):
        await await_with_node_timeout(slow(), node_id="n-slow", timeout=0.08)

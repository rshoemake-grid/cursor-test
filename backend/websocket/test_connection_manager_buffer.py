"""Buffered WebSocket fan-out so late subscribers do not miss early execution events."""
import asyncio
from unittest.mock import AsyncMock

import pytest

from backend.websocket.manager import (
    EXECUTION_WS_BUFFER_MAX_MESSAGES,
    ConnectionManager,
)


@pytest.mark.asyncio
async def test_replays_buffered_messages_when_subscriber_connects_after_broadcast():
    cm = ConnectionManager()
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()

    await cm.broadcast_status("exec-late", "running", {"workflow_id": "wf-1"})
    await cm.broadcast_log(
        "exec-late",
        {"level": "INFO", "message": "hello", "node_id": None, "timestamp": "t0"},
    )

    await cm.connect(ws, "exec-late")

    ws.accept.assert_awaited_once()
    sent = [c.args[0] for c in ws.send_json.await_args_list]
    assert len(sent) == 2
    assert sent[0]["type"] == "status"
    assert sent[0]["status"] == "running"
    assert sent[1]["type"] == "log"
    assert sent[1]["log"]["message"] == "hello"


@pytest.mark.asyncio
async def test_live_subscriber_receives_new_messages_without_extra_replay():
    cm = ConnectionManager()
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()

    await cm.connect(ws, "exec-live")
    ws.send_json.reset_mock()

    await cm.broadcast_status("exec-live", "running", {})

    ws.send_json.assert_awaited_once()
    msg = ws.send_json.await_args.args[0]
    assert msg["type"] == "status"


@pytest.mark.asyncio
async def test_buffer_drops_oldest_when_over_maxlen():
    cm = ConnectionManager()
    assert EXECUTION_WS_BUFFER_MAX_MESSAGES >= 3

    eid = "exec-cap"
    for i in range(EXECUTION_WS_BUFFER_MAX_MESSAGES + 5):
        await cm.broadcast_status(eid, f"s-{i}", {})

    buf = cm._message_buffers.get(eid)
    assert buf is not None
    assert len(buf) == EXECUTION_WS_BUFFER_MAX_MESSAGES


@pytest.mark.asyncio
async def test_connect_delivers_events_that_arrive_while_replaying_buffer():
    cm = ConnectionManager()
    ws = AsyncMock()
    ws.accept = AsyncMock()
    payloads = []

    async def slow_send_json(message):
        payloads.append(message)
        await asyncio.sleep(0.02)

    ws.send_json = slow_send_json

    await cm.broadcast_status("exec-mid", "running", {"workflow_id": "wf-1"})

    async def inject_log():
        await asyncio.sleep(0.01)
        await cm.broadcast_log(
            "exec-mid",
            {
                "level": "INFO",
                "message": "during-replay",
                "node_id": None,
                "timestamp": "t1",
            },
        )

    asyncio.create_task(inject_log())
    await cm.connect(ws, "exec-mid")

    assert [p["type"] for p in payloads] == ["status", "log"]
    assert payloads[1]["log"]["message"] == "during-replay"


@pytest.mark.asyncio
async def test_buffer_cleared_when_last_client_disconnects():
    cm = ConnectionManager()
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()

    await cm.broadcast_status("exec-drop", "running", {})
    await cm.connect(ws, "exec-drop")
    await cm.disconnect(ws, "exec-drop")

    assert "exec-drop" not in cm._message_buffers
    assert "exec-drop" not in cm.active_connections

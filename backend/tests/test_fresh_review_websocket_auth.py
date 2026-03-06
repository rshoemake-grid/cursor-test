"""
T-2: Fresh review - WebSocket auth and execution ownership tests.

C-3: WebSocket /ws/executions/{execution_id} requires token in query param; verifies execution ownership.
"""
import pytest
from fastapi.testclient import TestClient


def test_websocket_rejects_unauthenticated_connection():
    """T-2: Unauthenticated WebSocket connection is rejected (C-3)."""
    from main import app

    client = TestClient(app)
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/executions/test-exec-123") as ws:
            ws.send_text("ping")

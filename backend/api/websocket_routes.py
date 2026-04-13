from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select

from ..websocket.manager import manager
from ..utils.logger import get_logger
from ..database.db import AsyncSessionLocal
from ..database.models import UserDB, ExecutionDB, WorkflowDB
from ..auth.auth import SECRET_KEY, ALGORITHM

logger = get_logger(__name__)
router = APIRouter()

# WebSocket close codes: 4001 = policy violation (auth/authorization)
WS_CLOSE_UNAUTHORIZED = 4001


async def _verify_websocket_auth_and_ownership(websocket: WebSocket, execution_id: str) -> bool:
    """
    C-3: Verify token from query param and execution ownership.
    Returns True if authorized, False otherwise. Caller should close connection if False.
    """
    token = websocket.query_params.get("token")
    if not token:
        return False
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            return False
    except (JWTError, Exception):
        return False

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UserDB).where(UserDB.username == username))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            return False

        result = await db.execute(
            select(ExecutionDB).where(ExecutionDB.id == execution_id)
        )
        execution = result.scalar_one_or_none()
        if not execution:
            return False
        if execution.user_id is not None:
            if execution.user_id != user.id:
                return False
        else:
            # POST /execute with optional auth leaves user_id null; allow the workflow
            # owner to open the stream (same person who can read the workflow).
            wf_result = await db.execute(
                select(WorkflowDB).where(WorkflowDB.id == execution.workflow_id)
            )
            workflow = wf_result.scalar_one_or_none()
            if (
                workflow is None
                or workflow.owner_id is None
                or workflow.owner_id != user.id
            ):
                logger.debug(
                    "WebSocket denied: execution %s has no user_id and workflow "
                    "owner does not match user %s",
                    execution_id,
                    user.id,
                )
                return False
    return True


@router.websocket("/ws/executions/{execution_id}")
async def websocket_execution_stream(websocket: WebSocket, execution_id: str):
    """
    WebSocket endpoint for streaming real-time execution updates.
    C-3: Requires token in query param (?token=xxx); verifies execution ownership.
    """
    if not await _verify_websocket_auth_and_ownership(websocket, execution_id):
        # Browsers report an opaque failure if we close before accept(); accept then
        # close so the client receives a proper policy close (e.g. code 4001).
        await websocket.accept()
        await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason="Unauthorized")
        return

    await manager.connect(websocket, execution_id)
    
    try:
        # Keep connection alive and handle incoming messages if needed
        while True:
            # Receive messages (for potential future bidirectional communication)
            data = await websocket.receive_text()
            
            # Could handle commands like pause/resume here in future
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket, execution_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, execution_id)


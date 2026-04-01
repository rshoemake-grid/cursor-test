"""Workflow chat API routes"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends

from backend.database.db import get_db
from backend.database.models import UserDB
from backend.auth import get_optional_user
from backend.utils.logger import get_logger
from backend.dependencies import SettingsServiceDep, LLMClientFactoryDep, WorkflowServiceDep, WorkflowOwnershipServiceDep
from backend.utils.error_handling import INVALID_API_KEY_MSG, is_api_key_error
from backend.exceptions import WorkflowForbiddenError

from .models import ChatRequest, ChatResponse
from .tools import get_workflow_tools
from .context import get_workflow_context
from .service import create_changes_dict, run_chat_loop, has_workflow_changes
from .prompts import SYSTEM_PROMPT

logger = get_logger(__name__)

router = APIRouter(prefix="/workflow-chat", tags=["Workflow Chat"])

_CHAT_ITER_MIN = 1
_CHAT_ITER_MAX = 100
_DEFAULT_CHAT_ITERATION_LIMIT = 20


def _clamp_chat_iteration_limit(value: int) -> int:
    return max(_CHAT_ITER_MIN, min(int(value), _CHAT_ITER_MAX))


@router.post("/chat", response_model=ChatResponse)
async def chat_with_workflow(
    request: ChatRequest,
    db=Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    settings_service: SettingsServiceDep = ...,
    llm_client_factory: LLMClientFactoryDep = ...,
    workflow_service: WorkflowServiceDep = ...,
    ownership_service: WorkflowOwnershipServiceDep = ...,
):
    """Chat with LLM to create or update workflows"""
    try:
        user_id = current_user.id if current_user else None

        if settings_service.get_active_llm_config(user_id) is None:
            await settings_service.load_settings_into_cache(db)

        llm_config = settings_service.get_active_llm_config(user_id)
        model = llm_config.get("model", "gpt-4") if llm_config else "gpt-4"

        iteration_limit = _DEFAULT_CHAT_ITERATION_LIMIT
        user_settings = settings_service.get_user_settings(user_id)
        if user_settings and getattr(user_settings, "iteration_limit", None) is not None:
            try:
                iteration_limit = _clamp_chat_iteration_limit(int(user_settings.iteration_limit))
            except (TypeError, ValueError):
                iteration_limit = _DEFAULT_CHAT_ITERATION_LIMIT

        if request.iteration_limit is not None:
            iteration_limit = _clamp_chat_iteration_limit(int(request.iteration_limit))

        logger.info(f"Chat agent using iteration_limit: {iteration_limit} for user: {user_id or 'anonymous'}")

        client = llm_client_factory.create_client(user_id)
        workflow_context = await get_workflow_context(
            db, request.workflow_id,
            user_id=user_id,
            ownership_service=ownership_service,
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": f"Current workflow context:\n{workflow_context}"},
        ]
        for msg in request.conversation_history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": request.message})

        tools = get_workflow_tools(request.workflow_id)
        workflow_changes = create_changes_dict()
        saved_changes = create_changes_dict()

        assistant_message, all_changes = await run_chat_loop(
            client=client,
            model=model,
            messages=messages,
            tools=tools,
            workflow_changes=workflow_changes,
            saved_changes=saved_changes,
            workflow_context=workflow_context,
            workflow_id=request.workflow_id,
            workflow_service=workflow_service,
            iteration_limit=iteration_limit,
            user_id=user_id,
        )

        return ChatResponse(
            message=assistant_message,
            workflow_changes=all_changes if has_workflow_changes(all_changes) else None,
            workflow_id=request.workflow_id,
        )

    except WorkflowForbiddenError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Configuration error in workflow chat: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in workflow chat: {error_msg}", exc_info=True)
        if is_api_key_error(error_msg, e):
            raise HTTPException(status_code=400, detail=INVALID_API_KEY_MSG)
        raise HTTPException(status_code=500, detail=f"Chat error: {error_msg}")

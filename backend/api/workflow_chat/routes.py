"""Workflow chat API routes"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends

from backend.database.db import get_db
from backend.database.models import UserDB
from backend.auth import get_optional_user
from backend.utils.logger import get_logger
from backend.dependencies import SettingsServiceDep, LLMClientFactoryDep, WorkflowServiceDep
from backend.utils.error_handling import INVALID_API_KEY_MSG, is_api_key_error

from .models import ChatRequest, ChatResponse
from .tools import get_workflow_tools
from .context import get_workflow_context
from .service import create_changes_dict, run_chat_loop, has_workflow_changes

logger = get_logger(__name__)

router = APIRouter(prefix="/workflow-chat", tags=["Workflow Chat"])

SYSTEM_PROMPT = """You are an AI assistant that helps users create and modify workflow graphs. 
You can add nodes, update nodes, delete nodes, and connect nodes together.

Available node types:
- start: Workflow entry point
- end: Workflow completion point
- agent: LLM-powered agent node (requires agent_config with model, system_prompt, etc.)
- condition: Conditional branching (requires condition_config)
- loop: Loop/iteration node (requires loop_config)
- gcp_bucket: GCP Cloud Storage bucket (requires input_config with bucket_name, object_path, mode)
- aws_s3: AWS S3 bucket (requires input_config)
- gcp_pubsub: GCP Pub/Sub (requires input_config)
- local_filesystem: Local file system (requires input_config)

When adding nodes, provide reasonable default positions. When connecting nodes, make sure the connection makes logical sense.

Use the available tools to make changes. Always explain what you're doing before making changes.

After making changes to the workflow, use the save_workflow tool to persist them to the database. This ensures the changes are saved and won't be lost."""


@router.post("/chat", response_model=ChatResponse)
async def chat_with_workflow(
    request: ChatRequest,
    db=Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    settings_service: SettingsServiceDep = ...,
    llm_client_factory: LLMClientFactoryDep = ...,
    workflow_service: WorkflowServiceDep = ...,
):
    """Chat with LLM to create or update workflows"""
    try:
        user_id = current_user.id if current_user else None

        llm_config = settings_service.get_active_llm_config(user_id)
        model = llm_config.get("model", "gpt-4") if llm_config else "gpt-4"

        iteration_limit = 10
        user_settings = settings_service.get_user_settings(user_id)
        if user_settings:
            iteration_limit = user_settings.iteration_limit

        logger.info(f"Chat agent using iteration_limit: {iteration_limit} for user: {user_id or 'anonymous'}")

        client = llm_client_factory.create_client(user_id)
        workflow_context = await get_workflow_context(db, request.workflow_id)

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
        )

        return ChatResponse(
            message=assistant_message,
            workflow_changes=all_changes if has_workflow_changes(all_changes) else None,
            workflow_id=request.workflow_id,
        )

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

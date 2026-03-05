"""Workflow chat API routes"""
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends

from backend.database.db import get_db
from backend.database.models import UserDB
from backend.auth import get_optional_user
from backend.utils.logger import get_logger
from backend.dependencies import SettingsServiceDep, LLMClientFactoryDep, WorkflowServiceDep

from .models import ChatRequest, ChatResponse
from .tools import get_workflow_tools, tool_response
from .context import get_workflow_context
from .handlers import get_tool_handlers

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

        workflow_changes: Dict[str, List[Any]] = {
            "nodes_to_add": [],
            "nodes_to_update": [],
            "nodes_to_delete": [],
            "edges_to_add": [],
            "edges_to_delete": [],
        }
        saved_changes: Dict[str, List[Any]] = {
            "nodes_to_add": [],
            "nodes_to_update": [],
            "nodes_to_delete": [],
            "edges_to_add": [],
            "edges_to_delete": [],
        }

        max_iterations = iteration_limit
        iteration = 0
        assistant_message = None

        while iteration < max_iterations:
            iteration += 1
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.7,
            )

            if not response.choices or len(response.choices) == 0:
                raise ValueError("No response from LLM")

            message = response.choices[0].message
            if not message:
                raise ValueError("Empty message from LLM")

            messages.append(message)

            if not message.tool_calls or len(message.tool_calls) == 0:
                assistant_message = message.content or "I've completed the requested changes to the workflow."
                break

            tool_handlers = get_tool_handlers(
                workflow_changes, saved_changes, workflow_context,
                request.workflow_id, workflow_service,
            )
            tool_messages = []
            for tool_call in message.tool_calls:
                try:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    handler = tool_handlers.get(function_name)
                    if handler:
                        msg = await handler(tool_call, function_args)
                        tool_messages.append(msg)
                    else:
                        tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Unknown function: {function_name}"}))

                except (json.JSONDecodeError, AttributeError) as e:
                    logger.error(f"Error parsing tool call: {e}", exc_info=True)
                    tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Invalid tool call: {str(e)}"}))
                except Exception as tool_error:
                    logger.error(f"Error processing tool call: {tool_error}", exc_info=True)
                    tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Error executing tool: {str(tool_error)}"}))

            messages.extend(tool_messages)

        if iteration >= max_iterations and assistant_message is None:
            assistant_message = f"I've processed your request and made changes to the workflow. (Stopped after {max_iterations} iterations)"
        if assistant_message is None:
            assistant_message = "I've completed the requested changes to the workflow."

        all_changes = {
            "nodes_to_add": workflow_changes["nodes_to_add"] + saved_changes["nodes_to_add"],
            "nodes_to_update": workflow_changes["nodes_to_update"] + saved_changes["nodes_to_update"],
            "nodes_to_delete": workflow_changes["nodes_to_delete"] + saved_changes["nodes_to_delete"],
            "edges_to_add": workflow_changes["edges_to_add"] + saved_changes["edges_to_add"],
            "edges_to_delete": workflow_changes["edges_to_delete"] + saved_changes["edges_to_delete"],
        }

        has_changes = any([
            all_changes["nodes_to_add"],
            all_changes["nodes_to_update"],
            all_changes["nodes_to_delete"],
            all_changes["edges_to_add"],
            all_changes["edges_to_delete"],
        ])
        return ChatResponse(
            message=assistant_message,
            workflow_changes=all_changes if has_changes else None,
            workflow_id=request.workflow_id,
        )

    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Configuration error in workflow chat: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in workflow chat: {error_msg}", exc_info=True)
        if "401" in error_msg or "invalid_api_key" in error_msg or "Incorrect API key" in error_msg or "AuthenticationError" in str(type(e)):
            raise HTTPException(
                status_code=400,
                detail="Invalid API key. Please go to Settings, add an LLM provider with a valid API key, enable it, and click 'Sync Now'. Make sure the provider is enabled (checkbox checked) and has a valid API key.",
            )
        raise HTTPException(status_code=500, detail=f"Chat error: {error_msg}")

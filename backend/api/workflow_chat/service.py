"""
Workflow chat service - tool-calling loop (SRP).
Extracted from routes to reduce route responsibility.
"""
import json
from typing import Any, Dict, List, Optional, Tuple

from .tools import tool_response
from .handlers import get_tool_handlers
from .context import refresh_live_workflow_summary

from backend.utils.logger import get_logger

logger = get_logger(__name__)


def create_changes_dict() -> Dict[str, List[Any]]:
    """Factory for workflow changes structure (DRY)."""
    return {
        "nodes_to_add": [],
        "nodes_to_update": [],
        "nodes_to_delete": [],
        "edges_to_add": [],
        "edges_to_delete": [],
    }


def has_workflow_changes(changes: Dict[str, List[Any]]) -> bool:
    """Check if workflow changes dict has any changes (DRY)."""
    return any(
        changes.get(key)
        for key in ("nodes_to_add", "nodes_to_update", "nodes_to_delete", "edges_to_add", "edges_to_delete")
    )


async def run_chat_loop(
    client: Any,
    model: str,
    messages: List[Dict[str, Any]],
    tools: List[Any],
    workflow_changes: Dict[str, List[Any]],
    saved_changes: Dict[str, List[Any]],
    workflow_context: str,
    workflow_id: Optional[str],
    workflow_service: Any,
    iteration_limit: int,
    user_id: str | None = None,
    workflow_snapshot: Optional[dict] = None,
) -> Tuple[str, Dict[str, List[Any]]]:
    """
    Run the LLM tool-calling loop until completion or iteration limit.
    Returns (assistant_message, all_changes).
    """
    iteration = 0
    assistant_message = None
    live_workflow_summary: Dict[str, str] = {"text": workflow_context}

    while iteration < iteration_limit:
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
            workflow_changes,
            saved_changes,
            live_workflow_summary,
            workflow_snapshot,
            workflow_id,
            workflow_service,
            user_id,
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
                    tool_messages.append(
                        tool_response(tool_call, {"status": "error", "message": f"Unknown function: {function_name}"})
                    )

            except (json.JSONDecodeError, AttributeError) as e:
                logger.error(f"Error parsing tool call: {e}", exc_info=True)
                tool_messages.append(
                    tool_response(tool_call, {"status": "error", "message": f"Invalid tool call: {str(e)}"})
                )
            except Exception as tool_error:
                logger.error(f"Error processing tool call: {tool_error}", exc_info=True)
                tool_messages.append(
                    tool_response(tool_call, {"status": "error", "message": f"Error executing tool: {str(tool_error)}"})
                )
            finally:
                refresh_live_workflow_summary(live_workflow_summary, workflow_snapshot, workflow_changes)

        messages.extend(tool_messages)
        if len(messages) >= 2 and messages[1].get("role") == "system":
            messages[1]["content"] = f"Current workflow context:\n{live_workflow_summary['text']}"

    if iteration >= iteration_limit and assistant_message is None:
        assistant_message = (
            f"I've processed your request and made changes to the workflow. "
            f"(Stopped after {iteration_limit} iterations)"
        )
    if assistant_message is None:
        assistant_message = "I've completed the requested changes to the workflow."

    all_changes = {
        "nodes_to_add": workflow_changes["nodes_to_add"] + saved_changes["nodes_to_add"],
        "nodes_to_update": workflow_changes["nodes_to_update"] + saved_changes["nodes_to_update"],
        "nodes_to_delete": workflow_changes["nodes_to_delete"] + saved_changes["nodes_to_delete"],
        "edges_to_add": workflow_changes["edges_to_add"] + saved_changes["edges_to_add"],
        "edges_to_delete": workflow_changes["edges_to_delete"] + saved_changes["edges_to_delete"],
    }

    return assistant_message, all_changes

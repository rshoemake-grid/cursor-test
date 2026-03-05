"""Workflow chat API routes"""
import json
import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.db import get_db
from backend.database.models import WorkflowDB, UserDB
from backend.auth import get_optional_user
from backend.utils.logger import get_logger
from backend.dependencies import SettingsServiceDep, LLMClientFactoryDep

from .models import ChatRequest, ChatResponse, NODE_CONFIG_KEYS
from .tools import get_workflow_tools, tool_response
from .context import get_workflow_context

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
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    settings_service: SettingsServiceDep = ...,
    llm_client_factory: LLMClientFactoryDep = ...,
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

            tool_messages = []
            for tool_call in message.tool_calls:
                try:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    if function_name == "add_node":
                        if "node_type" not in function_args:
                            tool_messages.append(tool_response(tool_call, {"status": "error", "message": "node_type is required"}))
                            continue
                        node_id = f"{function_args['node_type']}-{uuid.uuid4().hex[:12]}"
                        node_name = function_args.get("name") or f"{function_args['node_type']} Node"
                        new_node = {
                            "id": node_id,
                            "type": function_args["node_type"],
                            "name": node_name,
                            "description": function_args.get("description", ""),
                            "position": function_args.get("position", {"x": 100, "y": 100}),
                            "data": {"label": node_name, "name": node_name, "description": function_args.get("description", "")},
                        }
                        if function_args.get("config"):
                            config_key = NODE_CONFIG_KEYS.get(function_args["node_type"])
                            if config_key:
                                new_node[config_key] = function_args["config"]
                                new_node["data"][config_key] = function_args["config"]
                        workflow_changes["nodes_to_add"].append(new_node)
                        tool_messages.append(tool_response(tool_call, {"status": "success", "action": "added_node", "node_id": node_id}))

                    elif function_name == "update_node":
                        workflow_changes["nodes_to_update"].append({
                            "node_id": function_args["node_id"],
                            "updates": {
                                "name": function_args.get("name"),
                                "description": function_args.get("description"),
                                **function_args.get("config", {}),
                            },
                        })
                        tool_messages.append(tool_response(tool_call, {"status": "success", "action": "updated_node", "node_id": function_args["node_id"]}))

                    elif function_name == "delete_node":
                        if "node_id" not in function_args:
                            tool_messages.append(tool_response(tool_call, {"status": "error", "message": "node_id is required"}))
                            continue
                        workflow_changes["nodes_to_delete"].append(function_args["node_id"])
                        tool_messages.append(tool_response(tool_call, {"status": "success", "action": "deleted_node", "node_id": function_args["node_id"]}))

                    elif function_name == "connect_nodes":
                        if "source_node_id" not in function_args or "target_node_id" not in function_args:
                            tool_messages.append(tool_response(tool_call, {"status": "error", "message": "source_node_id and target_node_id are required"}))
                            continue
                        edge_id = f"e-{function_args['source_node_id']}-{function_args['target_node_id']}"
                        workflow_changes["edges_to_add"].append({
                            "id": edge_id,
                            "source": function_args["source_node_id"],
                            "target": function_args["target_node_id"],
                            "sourceHandle": function_args.get("source_handle"),
                        })
                        tool_messages.append(tool_response(tool_call, {"status": "success", "action": "connected_nodes", "edge_id": edge_id}))

                    elif function_name == "disconnect_nodes":
                        if "source_node_id" not in function_args or "target_node_id" not in function_args:
                            tool_messages.append(tool_response(tool_call, {"status": "error", "message": "source_node_id and target_node_id are required"}))
                            continue
                        workflow_changes["edges_to_delete"].append({
                            "source": function_args["source_node_id"],
                            "target": function_args["target_node_id"],
                        })
                        tool_messages.append(tool_response(tool_call, {"status": "success", "action": "disconnected_nodes"}))

                    elif function_name == "get_workflow_info":
                        tool_messages.append(tool_response(tool_call, workflow_context))

                    elif function_name == "save_workflow":
                        if not request.workflow_id:
                            tool_messages.append(tool_response(tool_call, {"status": "error", "message": "No workflow ID provided. Cannot save workflow."}))
                            continue
                        try:
                            result = await db.execute(select(WorkflowDB).where(WorkflowDB.id == request.workflow_id))
                            db_workflow = result.scalar_one_or_none()
                            if not db_workflow:
                                tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Workflow {request.workflow_id} not found"}))
                                continue

                            current_definition = db_workflow.definition or {}
                            current_nodes = current_definition.get("nodes", [])
                            current_edges = current_definition.get("edges", [])

                            final_nodes = list(current_nodes)
                            final_edges = list(current_edges)
                            final_nodes.extend(workflow_changes["nodes_to_add"])

                            for update in workflow_changes["nodes_to_update"]:
                                nid = update["node_id"]
                                updates = update["updates"]
                                for i, node in enumerate(final_nodes):
                                    if node.get("id") == nid:
                                        final_nodes[i] = {**node, **updates}
                                        if "data" in node:
                                            final_nodes[i]["data"] = {**node.get("data", {}), **updates}
                                        break

                            nodes_to_delete = set(workflow_changes["nodes_to_delete"])
                            final_nodes = [n for n in final_nodes if n.get("id") not in nodes_to_delete]
                            final_edges.extend(workflow_changes["edges_to_add"])

                            edges_to_delete = workflow_changes["edges_to_delete"]
                            final_edges = [
                                e for e in final_edges
                                if not any(
                                    del_edge.get("source") == e.get("source") and del_edge.get("target") == e.get("target")
                                    for del_edge in edges_to_delete
                                )
                            ]

                            if function_args.get("name"):
                                db_workflow.name = function_args["name"]
                            if function_args.get("description") is not None:
                                db_workflow.description = function_args.get("description")

                            db_workflow.definition = {
                                "nodes": final_nodes,
                                "edges": final_edges,
                                "variables": current_definition.get("variables", {}),
                            }
                            db_workflow.updated_at = datetime.utcnow()

                            await db.commit()
                            await db.refresh(db_workflow)

                            tool_messages.append(tool_response(tool_call, {
                                "status": "success",
                                "action": "saved_workflow",
                                "workflow_id": request.workflow_id,
                                "nodes_count": len(final_nodes),
                                "edges_count": len(final_edges),
                            }))

                            saved_changes["nodes_to_add"].extend(workflow_changes["nodes_to_add"])
                            saved_changes["nodes_to_update"].extend(workflow_changes["nodes_to_update"])
                            saved_changes["nodes_to_delete"].extend(workflow_changes["nodes_to_delete"])
                            saved_changes["edges_to_add"].extend(workflow_changes["edges_to_add"])
                            saved_changes["edges_to_delete"].extend(workflow_changes["edges_to_delete"])

                            workflow_changes["nodes_to_add"].clear()
                            workflow_changes["nodes_to_update"].clear()
                            workflow_changes["nodes_to_delete"].clear()
                            workflow_changes["edges_to_add"].clear()
                            workflow_changes["edges_to_delete"].clear()

                        except Exception as save_error:
                            print(f"Error saving workflow: {save_error}")
                            print(traceback.format_exc())
                            tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Error saving workflow: {str(save_error)}"}))

                    else:
                        tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Unknown function: {function_name}"}))

                except (json.JSONDecodeError, AttributeError) as e:
                    print(f"Error parsing tool call: {e}")
                    print(traceback.format_exc())
                    tool_messages.append(tool_response(tool_call, {"status": "error", "message": f"Invalid tool call: {str(e)}"}))
                except Exception as tool_error:
                    print(f"Error processing tool call: {tool_error}")
                    print(traceback.format_exc())
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
        print(f"Configuration error in workflow chat: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = str(e)
        print(f"Error in workflow chat: {error_msg}")
        print(traceback.format_exc())
        if "401" in error_msg or "invalid_api_key" in error_msg or "Incorrect API key" in error_msg or "AuthenticationError" in str(type(e)):
            raise HTTPException(
                status_code=400,
                detail="Invalid API key. Please go to Settings, add an LLM provider with a valid API key, enable it, and click 'Sync Now'. Make sure the provider is enabled (checkbox checked) and has a valid API key.",
            )
        raise HTTPException(status_code=500, detail=f"Chat error: {error_msg}")

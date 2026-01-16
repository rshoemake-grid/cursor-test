"""Workflow chat API routes - allows LLM to create/update workflows via chat"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
import json
import os
import traceback
from openai import AsyncOpenAI

from backend.database.db import get_db
from backend.database.models import WorkflowDB, UserDB
from backend.models.schemas import Node, Edge, NodeType
from backend.auth import get_optional_user
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/workflow-chat", tags=["Workflow Chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    workflow_id: Optional[str] = None
    message: str
    conversation_history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    message: str
    workflow_changes: Optional[Dict[str, Any]] = None  # Contains nodes/edges to add/update/delete
    workflow_id: Optional[str] = None


def get_llm_client(user_id: Optional[str] = None):
    """Get OpenAI client - checks settings store first, then environment variable"""
    from .settings_routes import get_active_llm_config
    
    # Try to get LLM config from settings
    llm_config = get_active_llm_config(user_id)
    
    api_key = None
    base_url = "https://api.openai.com/v1"
    model = "gpt-4"
    
    if llm_config:
        # Use settings configuration
        api_key = llm_config.get("api_key")
        base_url = llm_config.get("base_url", "https://api.openai.com/v1")
        model = llm_config.get("model", "gpt-4")
        print(f"✅ Using LLM config from settings: model={model}, base_url={base_url}, has_key={bool(api_key)}")
    else:
        print(f"⚠️ No LLM config found in settings store for user: {user_id or 'anonymous'}")
    
    # Fallback to environment variable
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            print(f"⚠️ Using API key from environment variable")
    
    if not api_key:
        raise ValueError("OpenAI API key not configured. Please go to Settings, add an LLM provider with a valid API key, enable it, and click 'Sync Now'.")
    
    # Check if API key is still the placeholder
    api_key_lower = api_key.lower()
    if (api_key == "your-api-key-here" or 
        "your-api" in api_key_lower or 
        api_key.startswith("your-api") or
        "*****here" in api_key or
        api_key == "your-api*****here"):
        raise ValueError("Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, enable it, and click 'Sync Now'.")
    
    try:
        return AsyncOpenAI(api_key=api_key, base_url=base_url)
    except Exception as e:
        raise ValueError(f"Failed to initialize OpenAI client: {str(e)}")


def get_workflow_tools(workflow_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Define tools available to the LLM for workflow manipulation"""
    return [
        {
            "type": "function",
            "function": {
                "name": "add_node",
                "description": "Add a new node to the workflow",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_type": {
                            "type": "string",
                            "enum": ["start", "end", "agent", "condition", "loop", "gcp_bucket", "aws_s3", "gcp_pubsub", "local_filesystem"],
                            "description": "Type of node to add"
                        },
                        "name": {
                            "type": "string",
                            "description": "Name/label for the node"
                        },
                        "description": {
                            "type": "string",
                            "description": "Description of what the node does"
                        },
                        "position": {
                            "type": "object",
                            "properties": {
                                "x": {"type": "number"},
                                "y": {"type": "number"}
                            },
                            "description": "Position on canvas (x, y coordinates)"
                        },
                        "config": {
                            "type": "object",
                            "description": "Node-specific configuration (agent_config, condition_config, loop_config, input_config)"
                        }
                    },
                    "required": ["node_type", "name"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "update_node",
                "description": "Update an existing node's properties",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_id": {
                            "type": "string",
                            "description": "ID of the node to update"
                        },
                        "name": {
                            "type": "string",
                            "description": "New name for the node"
                        },
                        "description": {
                            "type": "string",
                            "description": "New description"
                        },
                        "config": {
                            "type": "object",
                            "description": "Updated configuration"
                        }
                    },
                    "required": ["node_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "delete_node",
                "description": "Delete a node from the workflow",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "node_id": {
                            "type": "string",
                            "description": "ID of the node to delete"
                        }
                    },
                    "required": ["node_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "connect_nodes",
                "description": "Connect two nodes with an edge",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "source_node_id": {
                            "type": "string",
                            "description": "ID of the source node"
                        },
                        "target_node_id": {
                            "type": "string",
                            "description": "ID of the target node"
                        },
                        "source_handle": {
                            "type": "string",
                            "description": "Source handle (e.g., 'true', 'false' for condition nodes)"
                        }
                    },
                    "required": ["source_node_id", "target_node_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "disconnect_nodes",
                "description": "Remove a connection between two nodes",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "source_node_id": {
                            "type": "string",
                            "description": "ID of the source node"
                        },
                        "target_node_id": {
                            "type": "string",
                            "description": "ID of the target node"
                        }
                    },
                    "required": ["source_node_id", "target_node_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_workflow_info",
                "description": "Get information about the current workflow (nodes, edges, structure)",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "save_workflow",
                "description": "Save the current workflow to the database. Use this after making changes to persist them. Optionally update the workflow name or description.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Optional: New name for the workflow"
                        },
                        "description": {
                            "type": "string",
                            "description": "Optional: New description for the workflow"
                        }
                    },
                    "required": []
                }
            }
        }
    ]


async def get_workflow_context(db: AsyncSession, workflow_id: Optional[str]) -> str:
    """Get current workflow context as a string for the LLM"""
    if not workflow_id:
        return "No workflow loaded. You can create a new workflow."
    
    result = await db.execute(
        select(WorkflowDB).where(WorkflowDB.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        return f"Workflow {workflow_id} not found."
    
    definition = workflow.definition
    nodes = definition.get("nodes", [])
    edges = definition.get("edges", [])
    
    context = f"Workflow: {workflow.name}\n"
    context += f"Description: {workflow.description or 'None'}\n\n"
    context += f"Nodes ({len(nodes)}):\n"
    for node in nodes:
        node_id = node.get("id", "unknown")
        node_type = node.get("type", "unknown")
        node_name = node.get("name") or node.get("data", {}).get("name") or node_id
        context += f"  - {node_id}: {node_type} ({node_name})\n"
    
    context += f"\nEdges ({len(edges)}):\n"
    for edge in edges:
        source = edge.get("source", "unknown")
        target = edge.get("target", "unknown")
        context += f"  - {source} -> {target}\n"
    
    return context


@router.post("/chat", response_model=ChatResponse)
async def chat_with_workflow(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_optional_user)
):
    """Chat with LLM to create or update workflows"""
    try:
        # Initialize client inside try block - use user's settings if available
        user_id = current_user.id if current_user else None
        
        # Get LLM config to determine model
        from .settings_routes import get_active_llm_config, get_user_settings, LLMSettings
        llm_config = get_active_llm_config(user_id)
        model = llm_config.get("model", "gpt-4") if llm_config else "gpt-4"
        
        # Always query database directly to get latest iteration_limit (cache might be stale)
        uid = user_id if user_id else "anonymous"
        iteration_limit = 10  # default
        user_settings = None
        
        try:
            from sqlalchemy import select
            from ..database.models import SettingsDB
            result = await db.execute(
                select(SettingsDB).where(SettingsDB.user_id == uid)
            )
            settings_db = result.scalar_one_or_none()
            if settings_db and settings_db.settings_data:
                logger.debug(f"Found settings_db for {uid}, settings_data keys: {list(settings_db.settings_data.keys())}")
                logger.debug(f"Raw iteration_limit in settings_data: {settings_db.settings_data.get('iteration_limit', 'NOT FOUND')}")
                print(f"🔍 DEBUG: Found settings_db for {uid}, settings_data keys: {list(settings_db.settings_data.keys())}")
                print(f"🔍 DEBUG: Raw iteration_limit in settings_data: {settings_db.settings_data.get('iteration_limit', 'NOT FOUND')}")
                user_settings = LLMSettings(**settings_db.settings_data)
                iteration_limit = user_settings.iteration_limit
                logger.info(f"Loaded settings from database for {uid}, iteration_limit: {iteration_limit} (type: {type(iteration_limit).__name__})")
                print(f"✅ Loaded settings from database for {uid}, iteration_limit: {iteration_limit} (type: {type(iteration_limit).__name__})")
                # Update cache for future use
                from .settings_routes import _settings_cache
                _settings_cache[uid] = user_settings
            else:
                # Try cache as fallback
                user_settings = get_user_settings(user_id)
                if user_settings:
                    iteration_limit = user_settings.iteration_limit
                    logger.debug(f"Using cached settings for {uid}, iteration_limit: {iteration_limit}")
        except Exception as e:
            logger.error(f"Failed to load settings from database: {e}", exc_info=True)
            # Fallback to cache
            user_settings = get_user_settings(user_id)
            if user_settings:
                iteration_limit = user_settings.iteration_limit
                logger.warning(f"Using cached settings as fallback for {uid}, iteration_limit: {iteration_limit}")
        
        logger.info(f"Chat agent using iteration_limit: {iteration_limit} for user: {user_id or 'anonymous'}")
        print(f"🚀 Chat agent using iteration_limit: {iteration_limit} for user: {user_id or 'anonymous'}")
        
        client = get_llm_client(user_id)
        
        # Get workflow context
        workflow_context = await get_workflow_context(db, request.workflow_id)
        
        # Build system prompt
        system_prompt = """You are an AI assistant that helps users create and modify workflow graphs. 
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
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": f"Current workflow context:\n{workflow_context}"}
        ]
        
        # Add conversation history
        for msg in request.conversation_history:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        # Get tools
        tools = get_workflow_tools(request.workflow_id)
        
        # Initialize workflow changes accumulator
        workflow_changes = {
            "nodes_to_add": [],
            "nodes_to_update": [],
            "nodes_to_delete": [],
            "edges_to_add": [],
            "edges_to_delete": []
        }
        
        # Track changes that were saved (so we can return them even after clearing)
        saved_changes = {
            "nodes_to_add": [],
            "nodes_to_update": [],
            "nodes_to_delete": [],
            "edges_to_add": [],
            "edges_to_delete": []
        }
        
        # Loop until LLM completes (no more tool calls)
        max_iterations = iteration_limit  # Safety limit
        logger.info(f"Starting chat agent loop with max_iterations: {max_iterations} (from iteration_limit: {iteration_limit})")
        print(f"🔄 Starting chat agent loop with max_iterations: {max_iterations} (from iteration_limit: {iteration_limit})")
        iteration = 0
        assistant_message = None
        
        while iteration < max_iterations:
            iteration += 1
            print(f"🔄 Chat agent iteration {iteration}")
            
            # Call LLM with tool support
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.7
            )
            
            if not response.choices or len(response.choices) == 0:
                raise ValueError("No response from LLM")
            
            message = response.choices[0].message
            if not message:
                raise ValueError("Empty message from LLM")
            
            # Add assistant message to conversation
            messages.append(message)
            
            # If no tool calls, we're done
            if not message.tool_calls or len(message.tool_calls) == 0:
                assistant_message = message.content or "I've completed the requested changes to the workflow."
                print(f"✅ Chat agent completed after {iteration} iterations")
                break
            
            # Process tool calls
            tool_messages = []
            for tool_call in message.tool_calls:
                try:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    if function_name == "add_node":
                        # Validate required fields
                        if "node_type" not in function_args:
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({"status": "error", "message": "node_type is required"})
                            })
                            continue
                        
                        node_id = f"{function_args['node_type']}-{uuid.uuid4().hex[:12]}"
                        node_name = function_args.get("name") or f"{function_args['node_type']} Node"
                        new_node = {
                            "id": node_id,
                            "type": function_args["node_type"],
                            "name": node_name,
                            "description": function_args.get("description", ""),
                            "position": function_args.get("position", {"x": 100, "y": 100}),
                            "data": {
                                "label": node_name,
                                "name": node_name,
                                "description": function_args.get("description", "")
                            }
                        }
                        
                        # Add node-specific config
                        if function_args.get("config"):
                            config = function_args["config"]
                            if function_args["node_type"] == "agent":
                                new_node["agent_config"] = config
                                new_node["data"]["agent_config"] = config
                            elif function_args["node_type"] == "condition":
                                new_node["condition_config"] = config
                                new_node["data"]["condition_config"] = config
                            elif function_args["node_type"] == "loop":
                                new_node["loop_config"] = config
                                new_node["data"]["loop_config"] = config
                            elif function_args["node_type"] in ["gcp_bucket", "aws_s3", "gcp_pubsub", "local_filesystem"]:
                                new_node["input_config"] = config
                                new_node["data"]["input_config"] = config
                        
                        workflow_changes["nodes_to_add"].append(new_node)
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": json.dumps({"status": "success", "action": "added_node", "node_id": node_id})
                        })
                    
                    elif function_name == "update_node":
                        workflow_changes["nodes_to_update"].append({
                            "node_id": function_args["node_id"],
                            "updates": {
                                "name": function_args.get("name"),
                                "description": function_args.get("description"),
                                **function_args.get("config", {})
                            }
                        })
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": json.dumps({"status": "success", "action": "updated_node", "node_id": function_args["node_id"]})
                        })
                    
                    elif function_name == "delete_node":
                        if "node_id" not in function_args:
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({"status": "error", "message": "node_id is required"})
                            })
                            continue
                        workflow_changes["nodes_to_delete"].append(function_args["node_id"])
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": json.dumps({"status": "success", "action": "deleted_node", "node_id": function_args["node_id"]})
                        })
                    
                    elif function_name == "connect_nodes":
                        if "source_node_id" not in function_args or "target_node_id" not in function_args:
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({"status": "error", "message": "source_node_id and target_node_id are required"})
                            })
                            continue
                        edge_id = f"e-{function_args['source_node_id']}-{function_args['target_node_id']}"
                        workflow_changes["edges_to_add"].append({
                            "id": edge_id,
                            "source": function_args["source_node_id"],
                            "target": function_args["target_node_id"],
                            "sourceHandle": function_args.get("source_handle")
                        })
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": json.dumps({"status": "success", "action": "connected_nodes", "edge_id": edge_id})
                        })
                    
                    elif function_name == "disconnect_nodes":
                        if "source_node_id" not in function_args or "target_node_id" not in function_args:
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({"status": "error", "message": "source_node_id and target_node_id are required"})
                            })
                            continue
                        workflow_changes["edges_to_delete"].append({
                            "source": function_args["source_node_id"],
                            "target": function_args["target_node_id"]
                        })
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": json.dumps({"status": "success", "action": "disconnected_nodes"})
                        })
                    
                    elif function_name == "get_workflow_info":
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": workflow_context
                        })
                    
                    elif function_name == "save_workflow":
                        if not request.workflow_id:
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({"status": "error", "message": "No workflow ID provided. Cannot save workflow."})
                            })
                            continue
                        
                        try:
                            # Get current workflow from database
                            from sqlalchemy import select
                            from datetime import datetime
                            result = await db.execute(
                                select(WorkflowDB).where(WorkflowDB.id == request.workflow_id)
                            )
                            db_workflow = result.scalar_one_or_none()
                            
                            if not db_workflow:
                                tool_messages.append({
                                    "role": "tool",
                                    "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                    "content": json.dumps({"status": "error", "message": f"Workflow {request.workflow_id} not found"})
                                })
                                continue
                            
                            # Get current workflow state
                            current_definition = db_workflow.definition or {}
                            current_nodes = current_definition.get("nodes", [])
                            current_edges = current_definition.get("edges", [])
                            
                            # Apply accumulated changes to get final state
                            # Start with current nodes/edges
                            final_nodes = list(current_nodes)
                            final_edges = list(current_edges)
                            
                            # Apply node additions
                            final_nodes.extend(workflow_changes["nodes_to_add"])
                            
                            # Apply node updates
                            for update in workflow_changes["nodes_to_update"]:
                                node_id = update["node_id"]
                                updates = update["updates"]
                                for i, node in enumerate(final_nodes):
                                    if node.get("id") == node_id:
                                        final_nodes[i] = {**node, **updates}
                                        # Also update data if present
                                        if "data" in node:
                                            final_nodes[i]["data"] = {**node.get("data", {}), **updates}
                                        break
                            
                            # Apply node deletions
                            nodes_to_delete = set(workflow_changes["nodes_to_delete"])
                            final_nodes = [n for n in final_nodes if n.get("id") not in nodes_to_delete]
                            
                            # Apply edge additions
                            final_edges.extend(workflow_changes["edges_to_add"])
                            
                            # Apply edge deletions
                            edges_to_delete = workflow_changes["edges_to_delete"]
                            final_edges = [
                                e for e in final_edges
                                if not any(
                                    del_edge.get("source") == e.get("source") and
                                    del_edge.get("target") == e.get("target")
                                    for del_edge in edges_to_delete
                                )
                            ]
                            
                            # Update workflow in database
                            if function_args.get("name"):
                                db_workflow.name = function_args["name"]
                            if function_args.get("description") is not None:
                                db_workflow.description = function_args.get("description")
                            
                            db_workflow.definition = {
                                "nodes": final_nodes,
                                "edges": final_edges,
                                "variables": current_definition.get("variables", {})
                            }
                            db_workflow.updated_at = datetime.utcnow()
                            
                            await db.commit()
                            await db.refresh(db_workflow)
                            
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({
                                    "status": "success",
                                    "action": "saved_workflow",
                                    "workflow_id": request.workflow_id,
                                    "nodes_count": len(final_nodes),
                                    "edges_count": len(final_edges)
                                })
                            })
                            
                            # Save the changes before clearing (so we can return them in response)
                            saved_changes["nodes_to_add"].extend(workflow_changes["nodes_to_add"])
                            saved_changes["nodes_to_update"].extend(workflow_changes["nodes_to_update"])
                            saved_changes["nodes_to_delete"].extend(workflow_changes["nodes_to_delete"])
                            saved_changes["edges_to_add"].extend(workflow_changes["edges_to_add"])
                            saved_changes["edges_to_delete"].extend(workflow_changes["edges_to_delete"])
                            
                            # Clear workflow changes since they're now saved
                            workflow_changes["nodes_to_add"].clear()
                            workflow_changes["nodes_to_update"].clear()
                            workflow_changes["nodes_to_delete"].clear()
                            workflow_changes["edges_to_add"].clear()
                            workflow_changes["edges_to_delete"].clear()
                            
                        except Exception as save_error:
                            print(f"Error saving workflow: {save_error}")
                            print(traceback.format_exc())
                            tool_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                                "content": json.dumps({"status": "error", "message": f"Error saving workflow: {str(save_error)}"})
                            })
                    
                    else:
                        # Unknown function name
                        tool_messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                            "content": json.dumps({"status": "error", "message": f"Unknown function: {function_name}"})
                        })
                
                except (json.JSONDecodeError, AttributeError) as e:
                    print(f"Error parsing tool call: {e}")
                    print(traceback.format_exc())
                    tool_messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                        "content": json.dumps({"status": "error", "message": f"Invalid tool call: {str(e)}"})
                    })
                except Exception as tool_error:
                    print(f"Error processing tool call: {tool_error}")
                    print(traceback.format_exc())
                    tool_messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id if hasattr(tool_call, 'id') else str(uuid.uuid4()),
                        "content": json.dumps({"status": "error", "message": f"Error executing tool: {str(tool_error)}"})
                    })
            
            # Add tool results to messages for next iteration
            messages.extend(tool_messages)
            print(f"   Processed {len(tool_messages)} tool calls, continuing loop...")
        
        # If we hit max iterations, use the last message content or provide a summary
        if iteration >= max_iterations:
            print(f"⚠️ Chat agent reached max iterations ({max_iterations})")
            if assistant_message is None:
                assistant_message = f"I've processed your request and made changes to the workflow. (Stopped after {max_iterations} iterations)"
        
        # Ensure we have a message
        if assistant_message is None:
            assistant_message = "I've completed the requested changes to the workflow."
        
        # Combine unsaved changes with saved changes for the response
        all_changes = {
            "nodes_to_add": workflow_changes["nodes_to_add"] + saved_changes["nodes_to_add"],
            "nodes_to_update": workflow_changes["nodes_to_update"] + saved_changes["nodes_to_update"],
            "nodes_to_delete": workflow_changes["nodes_to_delete"] + saved_changes["nodes_to_delete"],
            "edges_to_add": workflow_changes["edges_to_add"] + saved_changes["edges_to_add"],
            "edges_to_delete": workflow_changes["edges_to_delete"] + saved_changes["edges_to_delete"]
        }
        
        return ChatResponse(
            message=assistant_message,
            workflow_changes=all_changes if any([
                all_changes["nodes_to_add"],
                all_changes["nodes_to_update"],
                all_changes["nodes_to_delete"],
                all_changes["edges_to_add"],
                all_changes["edges_to_delete"]
            ]) else None,
            workflow_id=request.workflow_id
        )
        
    except ValueError as e:
        # Handle missing API key or configuration errors
        error_msg = str(e)
        print(f"Configuration error in workflow chat: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        # Log the full error for debugging
        error_msg = str(e)
        print(f"Error in workflow chat: {error_msg}")
        print(traceback.format_exc())
        
        # Check if it's an authentication error
        if "401" in error_msg or "invalid_api_key" in error_msg or "Incorrect API key" in error_msg or "AuthenticationError" in str(type(e)):
            raise HTTPException(
                status_code=400, 
                detail="Invalid API key. Please go to Settings, add an LLM provider with a valid API key, enable it, and click 'Sync Now'. Make sure the provider is enabled (checkbox checked) and has a valid API key."
            )
        
        raise HTTPException(status_code=500, detail=f"Chat error: {error_msg}")


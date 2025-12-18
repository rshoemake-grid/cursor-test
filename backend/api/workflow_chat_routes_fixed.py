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


def get_llm_client():
    """Get OpenAI client"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set. Please set it in your environment or configure it in Settings.")
    try:
        return AsyncOpenAI(api_key=api_key)
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
        # Initialize client inside try block
        client = get_llm_client()
        
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

Use the available tools to make changes. Always explain what you're doing before making changes."""
        
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
        
        # Call LLM with tool support
        response = await client.chat.completions.create(
            model="gpt-4",
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
        
        workflow_changes = {
            "nodes_to_add": [],
            "nodes_to_update": [],
            "nodes_to_delete": [],
            "edges_to_add": [],
            "edges_to_delete": []
        }
        
        # Process tool calls
        if message.tool_calls:
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
            
            # Get final response message
            messages.append(message)
            messages.extend(tool_messages)
            
            try:
                final_response = await client.chat.completions.create(
                    model="gpt-4",
                    messages=messages,
                    temperature=0.7
                )
                
                if not final_response.choices or len(final_response.choices) == 0:
                    assistant_message = "I've made the requested changes to the workflow."
                else:
                    assistant_message = final_response.choices[0].message.content or "I've made the requested changes to the workflow."
            except Exception as final_error:
                print(f"Error getting final response: {final_error}")
                print(traceback.format_exc())
                assistant_message = "I've processed your request and made changes to the workflow."
        else:
            assistant_message = message.content or "I understand. How can I help you modify the workflow?"
        
        return ChatResponse(
            message=assistant_message,
            workflow_changes=workflow_changes if message.tool_calls else None,
            workflow_id=request.workflow_id
        )
        
    except ValueError as e:
        # Handle missing API key or configuration errors
        print(f"Configuration error in workflow chat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Configuration error: {str(e)}")
    except Exception as e:
        # Log the full error for debugging
        print(f"Error in workflow chat: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")



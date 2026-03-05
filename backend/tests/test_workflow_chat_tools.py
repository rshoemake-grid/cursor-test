"""Unit tests for workflow_chat tools and tool_response"""
import json
from unittest.mock import Mock

from backend.api.workflow_chat.tools import tool_response, get_workflow_tools


def test_tool_response_with_dict():
    """Test tool_response with dict content (json.dumps)"""
    tool_call = Mock()
    tool_call.id = "call_123"

    result = tool_response(tool_call, {"status": "success", "action": "added_node"})

    assert result["role"] == "tool"
    assert result["tool_call_id"] == "call_123"
    assert json.loads(result["content"]) == {"status": "success", "action": "added_node"}


def test_tool_response_with_string():
    """Test tool_response with string content (passed through)"""
    tool_call = Mock()
    tool_call.id = "call_456"

    result = tool_response(tool_call, "Plain text response")

    assert result["role"] == "tool"
    assert result["tool_call_id"] == "call_456"
    assert result["content"] == "Plain text response"


def test_tool_response_without_tool_call_id():
    """Test tool_response when tool_call has no id (uses uuid)"""
    tool_call = Mock(spec=[])  # No id attribute

    result = tool_response(tool_call, {"error": "test"})

    assert result["role"] == "tool"
    assert "tool_call_id" in result
    assert len(result["tool_call_id"]) == 36  # UUID format
    assert json.loads(result["content"]) == {"error": "test"}


def test_get_workflow_tools_returns_list():
    """Test get_workflow_tools returns list of tool definitions"""
    tools = get_workflow_tools()

    assert isinstance(tools, list)
    assert len(tools) >= 7


def test_get_workflow_tools_has_expected_functions():
    """Test get_workflow_tools includes expected tool names"""
    tools = get_workflow_tools()
    names = [t["function"]["name"] for t in tools if t.get("type") == "function"]

    assert "add_node" in names
    assert "update_node" in names
    assert "delete_node" in names
    assert "connect_nodes" in names
    assert "disconnect_nodes" in names
    assert "get_workflow_info" in names
    assert "save_workflow" in names


def test_get_workflow_tools_add_node_has_required_params():
    """Test add_node tool has node_type and name required"""
    tools = get_workflow_tools()
    add_node = next(t for t in tools if t["function"]["name"] == "add_node")

    assert "node_type" in add_node["function"]["parameters"]["required"]
    assert "name" in add_node["function"]["parameters"]["required"]
    assert "node_type" in add_node["function"]["parameters"]["properties"]
    assert "enum" in add_node["function"]["parameters"]["properties"]["node_type"]

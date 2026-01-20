"""
Tests for ToolRegistry class.
"""
import pytest
from backend.tools.registry import ToolRegistry
from backend.tools.base import BaseTool, ToolParameter


class TestTool(BaseTool):
    """Test tool for registry testing"""
    
    @property
    def name(self) -> str:
        return "test_tool"
    
    @property
    def description(self) -> str:
        return "A test tool for registry"
    
    async def execute(self, **kwargs):
        return {"result": "test", "params": kwargs}


@pytest.mark.asyncio
async def test_tool_registry_get_tool():
    """Test getting a registered tool"""
    tool = ToolRegistry.get_tool("calculator")
    assert tool is not None
    assert tool.name == "calculator"


@pytest.mark.asyncio
async def test_tool_registry_get_unknown_tool():
    """Test that unknown tool raises error"""
    with pytest.raises(ValueError) as exc_info:
        ToolRegistry.get_tool("unknown_tool")
    
    assert "not found in registry" in str(exc_info.value)


@pytest.mark.asyncio
async def test_tool_registry_get_all_tools():
    """Test getting all registered tools"""
    tools = ToolRegistry.get_all_tools()
    assert len(tools) > 0
    assert all(isinstance(tool, BaseTool) for tool in tools)


@pytest.mark.asyncio
async def test_tool_registry_register_tool():
    """Test registering a custom tool"""
    # Register test tool
    ToolRegistry.register_tool(TestTool)
    
    # Get the tool
    tool = ToolRegistry.get_tool("test_tool")
    assert isinstance(tool, TestTool)
    
    # Verify it's in all tools
    all_tools = ToolRegistry.get_all_tools()
    tool_names = [t.name for t in all_tools]
    assert "test_tool" in tool_names


@pytest.mark.asyncio
async def test_tool_registry_get_tool_definitions():
    """Test getting tool definitions"""
    definitions = ToolRegistry.get_tool_definitions()
    assert len(definitions) > 0
    assert all("type" in d for d in definitions)
    assert all(d["type"] == "function" for d in definitions)


@pytest.mark.asyncio
async def test_tool_registry_get_tool_definitions_specific():
    """Test getting definitions for specific tools"""
    definitions = ToolRegistry.get_tool_definitions(["calculator"])
    assert len(definitions) == 1
    assert definitions[0]["function"]["name"] == "calculator"


@pytest.mark.asyncio
async def test_tool_registry_execute_tool():
    """Test executing a tool"""
    result = await ToolRegistry.execute_tool("calculator", expression="2 + 2")
    assert result is not None


@pytest.mark.asyncio
async def test_tool_registry_tool_instances_cached():
    """Test that tool instances are cached"""
    tool1 = ToolRegistry.get_tool("calculator")
    tool2 = ToolRegistry.get_tool("calculator")
    
    # Should return same instance
    assert tool1 is tool2


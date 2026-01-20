"""
Tests for BaseTool class.
"""
import pytest
from backend.tools.base import BaseTool, ToolParameter, ToolDefinition


class ConcreteTool(BaseTool):
    """Concrete implementation of BaseTool for testing"""
    
    @property
    def name(self) -> str:
        return "test_tool"
    
    @property
    def description(self) -> str:
        return "A test tool"
    
    @property
    def parameters(self):
        return [
            ToolParameter(
                name="param1",
                type="string",
                description="First parameter",
                required=True
            ),
            ToolParameter(
                name="param2",
                type="number",
                description="Second parameter",
                required=False,
                default=10
            )
        ]
    
    async def execute(self, **kwargs):
        return {"result": kwargs.get("param1", "default")}


@pytest.mark.asyncio
async def test_base_tool_name_property():
    """Test that name property is abstract"""
    with pytest.raises(TypeError):
        BaseTool()


@pytest.mark.asyncio
async def test_base_tool_get_definition():
    """Test getting tool definition"""
    tool = ConcreteTool()
    definition = tool.get_definition()
    
    assert isinstance(definition, ToolDefinition)
    assert definition.name == "test_tool"
    assert definition.description == "A test tool"
    assert len(definition.parameters) == 2


@pytest.mark.asyncio
async def test_base_tool_get_openai_function_def():
    """Test getting OpenAI function definition format"""
    tool = ConcreteTool()
    func_def = tool.get_openai_function_def()
    
    assert func_def["type"] == "function"
    assert func_def["function"]["name"] == "test_tool"
    assert func_def["function"]["description"] == "A test tool"
    assert "param1" in func_def["function"]["parameters"]["properties"]
    assert "param2" in func_def["function"]["parameters"]["properties"]
    assert "param1" in func_def["function"]["parameters"]["required"]
    assert "param2" not in func_def["function"]["parameters"]["required"]


@pytest.mark.asyncio
async def test_base_tool_get_openai_function_def_with_default():
    """Test OpenAI function def includes default values"""
    tool = ConcreteTool()
    func_def = tool.get_openai_function_def()
    
    param2 = func_def["function"]["parameters"]["properties"]["param2"]
    assert param2["default"] == 10


@pytest.mark.asyncio
async def test_base_tool_execute():
    """Test tool execution"""
    tool = ConcreteTool()
    result = await tool.execute(param1="test_value")
    
    assert result == {"result": "test_value"}


@pytest.mark.asyncio
async def test_base_tool_no_parameters():
    """Test tool with no parameters"""
    class NoParamTool(BaseTool):
        @property
        def name(self) -> str:
            return "no_param_tool"
        
        @property
        def description(self) -> str:
            return "Tool with no parameters"
        
        async def execute(self, **kwargs):
            return {"result": "success"}
    
    tool = NoParamTool()
    definition = tool.get_definition()
    assert len(definition.parameters) == 0
    
    func_def = tool.get_openai_function_def()
    assert len(func_def["function"]["parameters"]["properties"]) == 0
    assert len(func_def["function"]["parameters"]["required"]) == 0


@pytest.mark.asyncio
async def test_tool_parameter_model():
    """Test ToolParameter model"""
    param = ToolParameter(
        name="test_param",
        type="string",
        description="Test parameter",
        required=True,
        default=None
    )
    
    assert param.name == "test_param"
    assert param.type == "string"
    assert param.description == "Test parameter"
    assert param.required is True
    assert param.default is None


@pytest.mark.asyncio
async def test_tool_definition_model():
    """Test ToolDefinition model"""
    definition = ToolDefinition(
        name="test_tool",
        description="Test tool description",
        parameters=[
            ToolParameter(name="param1", type="string", description="Param 1")
        ]
    )
    
    assert definition.name == "test_tool"
    assert definition.description == "Test tool description"
    assert len(definition.parameters) == 1


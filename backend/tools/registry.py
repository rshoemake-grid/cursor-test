from typing import Dict, Type, List
from .base import BaseTool
from .builtin_tools import (
    CalculatorTool,
    WebSearchTool,
    PythonExecutorTool,
    FileReaderTool
)


class ToolRegistry:
    """Registry for available tools"""
    
    _tools: Dict[str, Type[BaseTool]] = {
        "calculator": CalculatorTool,
        "web_search": WebSearchTool,
        "python_executor": PythonExecutorTool,
        "file_reader": FileReaderTool,
    }
    
    _instances: Dict[str, BaseTool] = {}
    
    @classmethod
    def register_tool(cls, tool_class: Type[BaseTool]):
        """Register a new tool"""
        instance = tool_class()
        cls._tools[instance.name] = tool_class
        cls._instances[instance.name] = instance
    
    @classmethod
    def get_tool(cls, tool_name: str) -> BaseTool:
        """Get a tool instance by name"""
        if tool_name not in cls._instances:
            if tool_name in cls._tools:
                cls._instances[tool_name] = cls._tools[tool_name]()
            else:
                raise ValueError(f"Tool '{tool_name}' not found in registry")
        
        return cls._instances[tool_name]
    
    @classmethod
    def get_all_tools(cls) -> List[BaseTool]:
        """Get all registered tools"""
        return [cls.get_tool(name) for name in cls._tools.keys()]
    
    @classmethod
    def get_tool_definitions(cls, tool_names: List[str] = None) -> List[Dict]:
        """Get OpenAI function definitions for specified tools"""
        if tool_names is None:
            tool_names = list(cls._tools.keys())
        
        definitions = []
        for name in tool_names:
            try:
                tool = cls.get_tool(name)
                definitions.append(tool.get_openai_function_def())
            except ValueError:
                pass
        
        return definitions
    
    @classmethod
    async def execute_tool(cls, tool_name: str, **kwargs):
        """Execute a tool with given parameters"""
        tool = cls.get_tool(tool_name)
        return await tool.execute(**kwargs)


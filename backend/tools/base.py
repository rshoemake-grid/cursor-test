from abc import ABC, abstractmethod
from typing import Any, Dict, List
from pydantic import BaseModel, Field


class ToolParameter(BaseModel):
    """Definition of a tool parameter"""
    name: str
    type: str  # string, number, boolean, array, object
    description: str
    required: bool = True
    default: Any = None


class ToolDefinition(BaseModel):
    """Complete tool definition for LLM function calling"""
    name: str
    description: str
    parameters: List[ToolParameter] = Field(default_factory=list)


class BaseTool(ABC):
    """Base class for all tools"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name"""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Tool description"""
        pass
    
    @property
    def parameters(self) -> List[ToolParameter]:
        """Tool parameters (override if tool has parameters)"""
        return []
    
    def get_definition(self) -> ToolDefinition:
        """Get complete tool definition"""
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=self.parameters
        )
    
    def get_openai_function_def(self) -> Dict[str, Any]:
        """Get tool definition in OpenAI function calling format"""
        properties = {}
        required = []
        
        for param in self.parameters:
            properties[param.name] = {
                "type": param.type,
                "description": param.description
            }
            if param.default is not None:
                properties[param.name]["default"] = param.default
            if param.required:
                required.append(param.name)
        
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            }
        }
    
    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """Execute the tool with given parameters"""
        pass


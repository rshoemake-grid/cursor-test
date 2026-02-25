"""
Google ADK Agent - Wrapper around Google Agent Development Kit
Supports ADK agent configuration and execution
"""
from typing import Any, Dict, Optional, Callable, Awaitable
import os
import asyncio
from .base import BaseAgent
from ..models.schemas import Node, ADKAgentConfig
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ADKAgent(BaseAgent):
    """Agent that uses Google ADK for execution"""
    
    def __init__(
        self, 
        node: Node, 
        llm_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        log_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None
    ):
        super().__init__(node, log_callback=log_callback)
        
        # Check if ADK is available
        try:
            from google.adk.agents.llm_agent import Agent as ADKAgentClass
            self._adk_available = True
            self._ADKAgentClass = ADKAgentClass
        except ImportError:
            self._adk_available = False
            logger.warning(
                "Google ADK not available. Install with: pip install google-adk"
            )
        
        # Get agent config
        agent_config = node.agent_config
        if not agent_config:
            raise ValueError(
                f"Node {node.id} requires agent_config for ADK agent. "
                "Please configure the agent settings in the node properties."
            )
        
        # Validate ADK config is present
        if not agent_config.adk_config:
            raise ValueError(
                f"Node {node.id} requires adk_config for ADK agent type. "
                "Please configure ADK settings in the node properties."
            )
        
        self.config = agent_config
        self.adk_config = agent_config.adk_config
        self.llm_config = llm_config or self._get_fallback_config()
        self.user_id = user_id
        
        # Initialize ADK agent
        if self._adk_available:
            self._init_adk_agent()
        else:
            logger.warning("ADK agent initialized but ADK library not available")
    
    def _get_fallback_config(self) -> Optional[Dict[str, Any]]:
        """Fallback to environment variables if no config provided"""
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if gemini_key:
            return {
                "type": "gemini",
                "api_key": gemini_key,
                "base_url": "https://generativelanguage.googleapis.com/v1beta",
                "model": "gemini-2.5-flash"
            }
        return None
    
    def _init_adk_agent(self):
        """Initialize the ADK agent instance"""
        if not self._adk_available:
            raise RuntimeError("ADK library not available")
        
        # Get model from agent config
        model = self.config.model
        
        # Get instruction (system prompt) - prefer ADK instruction, fallback to system_prompt
        instruction = (
            self.adk_config.instruction 
            or self.config.system_prompt 
            or "You are a helpful assistant."
        )
        
        # Get agent name
        agent_name = self.adk_config.name or self.node.name or f"agent_{self.node_id}"
        
        # Get description
        description = self.adk_config.description or self.node.description or ""
        
        # Load ADK tools
        adk_tools = self._load_adk_tools(self.adk_config.adk_tools)
        
        # Initialize ADK agent
        try:
            self.adk_agent = self._ADKAgentClass(
                model=model,
                name=agent_name,
                description=description,
                instruction=instruction,
                tools=adk_tools
            )
            logger.info(f"ADK agent '{agent_name}' initialized with model '{model}'")
        except Exception as e:
            logger.error(f"Failed to initialize ADK agent: {e}", exc_info=True)
            raise RuntimeError(f"Failed to initialize ADK agent: {str(e)}") from e
    
    def _load_adk_tools(self, tool_names: list) -> list:
        """Load ADK tools by name"""
        if not self._adk_available:
            return []
        
        tools = []
        
        for tool_name in tool_names:
            try:
                tool = self._get_adk_tool(tool_name)
                if tool:
                    tools.append(tool)
                    logger.debug(f"Loaded ADK tool: {tool_name}")
                else:
                    logger.warning(f"ADK tool '{tool_name}' not found or not supported")
            except Exception as e:
                logger.warning(f"Failed to load ADK tool '{tool_name}': {e}")
        
        return tools
    
    def _get_adk_tool(self, tool_name: str):
        """Get ADK tool by name"""
        if not self._adk_available:
            return None
        
        # Map tool names to ADK tool classes/functions
        tool_mapping = {
            "google_search": self._get_google_search_tool,
            "load_web_page": self._get_load_web_page_tool,
            "enterprise_web_search": self._get_enterprise_web_search_tool,
            # Add more ADK tools as needed
        }
        
        getter = tool_mapping.get(tool_name)
        if getter:
            return getter()
        
        return None
    
    def _get_google_search_tool(self):
        """Get Google Search ADK tool"""
        try:
            from google.adk.tools.search import google_search
            return google_search
        except ImportError:
            logger.warning("google_search tool not available in ADK")
            return None
    
    def _get_load_web_page_tool(self):
        """Get Load Web Page ADK tool"""
        try:
            from google.adk.tools.web import load_web_page
            return load_web_page
        except ImportError:
            logger.warning("load_web_page tool not available in ADK")
            return None
    
    def _get_enterprise_web_search_tool(self):
        """Get Enterprise Web Search ADK tool"""
        try:
            from google.adk.tools.search import enterprise_web_search
            return enterprise_web_search
        except ImportError:
            logger.warning("enterprise_web_search tool not available in ADK")
            return None
    
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """Execute the ADK agent with given inputs"""
        if not self._adk_available:
            raise RuntimeError(
                "ADK library not available. Install with: pip install google-adk"
            )
        
        self.validate_inputs(inputs)
        
        # Log execution start
        if self.log_callback:
            try:
                asyncio.create_task(
                    self.log_callback("INFO", self.node_id, f"Executing ADK agent '{self.adk_config.name}'")
                )
            except Exception:
                pass
        
        logger.info(f"Executing ADK agent '{self.adk_config.name}' with inputs: {list(inputs.keys())}")
        
        # Convert inputs to ADK format
        # ADK agents typically expect a string message or structured input
        adk_input = self._convert_inputs_to_adk_format(inputs)
        
        try:
            # Execute ADK agent
            # Note: ADK agent.run() may be async or sync depending on version
            if hasattr(self.adk_agent, 'run'):
                # Try async first
                if asyncio.iscoroutinefunction(self.adk_agent.run):
                    result = await self.adk_agent.run(adk_input)
                else:
                    # Sync version - run in executor
                    loop = asyncio.get_event_loop()
                    result = await loop.run_in_executor(None, self.adk_agent.run, adk_input)
            elif hasattr(self.adk_agent, 'execute'):
                # Alternative method name
                if asyncio.iscoroutinefunction(self.adk_agent.execute):
                    result = await self.adk_agent.execute(adk_input)
                else:
                    loop = asyncio.get_event_loop()
                    result = await loop.run_in_executor(None, self.adk_agent.execute, adk_input)
            else:
                raise RuntimeError("ADK agent does not have 'run' or 'execute' method")
            
            # Convert result back to workflow format
            output = self._convert_adk_result_to_output(result)
            
            logger.info(f"ADK agent execution completed, output type: {type(output)}")
            return output
            
        except Exception as e:
            logger.error(f"ADK agent execution failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise
    
    def _convert_inputs_to_adk_format(self, inputs: Dict[str, Any]) -> str:
        """Convert workflow inputs to ADK format (typically a string message)"""
        # Build a message from inputs
        # ADK agents typically expect a string message
        if len(inputs) == 1 and "data" in inputs:
            # Single "data" input - use directly
            return str(inputs["data"])
        elif len(inputs) == 1:
            # Single input - use its value
            return str(list(inputs.values())[0])
        else:
            # Multiple inputs - combine into a message
            parts = []
            for key, value in inputs.items():
                parts.append(f"{key}: {value}")
            return "\n".join(parts)
    
    def _convert_adk_result_to_output(self, result: Any) -> Dict[str, Any]:
        """Convert ADK result to workflow output format"""
        # ADK results can be various types
        if isinstance(result, dict):
            # If already a dict, check for common ADK response formats
            if "output" in result:
                return result
            elif "content" in result:
                return {"output": result["content"]}
            elif "text" in result:
                return {"output": result["text"]}
            else:
                # Return as-is, wrapped
                return {"output": result}
        elif isinstance(result, str):
            return {"output": result}
        else:
            # Convert to string
            return {"output": str(result)}

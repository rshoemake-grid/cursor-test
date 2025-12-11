from typing import Any, Dict, List, Optional
import os
import json
from openai import AsyncOpenAI
from .base import BaseAgent
from ..models.schemas import Node
from ..memory import MemoryManager
from ..tools import ToolRegistry


class LLMAgentV2(BaseAgent):
    """
    Enhanced LLM agent with memory and tool calling support
    Features:
    - Short-term conversation memory
    - Long-term vector memory
    - Tool/function calling
    - Context-aware prompting
    """
    
    def __init__(self, node: Node, use_memory: bool = False, use_tools: bool = False):
        super().__init__(node)
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        self.client = AsyncOpenAI(api_key=api_key)
        
        if not node.agent_config:
            raise ValueError(f"Node {node.id} requires agent_config")
        
        self.config = node.agent_config
        
        # Initialize memory if enabled
        self.memory = None
        if use_memory:
            self.memory = MemoryManager(
                agent_id=node.id,
                max_conversation_messages=10,
                use_vector_memory=True
            )
        
        # Initialize tools if enabled
        self.use_tools = use_tools
        self.available_tools = []
        if use_tools and self.config.tools:
            self.available_tools = ToolRegistry.get_tool_definitions(self.config.tools)
        
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """Execute the LLM agent with memory and tool support"""
        self.validate_inputs(inputs)
        
        # Build the prompt from inputs
        user_message = self._build_user_message(inputs)
        
        # Build messages array
        messages = []
        
        # Add system prompt
        system_prompt = self.config.system_prompt or "You are a helpful assistant."
        
        # Enhance with memory context if available
        if self.memory:
            memory_context = self.memory.get_context_for_prompt(
                user_message,
                include_conversation=True,
                include_longterm=True
            )
            if memory_context:
                system_prompt += f"\n\nContext from memory:\n{memory_context}"
        
        messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call OpenAI API with tool support
        try:
            # Initial API call
            response = await self._call_llm(messages)
            
            # Handle tool calls if present
            if response.choices[0].message.tool_calls:
                messages.append(response.choices[0].message)
                
                # Execute tools
                for tool_call in response.choices[0].message.tool_calls:
                    tool_result = await self._execute_tool_call(tool_call)
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(tool_result)
                    })
                
                # Second API call with tool results
                response = await self._call_llm(messages)
            
            result = response.choices[0].message.content
            
            # Save to memory if enabled
            if self.memory:
                self.memory.add_interaction(
                    user_message,
                    result,
                    metadata={"node_id": self.node_id},
                    save_to_longterm=True
                )
            
            return result
            
        except Exception as e:
            raise RuntimeError(f"LLM execution failed: {str(e)}")
    
    async def _call_llm(self, messages: List[Dict]) -> Any:
        """Call OpenAI API"""
        kwargs = {
            "model": self.config.model,
            "messages": messages,
            "temperature": self.config.temperature,
        }
        
        if self.config.max_tokens:
            kwargs["max_tokens"] = self.config.max_tokens
        
        if self.available_tools:
            kwargs["tools"] = self.available_tools
            kwargs["tool_choice"] = "auto"
        
        return await self.client.chat.completions.create(**kwargs)
    
    async def _execute_tool_call(self, tool_call) -> Dict[str, Any]:
        """Execute a tool call"""
        try:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            result = await ToolRegistry.execute_tool(function_name, **function_args)
            return result
        
        except Exception as e:
            return {"error": str(e)}
    
    def _build_user_message(self, inputs: Dict[str, Any]) -> str:
        """Build user message from inputs"""
        if len(inputs) == 1:
            return str(list(inputs.values())[0])
        else:
            parts = []
            for key, value in inputs.items():
                parts.append(f"{key}: {value}")
            return "\n".join(parts)


from typing import Any, Dict
import os
from openai import AsyncOpenAI
from .base import BaseAgent
from ..models.schemas import Node


class LLMAgent(BaseAgent):
    """Agent that uses LLM for processing"""
    
    def __init__(self, node: Node):
        super().__init__(node)
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        self.client = AsyncOpenAI(api_key=api_key)
        
        if not node.agent_config:
            raise ValueError(f"Node {node.id} requires agent_config")
        
        self.config = node.agent_config
        
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """Execute the LLM agent"""
        self.validate_inputs(inputs)
        
        # Build the prompt from inputs
        user_message = self._build_user_message(inputs)
        
        messages = []
        if self.config.system_prompt:
            messages.append({
                "role": "system",
                "content": self.config.system_prompt
            })
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call OpenAI API
        try:
            response = await self.client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens
            )
            
            result = response.choices[0].message.content
            return result
            
        except Exception as e:
            raise RuntimeError(f"LLM execution failed: {str(e)}")
    
    def _build_user_message(self, inputs: Dict[str, Any]) -> str:
        """Build user message from inputs"""
        if len(inputs) == 1:
            # Single input - use its value directly
            return str(list(inputs.values())[0])
        else:
            # Multiple inputs - format as key-value pairs
            parts = []
            for key, value in inputs.items():
                parts.append(f"{key}: {value}")
            return "\n".join(parts)


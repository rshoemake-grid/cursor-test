"""
Unified LLM Agent - Supports OpenAI, Anthropic, and Custom providers
"""
from typing import Any, Dict, Optional
import os
import httpx
from .base import BaseAgent
from ..models.schemas import Node


class UnifiedLLMAgent(BaseAgent):
    """Agent that uses configured LLM provider for processing"""
    
    def __init__(self, node: Node, llm_config: Optional[Dict[str, Any]] = None):
        super().__init__(node)
        
        if not node.agent_config:
            raise ValueError(f"Node {node.id} requires agent_config")
        
        self.config = node.agent_config
        self.llm_config = llm_config or self._get_fallback_config()
        
        if not self.llm_config:
            raise ValueError(
                "No LLM configuration found. Please configure an LLM provider in Settings "
                "or set OPENAI_API_KEY environment variable."
            )
        
        # Validate API key is not a placeholder
        api_key = self.llm_config.get("api_key", "")
        if api_key:
            api_key_lower = api_key.lower()
            if (api_key == "your-api-key-here" or 
                "your-api" in api_key_lower or 
                api_key.startswith("your-api") or
                "*****here" in api_key or
                api_key == "your-api*****here"):
                raise ValueError(
                    "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                    "enable it, and click 'Sync Now'. The API key cannot be a placeholder."
                )
    
    def _get_fallback_config(self) -> Optional[Dict[str, Any]]:
        """Fallback to environment variables if no config provided"""
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            return {
                "type": "openai",
                "api_key": openai_key,
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-4"
            }
        
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            return {
                "type": "anthropic",
                "api_key": anthropic_key,
                "base_url": "https://api.anthropic.com/v1",
                "model": "claude-3-5-sonnet-20241022"
            }
        
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            return {
                "type": "gemini",
                "api_key": gemini_key,
                "base_url": "https://generativelanguage.googleapis.com/v1beta",
                "model": "gemini-2.5-flash"
            }
        
        return None
    
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """Execute the LLM agent with configured provider"""
        self.validate_inputs(inputs)
        
        # Build the prompt from inputs
        user_message = self._build_user_message(inputs)
        
        # Use model from agent config if specified, otherwise from LLM config
        model = self.config.model or self.llm_config["model"]
        
        provider_type = self.llm_config["type"]
        
        if provider_type == "openai":
            return await self._execute_openai(user_message, model)
        elif provider_type == "anthropic":
            return await self._execute_anthropic(user_message, model)
        elif provider_type == "gemini":
            return await self._execute_gemini(user_message, model)
        elif provider_type == "custom":
            return await self._execute_custom(user_message, model)
        else:
            raise ValueError(f"Unknown provider type: {provider_type}")
    
    async def _execute_openai(self, user_message: str, model: str) -> str:
        """Execute using OpenAI API"""
        base_url = self.llm_config.get("base_url", "https://api.openai.com/v1")
        api_key = self.llm_config["api_key"]
        
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
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens
                }
            )
            
            if response.status_code != 200:
                raise RuntimeError(
                    f"OpenAI API request failed with status {response.status_code}: {response.text}"
                )
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def _execute_anthropic(self, user_message: str, model: str) -> str:
        """Execute using Anthropic API"""
        base_url = self.llm_config.get("base_url", "https://api.anthropic.com/v1")
        api_key = self.llm_config["api_key"]
        
        # Anthropic API format
        messages = [{
            "role": "user",
            "content": user_message
        }]
        
        request_data = {
            "model": model,
            "messages": messages,
            "max_tokens": self.config.max_tokens or 1024,
            "temperature": self.config.temperature
        }
        
        # Add system prompt if provided
        if self.config.system_prompt:
            request_data["system"] = self.config.system_prompt
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{base_url}/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json=request_data
            )
            
            if response.status_code != 200:
                raise RuntimeError(
                    f"Anthropic API request failed with status {response.status_code}: {response.text}"
                )
            
            data = response.json()
            return data["content"][0]["text"]
    
    async def _execute_gemini(self, user_message: str, model: str) -> str:
        """Execute using Google Gemini API"""
        base_url = self.llm_config.get("base_url", "https://generativelanguage.googleapis.com/v1beta")
        api_key = self.llm_config["api_key"]
        
        # Gemini API format
        contents = [{
            "parts": [{"text": user_message}]
        }]
        
        request_data = {
            "contents": contents
        }
        
        # Add system instruction if provided
        if self.config.system_prompt:
            request_data["systemInstruction"] = {
                "parts": [{"text": self.config.system_prompt}]
            }
        
        # Add generation config
        generation_config = {}
        if self.config.temperature:
            generation_config["temperature"] = self.config.temperature
        if self.config.max_tokens:
            generation_config["maxOutputTokens"] = self.config.max_tokens
        
        if generation_config:
            request_data["generationConfig"] = generation_config
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{base_url}/models/{model}:generateContent?key={api_key}",
                headers={
                    "Content-Type": "application/json"
                },
                json=request_data
            )
            
            if response.status_code != 200:
                raise RuntimeError(
                    f"Gemini API request failed with status {response.status_code}: {response.text}"
                )
            
            data = response.json()
            
            # Extract text from Gemini response
            if "candidates" in data and len(data["candidates"]) > 0:
                candidate = data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if len(parts) > 0 and "text" in parts[0]:
                        return parts[0]["text"]
            
            raise RuntimeError(f"Unexpected Gemini API response format: {data}")
    
    async def _execute_custom(self, user_message: str, model: str) -> str:
        """Execute using custom OpenAI-compatible API"""
        base_url = self.llm_config.get("base_url")
        if not base_url:
            raise ValueError("base_url is required for custom providers")
        
        api_key = self.llm_config["api_key"]
        
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
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens
                }
            )
            
            if response.status_code != 200:
                raise RuntimeError(
                    f"Custom API request failed with status {response.status_code}: {response.text}"
                )
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
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


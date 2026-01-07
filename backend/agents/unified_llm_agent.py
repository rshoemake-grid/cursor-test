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
    
    def __init__(self, node: Node, llm_config: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None):
        super().__init__(node)
        
        # Check both top-level and data object for agent_config
        agent_config = node.agent_config
        if not agent_config and hasattr(node, 'data') and node.data:
            agent_config = node.data.get('agent_config') if isinstance(node.data, dict) else None
        
        if not agent_config:
            raise ValueError(f"Node {node.id} requires agent_config. Please configure the agent settings in the node properties.")
        
        # Convert dict to AgentConfig if needed
        if isinstance(agent_config, dict):
            from ..models.schemas import AgentConfig
            agent_config = AgentConfig(**agent_config)
        
        self.config = agent_config
        self.llm_config = llm_config or self._get_fallback_config()
        self.user_id = user_id
        
        if not self.llm_config:
            raise ValueError(
                "No LLM configuration found. Please configure an LLM provider in Settings "
                "or set OPENAI_API_KEY environment variable."
            )
        
        # Don't validate API key here - we'll validate it in execute() after determining
        # which provider to use for the specific model. The default llm_config might not
        # be the correct provider for the model being used.
    
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
    
    def _find_provider_for_model(self, model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Find the provider that owns the given model name"""
        # Import here to avoid circular dependency
        from ..api.settings_routes import get_provider_for_model
        # Use instance user_id if provided, otherwise use passed user_id
        lookup_user_id = self.user_id if hasattr(self, 'user_id') and self.user_id else user_id
        return get_provider_for_model(model_name, lookup_user_id)
    
    def _validate_api_key(self, api_key: str) -> None:
        """Validate that API key is not a placeholder - only flag obvious placeholders"""
        if not api_key:
            raise ValueError(
                "API key is empty. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'."
            )
        
        # Trim whitespace
        api_key = api_key.strip()
        if not api_key:
            raise ValueError(
                "API key is empty. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'."
            )
        
        # If it's very short, it's likely a placeholder
        if len(api_key) < 10:
            raise ValueError(
                "API key appears to be a placeholder (too short). Please go to Settings, add a valid API key, "
                "enable it, and click 'Sync Now'."
            )
        
        api_key_lower = api_key.lower()
        
        # Only flag exact placeholder matches - be very conservative
        # Since connection test works, we know the key is valid, so only reject obvious placeholders
        exact_placeholders = [
            "your-api-key-here",
            "your-api*****here",
            "sk-your-api-key-here",
            "sk-your-api*****here",
            "your-api-key",
            "api-key-here"
        ]
        
        # Check exact matches (case-insensitive)
        if api_key_lower in [p.lower() for p in exact_placeholders]:
            raise ValueError(
                "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'. The API key cannot be a placeholder."
            )
        
        # Check if it's exactly a placeholder pattern (very short and contains placeholder text)
        # Only flag if it's clearly a placeholder, not if it's a real key that happens to contain these words
        if len(api_key) < 25 and ("your-api-key-here" in api_key_lower or "your-api*****here" in api_key_lower):
            raise ValueError(
                "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'. The API key cannot be a placeholder."
            )
        
        # Check for masked placeholder pattern (short key with asterisks and "here")
        if len(api_key) < 30 and "*****here" in api_key:
            raise ValueError(
                "Invalid API key detected. Please go to Settings, add an LLM provider with a valid API key, "
                "enable it, and click 'Sync Now'. The API key cannot be a placeholder."
            )
    
    async def execute(self, inputs: Dict[str, Any]) -> Any:
        """Execute the LLM agent with configured provider"""
        self.validate_inputs(inputs)
        
        # Build the prompt from inputs
        user_message = self._build_user_message(inputs)
        
        # Use model from agent config if specified, otherwise from LLM config
        model = self.config.model or self.llm_config["model"]
        
        # Try to find the provider that owns this model
        # This ensures we use the correct API for the selected model
        model_provider_config = self._find_provider_for_model(model, self.user_id)
        
        if model_provider_config:
            # Use the provider that owns this model
            provider_type = model_provider_config["type"]
            
            # Validate the API key from the model-specific provider
            api_key = model_provider_config.get("api_key", "")
            if not api_key:
                raise ValueError(
                    f"Provider '{provider_type}' for model '{model}' has no API key configured. "
                    "Please go to Settings, add a valid API key for this provider, enable it, and click 'Sync Now'."
                )
            
            # Debug logging
            api_key_preview = api_key[:15] + "..." if len(api_key) > 15 else api_key
            print(f"🔑 Using API key from provider '{provider_type}' for model '{model}': {api_key_preview} (length: {len(api_key)})")
            
            # Validate API key (should already be filtered, but double-check)
            try:
                self._validate_api_key(api_key)
            except ValueError as e:
                # Provide more helpful error message with debug info
                print(f"❌ API key validation failed for provider '{provider_type}': {str(e)}")
                print(f"   Key preview: {api_key_preview}")
                print(f"   Key length: {len(api_key)}")
                raise ValueError(
                    f"Provider '{provider_type}' for model '{model}' has an invalid API key. "
                    "Please go to Settings, update the API key for this provider with a valid key, enable it, and click 'Sync Now'."
                ) from e
            
            # Update llm_config to use the correct provider's config
            self.llm_config = {
                **self.llm_config,
                **model_provider_config
            }
            print(f"✅ Found provider for model '{model}': {provider_type}")
        else:
            # Fall back to the default provider from llm_config
            if not self.llm_config:
                raise ValueError(
                    f"No provider found for model '{model}' and no default provider configured. "
                    "Please go to Settings, add an LLM provider with a valid API key for this model, enable it, and click 'Sync Now'."
                )
            
            provider_type = self.llm_config["type"]
            
            # Validate the API key from the default provider
            api_key = self.llm_config.get("api_key", "")
            if not api_key:
                raise ValueError(
                    f"Default provider '{provider_type}' has no API key configured. "
                    "Please go to Settings, add a valid API key for this provider, enable it, and click 'Sync Now'."
                )
            
            # Validate API key (should already be filtered, but double-check)
            try:
                self._validate_api_key(api_key)
            except ValueError as e:
                # Provide more helpful error message
                raise ValueError(
                    f"Default provider '{provider_type}' has an invalid API key. "
                    "Please go to Settings, update the API key for this provider with a valid key, enable it, and click 'Sync Now'."
                ) from e
            
            print(f"⚠️ No provider found for model '{model}', using default provider: {provider_type}")
        
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
        
        # Use 5 minute timeout for LLM requests (some models can take longer)
        async with httpx.AsyncClient(timeout=300.0) as client:
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
        
        # Use 5 minute timeout for LLM requests (some models can take longer)
        async with httpx.AsyncClient(timeout=300.0) as client:
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
        
        # Use 5 minute timeout for LLM requests (some models can take longer)
        async with httpx.AsyncClient(timeout=300.0) as client:
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
        
        # Use 5 minute timeout for LLM requests (some models can take longer)
        async with httpx.AsyncClient(timeout=300.0) as client:
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


"""
Unified LLM Agent - Supports OpenAI, Anthropic, and Custom providers
"""
from typing import Any, Dict, Optional, Callable, Awaitable
import os
import asyncio
import httpx
from .base import BaseAgent
from ..models.schemas import Node
from ..utils.logger import get_logger

logger = get_logger(__name__)


class UnifiedLLMAgent(BaseAgent):
    """Agent that uses configured LLM provider for processing"""
    
    def __init__(self, node: Node, llm_config: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None, log_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None):
        super().__init__(node, log_callback=log_callback)
        
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
        
        # Debug logging - log input data (use INFO so it shows in execution logs)
        logger.info(f"Agent node '{self.node_id}' received inputs:")
        for key, value in inputs.items():
            if isinstance(value, str):
                # For strings, show preview (first 200 chars) and total length
                preview = value[:200] + "..." if len(value) > 200 else value
                logger.info(f"   {key}: (str, length={len(value)}) {preview}")
            elif isinstance(value, dict):
                # For dicts, show keys and size
                logger.info(f"   {key}: (dict, keys={list(value.keys())}, size={len(str(value))} chars)")
            elif isinstance(value, (list, tuple)):
                # For lists, show length and type of items
                logger.info(f"   {key}: ({type(value).__name__}, length={len(value)}, item_types={[type(item).__name__ for item in value[:3]]})")
            else:
                # For other types, show type and string representation (limited)
                value_str = str(value)
                preview = value_str[:200] + "..." if len(value_str) > 200 else value_str
                logger.info(f"   {key}: ({type(value).__name__}) {preview}")
        
        # Build the prompt from inputs
        user_message = self._build_user_message(inputs)
        
        # Use model from agent config if specified, otherwise from LLM config
        model = self.config.model or self.llm_config["model"]
        
        # Debug logging - use INFO for key points so they show in execution logs
        logger.info(f"Agent node '{self.node_id}': Looking for provider for model '{model}'")
        logger.debug(f"   Agent config model: {self.config.model}")
        logger.debug(f"   LLM config model: {self.llm_config.get('model')}")
        logger.debug(f"   User ID: {self.user_id}")
        logger.info(f"   Input keys: {list(inputs.keys())}")
        logger.info(f"   User message type: {type(user_message)}, is_list: {isinstance(user_message, list)}")
        
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
            logger.debug(f"Using API key from provider '{provider_type}' for model '{model}': {api_key_preview} (length: {len(api_key)})")
            
            # Validate API key (should already be filtered, but double-check)
            try:
                self._validate_api_key(api_key)
            except ValueError as e:
                # Provide more helpful error message with debug info
                logger.error(f"API key validation failed for provider '{provider_type}': {str(e)}")
                logger.debug(f"   Key preview: {api_key_preview}")
                logger.debug(f"   Key length: {len(api_key)}")
                raise ValueError(
                    f"Provider '{provider_type}' for model '{model}' has an invalid API key. "
                    "Please go to Settings, update the API key for this provider with a valid key, enable it, and click 'Sync Now'."
                ) from e
            
            # Update llm_config to use the correct provider's config
            self.llm_config = {
                **self.llm_config,
                **model_provider_config
            }
            logger.debug(f"Found provider for model '{model}': {provider_type}")
        else:
            # Model not found in any provider - check if model name suggests a specific provider
            model_lower = model.lower()
            suggested_provider = None
            
            if 'gemini' in model_lower:
                suggested_provider = 'gemini'
            elif 'claude' in model_lower or 'anthropic' in model_lower:
                suggested_provider = 'anthropic'
            elif 'gpt' in model_lower or 'openai' in model_lower:
                suggested_provider = 'openai'
            
            # Fall back to the default provider from llm_config
            if not self.llm_config:
                error_msg = f"No provider found for model '{model}' and no default provider configured."
                if suggested_provider:
                    error_msg += f" This model appears to be a {suggested_provider} model. Please go to Settings, add a {suggested_provider} provider with model '{model}' in its models list, enable it, and click 'Sync Now'."
                else:
                    error_msg += " Please go to Settings, add an LLM provider with a valid API key for this model, enable it, and click 'Sync Now'."
                raise ValueError(error_msg)
            
            provider_type = self.llm_config["type"]
            
            # If we have a model-specific provider suggestion, warn if using different provider
            if suggested_provider and provider_type != suggested_provider:
                logger.warning(f"Model '{model}' suggests {suggested_provider} provider, but using {provider_type} provider")
                logger.warning(f"   This may cause errors. Please configure a {suggested_provider} provider with model '{model}' in Settings.")
                raise ValueError(
                    f"Model '{model}' not found in any enabled provider. "
                    f"This model appears to be a {suggested_provider} model, but no {suggested_provider} provider "
                    f"with this model is configured. Please go to Settings, add a {suggested_provider} provider "
                    f"with model '{model}' in its models list, enable it, and click 'Sync Now'."
                )
            
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
            
            logger.warning(f"No provider found for model '{model}', using default provider: {provider_type}")
        
        # Execute based on provider type and ensure we never return None
        try:
            # Forward key logs to execution logs if callback available (non-blocking)
            if self.log_callback:
                try:
                    # Don't await - let it run in background
                    asyncio.create_task(self.log_callback("INFO", self.node_id, f"Executing with provider '{provider_type}' and model '{model}'"))
                except Exception:
                    pass  # Don't let callback failures break execution
            logger.info(f"Executing with provider '{provider_type}' and model '{model}'")
            
            if provider_type == "openai":
                result = await self._execute_openai(user_message, model)
            elif provider_type == "anthropic":
                result = await self._execute_anthropic(user_message, model)
            elif provider_type == "gemini":
                if self.log_callback:
                    try:
                        # Don't await - let it run in background
                        asyncio.create_task(self.log_callback("INFO", self.node_id, f"Calling Gemini API with model '{model}'"))
                    except Exception:
                        pass  # Don't let callback failures break execution
                logger.info(f"Calling Gemini API with model '{model}'")
                result = await self._execute_gemini(user_message, model)
            elif provider_type == "custom":
                result = await self._execute_custom(user_message, model)
            else:
                raise ValueError(f"Unknown provider type: {provider_type}")
            
            # Ensure result is never None
            if result is None:
                logger.warning(f"Provider '{provider_type}' returned None, converting to empty string")
                return ""
            
            result_length = len(str(result)) if result else 0
            logger.info(f"Agent execution completed, result type: {type(result)}, length: {result_length}")
            if result == "":
                logger.warning(f"Agent returned empty string - this may indicate an issue with the API call or response parsing")
            return result
        except Exception as e:
            logger.error(f"Agent execution failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise
    
    async def _execute_openai(self, user_message: Any, model: str) -> Any:
        """Execute using OpenAI API - supports text and vision models"""
        base_url = self.llm_config.get("base_url", "https://api.openai.com/v1")
        api_key = self.llm_config["api_key"]
        
        messages = []
        if self.config.system_prompt:
            messages.append({
                "role": "system",
                "content": self.config.system_prompt
            })
            logger.debug(f"OpenAI system prompt: {self.config.system_prompt}")
        
        # Handle vision models (content is a list) vs text models (content is string)
        if isinstance(user_message, list):
            # Vision model - content is a list of text and image objects
            messages.append({
                "role": "user",
                "content": user_message
            })
            # Log user message structure
            logger.debug(f"OpenAI user message (vision): {len(user_message)} items")
            for i, item in enumerate(user_message):
                if item.get("type") == "text":
                    text_preview = item.get("text", "")[:200] + "..." if len(item.get("text", "")) > 200 else item.get("text", "")
                    logger.debug(f"   Item {i}: text ({len(item.get('text', ''))} chars) - {text_preview}")
                elif item.get("type") == "image_url":
                    image_url = item.get("image_url", {}).get("url", "")
                    logger.debug(f"   Item {i}: image_url ({len(image_url)} chars) - {image_url[:100]}...")
        else:
            # Text model - content is a string
            messages.append({
                "role": "user",
                "content": user_message
            })
            user_preview = user_message[:500] + "..." if len(user_message) > 500 else user_message
            logger.debug(f"OpenAI user message (text, {len(user_message)} chars): {user_preview}")
        
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
            content = data["choices"][0]["message"]["content"]
            
            # Check if response contains image generation (for future DALL-E support)
            # For now, return text content as-is
            # If content is None, check for image_url or other image formats
            if content is None:
                # Check if there's image data in the response
                message = data["choices"][0]["message"]
                if "image" in message:
                    return message["image"]
                # Return empty string if no content
                return ""
            
            return content
    
    async def _execute_anthropic(self, user_message: Any, model: str) -> Any:
        """Execute using Anthropic API - supports text and vision models"""
        base_url = self.llm_config.get("base_url", "https://api.anthropic.com/v1")
        api_key = self.llm_config["api_key"]
        
        # Anthropic API format - supports vision models with content array
        messages = [{
            "role": "user",
            "content": user_message if isinstance(user_message, list) else user_message
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
            logger.debug(f"Anthropic system prompt: {self.config.system_prompt}")
        
        # Log user message
        if isinstance(user_message, list):
            logger.debug(f"Anthropic user message (vision): {len(user_message)} items")
            for i, item in enumerate(user_message):
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        text_preview = item.get("text", "")[:200] + "..." if len(item.get("text", "")) > 200 else item.get("text", "")
                        logger.debug(f"   Item {i}: text ({len(item.get('text', ''))} chars) - {text_preview}")
                    elif item.get("type") == "image_url":
                        image_url = item.get("image_url", {}).get("url", "")
                        logger.debug(f"   Item {i}: image_url ({len(image_url)} chars) - {image_url[:100]}...")
                else:
                    logger.debug(f"   Item {i}: {type(item).__name__} - {str(item)[:200]}")
        else:
            user_preview = str(user_message)[:500] + "..." if len(str(user_message)) > 500 else str(user_message)
            logger.debug(f"Anthropic user message (text, {len(str(user_message))} chars): {user_preview}")
        
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
    
    async def _execute_gemini(self, user_message: Any, model: str) -> Any:
        """Execute using Google Gemini API - supports text and vision models"""
        import base64
        try:
            from PIL import Image
            import io
            PIL_AVAILABLE = True
        except ImportError:
            PIL_AVAILABLE = False
        
        base_url = self.llm_config.get("base_url", "https://generativelanguage.googleapis.com/v1beta")
        api_key = self.llm_config["api_key"]
        
        # Gemini API format - supports vision models
        parts = []
        
        logger.info(f"Building Gemini request: user_message type={type(user_message)}, is_list={isinstance(user_message, list)}")
        
        if isinstance(user_message, list):
            # Vision model - process content array
            logger.debug(f"   Processing {len(user_message)} items in user_message list")
            for i, item in enumerate(user_message):
                logger.debug(f"   Item {i}: type={item.get('type')}, keys={list(item.keys())}")
                if item.get("type") == "text":
                    text_content = item.get("text", "")
                    parts.append({"text": text_content})
                    logger.debug(f"   Added text part: {len(text_content)} chars")
                elif item.get("type") == "image_url":
                    image_url = item.get("image_url", {}).get("url", "")
                    logger.debug(f"   Processing image_url: {image_url[:50]}...")
                    if image_url.startswith("data:image/"):
                        # Extract base64 data
                        try:
                            header, base64_data = image_url.split(",", 1)
                            mimetype = header.split(";")[0].split(":")[1]
                            
                            # Check image size and estimate token count
                            # Gemini counts tokens based on image dimensions:
                            # - Images are divided into 512x512 pixel tiles
                            # - Each tile = 85 tokens
                            # - Base image = 85 tokens
                            # Max tokens = 1,048,576
                            
                            base64_size = len(base64_data)
                            
                            # Try to get actual image dimensions from headers
                            width = None
                            height = None
                            decoded = None
                            try:
                                decoded = base64.b64decode(base64_data)
                                
                                # Parse PNG dimensions (bytes 16-23 after PNG signature)
                                if mimetype == "image/png" and decoded[:8] == b'\x89PNG\r\n\x1a\n':
                                    if len(decoded) >= 24:
                                        width = int.from_bytes(decoded[16:20], 'big')
                                        height = int.from_bytes(decoded[20:24], 'big')
                                
                                # Parse JPEG dimensions (more complex, need to find SOF marker)
                                elif mimetype in ["image/jpeg", "image/jpg"] and decoded[:2] == b'\xff\xd8':
                                    # JPEG dimensions are in SOF (Start of Frame) markers
                                    # Look for SOF0-SOF15 markers (0xFFC0-0xFFCF)
                                    pos = 2
                                    while pos < len(decoded) - 8:
                                        if decoded[pos] == 0xFF and decoded[pos+1] >= 0xC0 and decoded[pos+1] <= 0xCF:
                                            height = int.from_bytes(decoded[pos+5:pos+7], 'big')
                                            width = int.from_bytes(decoded[pos+7:pos+9], 'big')
                                            break
                                        pos += 1
                            except Exception as e:
                                logger.debug(f"   Could not parse image dimensions: {e}")
                            
                            # Calculate token count if we have dimensions
                            if width and height:
                                tiles_per_width = (width + 511) // 512  # Round up
                                tiles_per_height = (height + 511) // 512  # Round up
                                total_tiles = tiles_per_width * tiles_per_height
                                estimated_tokens = total_tiles * 85 + 85
                                
                                logger.info(f"   Image dimensions: {width}x{height} pixels, {total_tiles} tiles, ~{estimated_tokens:,} tokens")
                                
                                # Estimate text content tokens (rough estimate: ~4 chars per token)
                                text_tokens = 0
                                if self.config.system_prompt:
                                    text_tokens += len(self.config.system_prompt) // 4
                                # Estimate tokens from text parts in user message
                                for part in parts:
                                    if "text" in part:
                                        text_tokens += len(part["text"]) // 4
                                
                                # Total estimated tokens including text
                                total_estimated_tokens = estimated_tokens + text_tokens
                                
                                logger.info(f"   Estimated tokens: image={estimated_tokens:,}, text={text_tokens:,}, total={total_estimated_tokens:,}")
                                
                                # Check if image is too large and resize if needed
                                # Be very aggressive - resize if image alone exceeds 300k, or total exceeds 600k
                                if estimated_tokens > 300_000 or total_estimated_tokens > 600_000:
                                    # Calculate target dimensions to stay under limit
                                    # Target: ~200,000 tokens for image (leaves ~800k for text/prompt/other)
                                    max_tiles = (200_000 - 85) // 85  # ~2,352 tiles
                                    max_dimension = int((max_tiles ** 0.5) * 512)  # ~2,400 pixels per side
                                    
                                    if PIL_AVAILABLE:
                                        # Resize image to fit within token limit
                                        logger.warning(
                                            f"Image is too large ({width}x{height} pixels ≈ {estimated_tokens:,} tokens, "
                                            f"total with text ≈ {total_estimated_tokens:,} tokens, limit is 1,048,576). "
                                            f"Resizing to fit within limit (target: ~{max_dimension}x{max_dimension} pixels)."
                                        )
                                        
                                        try:
                                            # Use already decoded image if available, otherwise decode
                                            if decoded is None:
                                                decoded = base64.b64decode(base64_data)
                                            img = Image.open(io.BytesIO(decoded))
                                            
                                            # Calculate new dimensions maintaining aspect ratio
                                            if width > height:
                                                new_width = max_dimension
                                                new_height = int(height * (max_dimension / width))
                                            else:
                                                new_height = max_dimension
                                                new_width = int(width * (max_dimension / height))
                                            
                                            # Resize image with high-quality resampling
                                            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                                            
                                            # Convert back to base64
                                            output_buffer = io.BytesIO()
                                            if mimetype == "image/png":
                                                img_resized.save(output_buffer, format='PNG', optimize=True)
                                            elif mimetype in ["image/jpeg", "image/jpg"]:
                                                img_resized.save(output_buffer, format='JPEG', quality=85, optimize=True)
                                            else:
                                                # Default to PNG for other formats
                                                img_resized.save(output_buffer, format='PNG', optimize=True)
                                                mimetype = "image/png"
                                            
                                            # Update base64 data
                                            base64_data = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
                                            
                                            # Recalculate token count
                                            new_tiles_per_width = (new_width + 511) // 512
                                            new_tiles_per_height = (new_height + 511) // 512
                                            new_total_tiles = new_tiles_per_width * new_tiles_per_height
                                            new_estimated_tokens = new_total_tiles * 85 + 85
                                            
                                            # Recalculate total with new image tokens
                                            new_total_estimated_tokens = new_estimated_tokens + text_tokens
                                            
                                            logger.info(f"   Resized image to {new_width}x{new_height} pixels, {new_total_tiles} tiles, ~{new_estimated_tokens:,} tokens")
                                            logger.info(f"   New total estimated tokens: image={new_estimated_tokens:,}, text={text_tokens:,}, total={new_total_estimated_tokens:,}")
                                            
                                            # Update dimensions and token counts
                                            width = new_width
                                            height = new_height
                                            estimated_tokens = new_estimated_tokens
                                            total_estimated_tokens = new_total_estimated_tokens
                                            
                                            # Double-check: if still too large, resize again more aggressively
                                            if new_total_estimated_tokens > 900_000:
                                                logger.warning(f"   Resized image still too large ({new_total_estimated_tokens:,} tokens). Resizing again more aggressively...")
                                                # Even smaller target: ~150k tokens for image
                                                max_tiles_2 = (150_000 - 85) // 85  # ~1,764 tiles
                                                max_dimension_2 = int((max_tiles_2 ** 0.5) * 512)  # ~2,100 pixels per side
                                                
                                                if width > height:
                                                    new_width_2 = max_dimension_2
                                                    new_height_2 = int(height * (max_dimension_2 / width))
                                                else:
                                                    new_height_2 = max_dimension_2
                                                    new_width_2 = int(width * (max_dimension_2 / height))
                                                
                                                img_resized_2 = img_resized.resize((new_width_2, new_height_2), Image.Resampling.LANCZOS)
                                                
                                                output_buffer_2 = io.BytesIO()
                                                if mimetype == "image/png":
                                                    img_resized_2.save(output_buffer_2, format='PNG', optimize=True)
                                                elif mimetype in ["image/jpeg", "image/jpg"]:
                                                    img_resized_2.save(output_buffer_2, format='JPEG', quality=80, optimize=True)
                                                else:
                                                    img_resized_2.save(output_buffer_2, format='PNG', optimize=True)
                                                    mimetype = "image/png"
                                                
                                                base64_data = base64.b64encode(output_buffer_2.getvalue()).decode('utf-8')
                                                
                                                new_tiles_per_width_2 = (new_width_2 + 511) // 512
                                                new_tiles_per_height_2 = (new_height_2 + 511) // 512
                                                new_total_tiles_2 = new_tiles_per_width_2 * new_tiles_per_height_2
                                                new_estimated_tokens_2 = new_total_tiles_2 * 85 + 85
                                                new_total_estimated_tokens_2 = new_estimated_tokens_2 + text_tokens
                                                
                                                logger.info(f"   Second resize to {new_width_2}x{new_height_2} pixels, {new_total_tiles_2} tiles, ~{new_estimated_tokens_2:,} tokens")
                                                logger.info(f"   Final total estimated tokens: image={new_estimated_tokens_2:,}, text={text_tokens:,}, total={new_total_estimated_tokens_2:,}")
                                                
                                                width = new_width_2
                                                height = new_height_2
                                                estimated_tokens = new_estimated_tokens_2
                                                total_estimated_tokens = new_total_estimated_tokens_2
                                            
                                        except Exception as e:
                                            logger.error(f"   Failed to resize image: {e}", exc_info=True)
                                            error_msg = (
                                                f"Image is too large ({width}x{height} pixels ≈ {estimated_tokens:,} tokens, limit is 1,048,576) "
                                                f"and automatic resizing failed: {str(e)}. Please resize the image manually to approximately 2400x2400 pixels or smaller."
                                            )
                                            raise RuntimeError(error_msg)
                                    else:
                                        # PIL not available, raise error
                                        error_msg = (
                                            f"Image is too large ({width}x{height} pixels ≈ {estimated_tokens:,} tokens, limit is 1,048,576). "
                                            f"PIL/Pillow is not available for automatic resizing. Please install Pillow (pip install Pillow) or resize the image manually to approximately 2400x2400 pixels or smaller."
                                        )
                                        logger.error(error_msg)
                                        raise RuntimeError(error_msg)
                            else:
                                # Fallback: estimate from base64 size
                                # Base64 increases size by ~33%, so original size ≈ base64_size * 0.75
                                estimated_original_size = int(base64_size * 0.75)
                                
                                # Conservative estimate: assume high-quality image
                                # For JPEG: assume 2 bytes per pixel (compressed)
                                # For PNG: assume 4 bytes per pixel (RGBA, compressed)
                                if mimetype == "image/jpeg":
                                    estimated_pixels = estimated_original_size * 2
                                else:
                                    estimated_pixels = estimated_original_size
                                
                                # Estimate dimensions (assume square-ish image)
                                estimated_dimension = int((estimated_pixels) ** 0.5)
                                
                                # Estimate token count
                                tiles_per_side = (estimated_dimension + 511) // 512
                                estimated_tiles = tiles_per_side * tiles_per_side
                                estimated_tokens = estimated_tiles * 85 + 85
                                
                                logger.info(f"   Image size estimate: ~{estimated_dimension}x{estimated_dimension} pixels, ~{estimated_tokens:,} tokens")
                                
                                # Check if image is too large (conservative check)
                                if estimated_tokens > 800_000:  # More conservative since we're estimating
                                    error_msg = (
                                        f"Image appears to be too large (estimated ~{estimated_dimension}x{estimated_dimension} pixels ≈ {estimated_tokens:,} tokens, limit is 1,048,576). "
                                        f"Please resize or compress the image before sending."
                                    )
                                    logger.error(error_msg)
                                    raise RuntimeError(error_msg)
                            
                            # Also check base64 size directly as a final safety check
                            # Very large base64 strings will definitely exceed the limit
                            if base64_size > 4_000_000:  # ~4MB base64 ≈ 1M tokens
                                error_msg = (
                                    f"Image base64 data is too large ({base64_size:,} chars). "
                                    f"Please compress or resize the image before sending."
                                )
                                logger.error(error_msg)
                                raise RuntimeError(error_msg)
                            
                            parts.append({
                                "inline_data": {
                                    "mime_type": mimetype,
                                    "data": base64_data
                                }
                            })
                            logger.debug(f"   Added inline_data part: mime_type={mimetype}, data_length={len(base64_data)}")
                        except RuntimeError:
                            # Re-raise size validation errors
                            raise
                        except Exception as e:
                            logger.warning(f"   Failed to parse data URL: {e}")
                            pass
                    elif image_url.startswith(("http://", "https://")):
                        # URL to image - Gemini can handle URLs directly
                        parts.append({
                            "file_data": {
                                "file_uri": image_url,
                                "mime_type": "image/png"  # Default, could be detected from URL
                            }
                        })
                        logger.debug(f"   Added file_data part: uri={image_url}")
        else:
            # Text model
            text_content = str(user_message)
            parts.append({"text": text_content})
            logger.debug(f"   Added text part (non-list): {len(text_content)} chars")
        
        logger.debug(f"   Total parts: {len(parts)}, Part types: {[list(p.keys()) for p in parts]}")
        
        contents = [{
            "parts": parts
        }]
        
        request_data = {
            "contents": contents
        }
        
        # Add system instruction if provided
        if self.config.system_prompt:
            request_data["systemInstruction"] = {
                "parts": [{"text": self.config.system_prompt}]
            }
            if self.log_callback:
                try:
                    asyncio.create_task(self.log_callback("INFO", self.node_id, f"Gemini system instruction: {self.config.system_prompt}"))
                except Exception:
                    pass  # Don't let callback failures break execution
            logger.info(f"Gemini system instruction: {self.config.system_prompt}")
        
        # Log the user message parts that will be sent (use INFO so it shows in execution logs)
        if self.log_callback:
            try:
                asyncio.create_task(self.log_callback("INFO", self.node_id, f"Gemini user message parts ({len(parts)} total):"))
            except Exception:
                pass  # Don't let callback failures break execution
        logger.info(f"Gemini user message parts ({len(parts)} total):")
        for i, part in enumerate(parts):
            if "text" in part:
                text_preview = part["text"][:500] + "..." if len(part["text"]) > 500 else part["text"]
                if self.log_callback:
                    try:
                        asyncio.create_task(self.log_callback("INFO", self.node_id, f"   Part {i}: text ({len(part['text'])} chars) - {text_preview}"))
                    except Exception:
                        pass  # Don't let callback failures break execution
                logger.info(f"   Part {i}: text ({len(part['text'])} chars) - {text_preview}")
            elif "inline_data" in part:
                inline_data = part["inline_data"]
                data_length = len(inline_data.get("data", ""))
                if self.log_callback:
                    try:
                        asyncio.create_task(self.log_callback("INFO", self.node_id, f"   Part {i}: inline_data (mime_type={inline_data.get('mime_type')}, data_length={data_length} chars)"))
                    except Exception:
                        pass  # Don't let callback failures break execution
                logger.info(f"   Part {i}: inline_data (mime_type={inline_data.get('mime_type')}, data_length={data_length} chars)")
            elif "file_data" in part:
                file_data = part["file_data"]
                if self.log_callback:
                    try:
                        asyncio.create_task(self.log_callback("INFO", self.node_id, f"   Part {i}: file_data (file_uri={file_data.get('file_uri', '')[:100]}...)"))
                    except Exception:
                        pass  # Don't let callback failures break execution
                logger.info(f"   Part {i}: file_data (file_uri={file_data.get('file_uri', '')[:100]}...)")
        
        # Add generation config
        generation_config = {}
        if self.config.temperature:
            generation_config["temperature"] = self.config.temperature
        if self.config.max_tokens:
            generation_config["maxOutputTokens"] = self.config.max_tokens
        
        # For image generation models, request both text and image outputs
        is_image_model = "flash-image" in model.lower() or "pro-image" in model.lower() or "nano-banana" in model.lower() or "banana" in model.lower()
        if is_image_model:
            generation_config["responseModalities"] = ["TEXT", "IMAGE"]
            logger.info(f"Image generation model detected: {model}, requesting TEXT and IMAGE outputs")
        
        if generation_config:
            request_data["generationConfig"] = generation_config
        
        # Use 5 minute timeout for LLM requests (some models can take longer)
        max_retries = 3
        retry_delay = 2.0  # Start with 2 seconds
        response = None
        data = None
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(
                        f"{base_url}/models/{model}:generateContent?key={api_key}",
                        headers={
                            "Content-Type": "application/json"
                        },
                        json=request_data
                    )
                    
                    if response.status_code == 200:
                        # Success - parse response immediately while response object is still valid
                        try:
                            data = response.json()
                            break  # Success, exit retry loop
                        except Exception as e:
                            logger.error(f"Failed to parse Gemini API response as JSON: {e}")
                            logger.error(f"Response status: {response.status_code}, Response text: {response.text[:500]}")
                            raise RuntimeError(f"Failed to parse Gemini API response: {e}")
                    
                    # Handle rate limiting (429) with retry
                    if response.status_code == 429:
                        try:
                            error_data = response.json()
                            retry_info = None
                            # Try to extract retry delay from error response
                            if "error" in error_data and "details" in error_data["error"]:
                                for detail in error_data["error"]["details"]:
                                    if detail.get("@type") == "type.googleapis.com/google.rpc.RetryInfo":
                                        retry_info = detail.get("retryDelay")
                                        if retry_info:
                                            # Parse retry delay (format: "2s" or "2.826725159s")
                                            delay_str = retry_info.replace("s", "")
                                            try:
                                                retry_delay = float(delay_str)
                                            except ValueError:
                                                retry_delay = 2.0
                            else:
                                # Fallback: use exponential backoff
                                retry_delay = 2.0 * (2 ** attempt)
                            
                            if attempt < max_retries - 1:
                                logger.warning(f"Rate limit exceeded (429), retrying in {retry_delay:.1f}s (attempt {attempt + 1}/{max_retries})...")
                                await asyncio.sleep(retry_delay)
                                continue
                            else:
                                # Last attempt failed
                                raise RuntimeError(
                                    f"Gemini API rate limit exceeded after {max_retries} attempts. "
                                    f"Please wait and try again later. Error: {response.text}"
                                )
                        except (ValueError, KeyError) as e:
                            # If we can't parse the error, use exponential backoff
                            if attempt < max_retries - 1:
                                retry_delay = 2.0 * (2 ** attempt)
                                logger.warning(f"Rate limit exceeded (429), retrying in {retry_delay:.1f}s (attempt {attempt + 1}/{max_retries})...")
                                await asyncio.sleep(retry_delay)
                                continue
                            else:
                                raise RuntimeError(
                                    f"Gemini API request failed with status {response.status_code}: {response.text}"
                                )
                    
                    # For other errors, don't retry
                    if response.status_code != 200:
                        error_text = response.text[:500] if response.text else "No error message"
                        # Try to parse JSON error response to extract user-friendly message
                        try:
                            error_data = response.json()
                            if "error" in error_data and isinstance(error_data["error"], dict):
                                error_message = error_data["error"].get("message", error_text)
                                error_code = error_data["error"].get("code", response.status_code)
                                raise RuntimeError(
                                    f"Gemini API error ({error_code}): {error_message}"
                                )
                        except (ValueError, KeyError, TypeError):
                            # If JSON parsing fails, use the raw error text
                            pass
                        raise RuntimeError(
                            f"Gemini API request failed with status {response.status_code}: {error_text}"
                        )
            except RuntimeError:
                # Re-raise RuntimeErrors (these are our intentional errors)
                raise
            except Exception as e:
                # For other exceptions, log and retry if we have attempts left
                if attempt < max_retries - 1:
                    logger.warning(f"Gemini API request exception (attempt {attempt + 1}/{max_retries}): {type(e).__name__}: {str(e)}")
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    # Last attempt failed
                    logger.error(f"Gemini API request failed after {max_retries} attempts: {type(e).__name__}: {str(e)}")
                    raise RuntimeError(f"Gemini API request failed: {type(e).__name__}: {str(e)}")
        
        # Ensure we have data before proceeding
        if data is None:
            error_msg = f"Gemini API request completed but no data received"
            if response:
                error_msg += f". Response status: {response.status_code}, Response text: {response.text[:500] if response.text else 'empty'}"
            logger.error(error_msg)
            return ""
        
        # Log response structure - use INFO so it shows in execution logs
        if self.log_callback:
            try:
                asyncio.create_task(self.log_callback("INFO", self.node_id, f"Gemini API response structure: candidates={len(data.get('candidates', []))}, keys={list(data.keys())}"))
            except Exception:
                pass  # Don't let callback failures break execution
        logger.info(f"Gemini API response structure: candidates={len(data.get('candidates', []))}, keys={list(data.keys())}")
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            logger.debug(f"   Candidate keys: {list(candidate.keys())}")
            if "content" in candidate:
                logger.debug(f"   Content keys: {list(candidate['content'].keys())}")
                if "parts" in candidate["content"]:
                    logger.debug(f"   Parts count: {len(candidate['content']['parts'])}, Part keys: {[list(p.keys()) for p in candidate['content']['parts']]}")
        
        # Check for error in response
        if "error" in data:
            error_msg = data["error"].get("message", "Unknown error")
            error_details = data["error"].get("details", [])
            logger.error(f"Gemini API error: {error_msg}, details: {error_details}")
            raise RuntimeError(f"Gemini API error: {error_msg}")
        
        # Extract content from Gemini response - handle both text and image outputs
        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            
            # Check for finish reason - might indicate why no content
            finish_reason = candidate.get("finishReason", "")
            if finish_reason:
                if self.log_callback:
                    try:
                        asyncio.create_task(self.log_callback("INFO", self.node_id, f"   Gemini finish reason: {finish_reason}"))
                    except Exception:
                        pass  # Don't let callback failures break execution
                logger.info(f"   Gemini finish reason: {finish_reason}")
            else:
                if self.log_callback:
                    try:
                        asyncio.create_task(self.log_callback("INFO", self.node_id, f"   Gemini finish reason: (not provided)"))
                    except Exception:
                        pass  # Don't let callback failures break execution
                logger.info(f"   Gemini finish reason: (not provided)")
            
            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                
                # Check if this is an image generation model
                is_image_model = "flash-image" in model.lower() or "pro-image" in model.lower() or "nano-banana" in model.lower() or "banana" in model.lower()
                
                # Collect text and images
                text_parts = []
                image_parts = []
                
                for i, part in enumerate(parts):
                    logger.debug(f"   Part {i}: keys={list(part.keys())}")
                    if "text" in part and part["text"]:
                        text_parts.append(part["text"])
                        logger.debug(f"   Found text part: {len(part['text'])} chars")
                    elif "inlineData" in part:
                        # Image data - convert to base64 data URL (REST API uses camelCase)
                        inline_data = part["inlineData"]
                        mime_type = inline_data.get("mimeType", "image/jpeg")  # Default to JPEG
                        image_data = inline_data.get("data", "")
                        if image_data:
                            image_parts.append(f"data:{mime_type};base64,{image_data}")
                            logger.info(f"Extracted image from Gemini response: {len(image_data)} chars of base64 data, mime_type: {mime_type}")
                        else:
                            logger.warning(f"inlineData found but 'data' field is empty")
                    elif "inline_data" in part:
                        # Fallback for snake_case (if API returns it)
                        inline_data = part["inline_data"]
                        mime_type = inline_data.get("mime_type", "image/jpeg")  # Default to JPEG
                        image_data = inline_data.get("data", "")
                        if image_data:
                            image_parts.append(f"data:{mime_type};base64,{image_data}")
                            logger.info(f"Extracted image from Gemini response (snake_case): {len(image_data)} chars of base64 data, mime_type: {mime_type}")
                        else:
                            logger.warning(f"inline_data found but 'data' field is empty")
                    else:
                        logger.warning(f"Part {i} has unknown structure: {part}")
                
                # If we have images, return them (prefer images over text for image generation models)
                if image_parts:
                    if len(image_parts) == 1:
                        # Single image - return as base64 data URL
                        logger.info(f"Returning single image as base64 data URL")
                        return image_parts[0]
                    else:
                        # Multiple images - return as dict with images array
                        result = {
                            "images": image_parts,
                            "text": "\n".join(text_parts) if text_parts else None
                        }
                        logger.info(f"Returning {len(image_parts)} images with text")
                        return result
                
                # Log if we expected images but didn't get any
                if is_image_model and not image_parts:
                    logger.warning(f"Image generation model '{model}' returned text but no images. Text parts: {len(text_parts)}, Parts structure: {[list(p.keys()) for p in parts]}")
                
                # Otherwise return text
                if text_parts:
                    logger.debug(f"Returning text: {len(text_parts)} parts, total length: {sum(len(t) for t in text_parts)}")
                    return "\n".join(text_parts)
                
                # If no text or images, return empty string (not None)
                # This ensures downstream nodes receive a value
                logger.error(f"Gemini returned no content (no text or images). Parts: {len(parts)}, Finish reason: {finish_reason}")
                logger.error(f"   This usually means the API call succeeded but returned empty content. Check the model configuration and prompt.")
                logger.error(f"   Part structures: {[list(p.keys()) for p in parts]}")
                logger.error(f"   Full parts data: {parts}")
                return ""
            else:
                logger.error(f"Candidate has no 'content' or 'parts'. Candidate keys: {list(candidate.keys())}")
                logger.error(f"   Full candidate data: {candidate}")
                return ""
        else:
            # No candidates in response - check for errors first
            if "error" in data:
                error_msg = data["error"].get("message", "Unknown error")
                error_details = data["error"].get("details", [])
                logger.error(f"Gemini API error: {error_msg}, details: {error_details}")
                raise RuntimeError(f"Gemini API error: {error_msg}")
            # No candidates and no error - return empty string instead of None
            logger.error(f"Gemini API response has no candidates. Response keys: {list(data.keys())}")
            logger.error(f"   Full response data: {data}")
            return ""
        
        # Fallback - should never reach here, but ensure we never return None
        logger.error(f"Unexpected Gemini API response format: {data}")
        return ""
    
    async def _execute_custom(self, user_message: Any, model: str) -> Any:
        """Execute using custom OpenAI-compatible API - supports text and vision models"""
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
            logger.debug(f"Custom API system prompt: {self.config.system_prompt}")
        
        # Handle vision models (content is a list) vs text models (content is string)
        if isinstance(user_message, list):
            # Vision model - content is a list of text and image objects
            messages.append({
                "role": "user",
                "content": user_message
            })
            logger.debug(f"Custom API user message (vision): {len(user_message)} items")
            for i, item in enumerate(user_message):
                if item.get("type") == "text":
                    text_preview = item.get("text", "")[:200] + "..." if len(item.get("text", "")) > 200 else item.get("text", "")
                    logger.debug(f"   Item {i}: text ({len(item.get('text', ''))} chars) - {text_preview}")
                elif item.get("type") == "image_url":
                    image_url = item.get("image_url", {}).get("url", "")
                    logger.debug(f"   Item {i}: image_url ({len(image_url)} chars) - {image_url[:100]}...")
        else:
            # Text model - content is a string
            messages.append({
                "role": "user",
                "content": user_message
            })
            user_preview = user_message[:500] + "..." if len(user_message) > 500 else user_message
            logger.debug(f"Custom API user message (text, {len(user_message)} chars): {user_preview}")
        
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
            content = data["choices"][0]["message"]["content"]
            
            # Check if response contains image generation (for future DALL-E support)
            # For now, return text content as-is
            # If content is None, check for image_url or other image formats
            if content is None:
                # Check if there's image data in the response
                message = data["choices"][0]["message"]
                if "image" in message:
                    return message["image"]
                # Return empty string if no content
                return ""
            
            return content
    
    def _build_user_message(self, inputs: Dict[str, Any]) -> Any:
        """Build user message from inputs - can return string or list for vision models"""
        import base64
        
        # Check if any input contains image data
        has_images = False
        image_content = []
        text_parts = []
        
        logger.debug(f"_build_user_message: inputs keys={list(inputs.keys())}")
        
        # Add system prompt as user instruction if provided (some models don't support system prompts)
        # For vision models, we'll add it as text in the user message
        if self.config.system_prompt:
            text_parts.append(self.config.system_prompt)
            logger.debug(f"   Added system prompt to user message: {len(self.config.system_prompt)} chars")
        
        for key, value in inputs.items():
            # Check if value is an image (base64, URL, or binary)
            is_image = False
            image_data = None
            
            if isinstance(value, str):
                # Check for data URL format: data:image/png;base64,...
                if value.startswith('data:image/'):
                    is_image = True
                    image_data = value
                # Check if it's a URL to an image
                elif value.startswith(('http://', 'https://')) and any(ext in value.lower() for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']):
                    is_image = True
                    image_data = value
            elif isinstance(value, bytes):
                # Binary image data - convert to base64
                try:
                    # Check if it's an image by magic bytes
                    if value[:4] == b'\x89PNG' or value[:2] == b'\xff\xd8' or value[:4] == b'GIF8':
                        mimetype = 'image/png' if value[:4] == b'\x89PNG' else ('image/jpeg' if value[:2] == b'\xff\xd8' else 'image/gif')
                        base64_data = base64.b64encode(value).decode('utf-8')
                        image_data = f"data:{mimetype};base64,{base64_data}"
                        is_image = True
                except Exception:
                    pass
            elif isinstance(value, dict):
                # Check for image keys in dict
                if 'image' in value:
                    image_value = value['image']
                    if isinstance(image_value, str) and image_value.startswith('data:image/'):
                        is_image = True
                        image_data = image_value
                    elif isinstance(image_value, bytes):
                        try:
                            mimetype = 'image/png' if image_value[:4] == b'\x89PNG' else ('image/jpeg' if image_value[:2] == b'\xff\xd8' else 'image/gif')
                            base64_data = base64.b64encode(image_value).decode('utf-8')
                            image_data = f"data:{mimetype};base64,{base64_data}"
                            is_image = True
                        except Exception:
                            pass
                elif 'image_data' in value:
                    image_value = value['image_data']
                    if isinstance(image_value, str):
                        try:
                            # Try to decode and re-encode as data URL
                            decoded = base64.b64decode(image_value)
                            mimetype = 'image/png' if decoded[:4] == b'\x89PNG' else ('image/jpeg' if decoded[:2] == b'\xff\xd8' else 'image/gif')
                            image_data = f"data:{mimetype};base64,{image_value}"
                            is_image = True
                        except Exception:
                            pass
            
            if is_image and image_data:
                has_images = True
                image_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": image_data
                    }
                })
                # Add text description if key is descriptive
                if key not in ['data', 'output', 'image', 'image_data']:
                    text_parts.append(f"{key}:")
            else:
                # Regular text input - skip 'source' key when we have images (it's metadata)
                if has_images and key == 'source':
                    logger.debug(f"   Skipping 'source' key (metadata) when images present")
                    continue
                text_parts.append(f"{key}: {value}")
                logger.debug(f"   Added text from key '{key}': {str(value)[:50]}...")
        
        # If we have images, return structured content for vision models
        if has_images:
            content = []
            if text_parts:
                # Combine all text parts (prompt + input data) with double newline to separate prompt from data
                text_content = "\n\n".join(text_parts)
                content.append({
                    "type": "text",
                    "text": text_content
                })
                logger.info(f"Built vision message: {len(image_content)} images, text length: {len(text_content)} (includes prompt: {bool(self.config.system_prompt)})")
            else:
                # If no text parts but we have a system prompt, use it
                if self.config.system_prompt:
                    content.append({
                        "type": "text",
                        "text": self.config.system_prompt
                    })
                    logger.info(f"Built vision message: {len(image_content)} images, using system prompt only")
                else:
                    content.append({
                        "type": "text",
                        "text": "Process this image"
                    })
                    logger.debug(f"Built vision message: {len(image_content)} images, no text (using default)")
            content.extend(image_content)
            return content
        
        # Otherwise, return plain text message
        # Combine prompt with input data
        if len(inputs) == 1:
            input_value = str(list(inputs.values())[0])
            if text_parts:
                # We have a prompt, combine it with the input (prompt first, then data)
                text_result = "\n\n".join(text_parts)
            else:
                text_result = input_value
            logger.info(f"Built text message (single input): length={len(text_result)} (includes prompt: {bool(self.config.system_prompt)})")
            return text_result
        else:
            # Multiple inputs - combine prompt with all inputs
            if text_parts:
                # text_parts already contains the prompt and input data
                text_result = "\n\n".join(text_parts)
            else:
                # No prompt, just format inputs
                parts = []
                for key, value in inputs.items():
                    parts.append(f"{key}: {value}")
                text_result = "\n".join(parts)
            logger.info(f"Built text message (multiple inputs): length={len(text_result)} (includes prompt: {bool(self.config.system_prompt)})")
            return text_result


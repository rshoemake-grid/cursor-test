"""
Unified LLM Agent - Supports OpenAI, Anthropic, Gemini, and Custom providers.
Uses provider strategy pattern (OCP) and injectable provider resolution (DIP).
"""
from typing import Any, Dict, Optional, Callable, Awaitable
import os
import asyncio
from .base import BaseAgent
from ..models.schemas import Node
from ..utils.logger import get_logger
from ..utils.agent_config_utils import get_node_config
from ..utils.message_builder import build_user_message

logger = get_logger(__name__)


class UnifiedLLMAgent(BaseAgent):
    """Agent that uses configured LLM provider for processing"""

    def __init__(
        self,
        node: Node,
        llm_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        log_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None,
        provider_resolver: Optional[Callable[[str, Optional[str]], Optional[Dict[str, Any]]]] = None,
        settings_service: Optional[Any] = None,
    ):
        super().__init__(node, log_callback=log_callback)
        self.provider_resolver = provider_resolver
        self._settings_service = settings_service

        from ..models.schemas import AgentConfig
        agent_config = get_node_config(node, "agent_config", AgentConfig)
        if not agent_config:
            raise ValueError(f"Node {node.id} requires agent_config. Please configure the agent settings in the node properties.")

        self.config = agent_config
        self.llm_config = llm_config or self._get_fallback_config()
        self.user_id = user_id
        
        # Check if this should be an ADK agent
        agent_type = getattr(agent_config, 'agent_type', 'workflow')
        if agent_type == 'adk':
            # Delegate to ADKAgent - this is handled by the registry, but we can check here too
            logger.info(f"Node {node.id} configured as ADK agent, but UnifiedLLMAgent was called. This should be handled by registry.")
        
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
        """Find the provider that owns the given model name (DIP: uses injectable resolver or settings_service)."""
        lookup_user_id = self.user_id if hasattr(self, "user_id") and self.user_id else user_id
        if self.provider_resolver:
            return self.provider_resolver(model_name, lookup_user_id)
        if self._settings_service:
            return self._settings_service.get_provider_for_model(model_name, lookup_user_id)
        from ..services.settings_service import SettingsService
        return SettingsService().get_provider_for_model(model_name, lookup_user_id)
    
    def _validate_api_key(self, api_key: str) -> None:
        """Validate that API key is not a placeholder - only flag obvious placeholders"""
        from ..utils.settings_utils import is_valid_api_key
        
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
        
        # Use shared utility for additional validation
        if not is_valid_api_key(api_key):
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
        
        # Build the prompt from inputs (SRP: delegated to message_builder)
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
            
            from .llm_providers.registry import ProviderRegistry
            strategy = ProviderRegistry.get(provider_type)
            if not strategy:
                raise ValueError(f"Unknown provider type: {provider_type}")
            if provider_type == "gemini" and self.log_callback:
                try:
                    asyncio.create_task(self.log_callback("INFO", self.node_id, f"Calling Gemini API with model '{model}'"))
                except Exception:
                    pass
            result = await strategy.execute(user_message, model, self.llm_config, self.config)
            
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

    def _build_user_message(self, inputs: Dict[str, Any]) -> Any:
        """Build user message from inputs. Delegates to message_builder (SRP)."""
        return build_user_message(inputs, system_prompt=self.config.system_prompt)


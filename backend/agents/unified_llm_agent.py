"""
Unified LLM Agent - Supports OpenAI, Anthropic, Gemini, and Custom providers.
Uses provider strategy pattern (OCP) and injectable provider resolution (DIP).
"""
import os
from typing import Any, Awaitable, Callable, Dict, Optional

from .base import BaseAgent
from ..models.schemas import Node
from ..utils.agent_config_utils import get_node_config
from ..utils.env_config_utils import get_llm_fallback_config_from_env
from ..utils.logger import get_logger
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
        self.llm_config = llm_config or get_llm_fallback_config_from_env()
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
    
    def _find_provider_for_model(self, model_name: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Find the provider that owns the given model name (DIP: uses injectable resolver or settings_service)."""
        lookup_user_id = self.user_id if hasattr(self, "user_id") and self.user_id else user_id
        if self.provider_resolver:
            return self.provider_resolver(model_name, lookup_user_id)
        if self._settings_service:
            return self._settings_service.get_provider_for_model(model_name, lookup_user_id)
        # Fallback for legacy callers that don't inject settings_service (DIP: prefer injection)
        logger.warning(
            "UnifiedLLMAgent: provider_resolver and settings_service not injected. "
            "Using SettingsService() fallback. Pass settings_service via AgentRegistry.get_agent for DIP compliance."
        )
        from ..services.settings_service import SettingsService
        return SettingsService().get_provider_for_model(model_name, lookup_user_id)

    def _resolve_gemini_studio_api_key(self) -> Optional[str]:
        """
        Google AI Studio key only if it passes placeholder checks — same idea as LLMClientFactory:
        invalid/placeholder keys are omitted so execution uses Vertex + ADC like chat.
        """
        from ..utils.settings_utils import is_valid_api_key

        key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
        if key and is_valid_api_key(key):
            return key
        try:
            from ..config import get_settings

            gk = (get_settings().gemini_api_key or "").strip()
            if gk and is_valid_api_key(gk):
                return gk
        except Exception:
            pass
        if self._settings_service is not None:
            try:
                k = self._settings_service.get_gemini_studio_api_key(self.user_id)
                if k:
                    return k.strip()
            except Exception:
                pass
        return None

    def _validate_api_key(self, api_key: str) -> None:
        """Validate that API key is not a placeholder - only flag obvious placeholders"""
        from ..utils.settings_utils import is_valid_api_key

        api_key = (api_key or "").strip()
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
            
            # Validate the API key from the model-specific provider (Gemini may use Vertex + ADC with no key)
            api_key = model_provider_config.get("api_key", "")
            ptype = str(provider_type).lower()
            if not api_key or not str(api_key).strip():
                if ptype == "gemini":
                    from ..utils import vertex_gemini as _vx_gem

                    if not _vx_gem.vertex_ai_configured():
                        raise ValueError(
                            f"Provider '{provider_type}' for model '{model}' has no API key configured. "
                            "Add a Gemini API key, or set GOOGLE_CLOUD_PROJECT / GCP_PROJECT and "
                            "Application Default Credentials for Vertex AI."
                        )
                else:
                    raise ValueError(
                        f"Provider '{provider_type}' for model '{model}' has no API key configured. "
                        "Please go to Settings, add a valid API key for this provider, enable it, and click 'Sync Now'."
                    )
            else:
                logger.debug(f"Using API key from provider '{provider_type}' for model '{model}'")
                try:
                    self._validate_api_key(api_key)
                except ValueError as e:
                    logger.error(f"API key validation failed for provider '{provider_type}': {str(e)}")
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
                if suggested_provider == "gemini":
                    from ..utils import vertex_gemini as _vertex_gemini
                    from ..utils.provider_utils import build_provider_config

                    studio_key = self._resolve_gemini_studio_api_key()
                    if studio_key:
                        logger.info(
                            "Model '%s' is not listed on a provider's model list; "
                            "using Gemini API key from env/settings (AI Studio), same as workflow chat.",
                            model,
                        )
                        provider_type = "gemini"
                        self.llm_config = {
                            **self.llm_config,
                            **build_provider_config("gemini", studio_key, None, model),
                        }
                    elif _vertex_gemini.vertex_ai_configured():
                        logger.info(
                            "Model '%s' is not listed on an enabled Gemini provider in Settings; "
                            "using Vertex AI with Application Default Credentials.",
                            model,
                        )
                        provider_type = "gemini"
                        self.llm_config = {
                            **self.llm_config,
                            **build_provider_config("gemini", "", None, model),
                        }
                    else:
                        logger.warning(
                            "Model '%s' suggests gemini provider, but using %s provider",
                            model,
                            provider_type,
                        )
                        logger.warning(
                            "Vertex AI is not configured: set GOOGLE_CLOUD_PROJECT (or GCP_PROJECT), "
                            "or ensure Application Default Credentials yield a project "
                            "(e.g. gcloud auth application-default login). "
                            "Alternatively configure a Gemini API key in Settings.",
                        )
                        raise ValueError(
                            f"Model '{model}' not found in any enabled provider. "
                            f"This model appears to be a gemini model, but no gemini provider "
                            f"with this model is configured. Please go to Settings, add a gemini provider "
                            f"with model '{model}' in its models list, enable it, and click 'Sync Now'."
                        )
                else:
                    logger.warning(
                        f"Model '{model}' suggests {suggested_provider} provider, but using {provider_type} provider"
                    )
                    logger.warning(
                        f"   This may cause errors. Please configure a {suggested_provider} provider with model '{model}' in Settings."
                    )
                    raise ValueError(
                        f"Model '{model}' not found in any enabled provider. "
                        f"This model appears to be a {suggested_provider} model, but no {suggested_provider} provider "
                        f"with this model is configured. Please go to Settings, add a {suggested_provider} provider "
                        f"with model '{model}' in its models list, enable it, and click 'Sync Now'."
                    )
            
            # Validate the API key from the default provider (Gemini may use empty key + Vertex ADC)
            api_key = self.llm_config.get("api_key", "")
            if (
                provider_type == "gemini"
                and (not api_key or not str(api_key).strip())
            ):
                from ..utils import vertex_gemini as _vertex_gemini

                if not _vertex_gemini.vertex_ai_configured():
                    raise ValueError(
                        "Gemini model has no API key and Vertex AI is not configured "
                        "(set GOOGLE_CLOUD_PROJECT or GCP_PROJECT, or ADC with a resolvable project, "
                        "e.g. gcloud auth application-default login), or add a Gemini API key in Settings."
                    )
            elif not api_key:
                raise ValueError(
                    f"Default provider '{provider_type}' has no API key configured. "
                    "Please go to Settings, add a valid API key for this provider, enable it, and click 'Sync Now'."
                )
            else:
                try:
                    self._validate_api_key(api_key)
                except ValueError as e:
                    raise ValueError(
                        f"Default provider '{provider_type}' has an invalid API key. "
                        "Please go to Settings, update the API key for this provider with a valid key, enable it, and click 'Sync Now'."
                    ) from e
            
            logger.warning(f"No provider found for model '{model}', using default provider: {provider_type}")
        
        # Execute based on provider type and ensure we never return None
        try:
            # Forward key logs to execution console (await so they appear before long LLM I/O)
            if self.log_callback:
                try:
                    await self.log_callback(
                        "INFO",
                        self.node_id,
                        f"Executing with provider '{provider_type}' and model '{model}'",
                    )
                except Exception as e:
                    logger.debug(f"Log callback failed (non-fatal): {e}")
            logger.info(f"Executing with provider '{provider_type}' and model '{model}'")

            from .llm_providers.registry import ProviderRegistry
            strategy = ProviderRegistry.get(provider_type)
            if not strategy:
                raise ValueError(f"Unknown provider type: {provider_type}")
            if provider_type == "gemini" and self.log_callback:
                try:
                    await self.log_callback(
                        "INFO",
                        self.node_id,
                        f"Calling Gemini API with model '{model}' (request may take up to several minutes)",
                    )
                except Exception as e:
                    logger.debug(f"Log callback failed (non-fatal): {e}")
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


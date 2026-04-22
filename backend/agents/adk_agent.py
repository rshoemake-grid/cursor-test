"""
Google ADK Agent - Wrapper around Google Agent Development Kit
Supports ADK agent configuration and execution
"""
from typing import Any, Callable, Dict, List, Optional, Awaitable, Sequence
import asyncio
import json
import os
import re
import uuid

from ..utils.env_config_utils import get_llm_fallback_config_from_env
from ..utils.agent_config_utils import get_node_config
from .base import BaseAgent
from ..models.schemas import AgentConfig, Node
from ..utils.logger import get_logger

logger = get_logger(__name__)


def extract_assistant_text_from_adk_events(events: Optional[List[Any]] = None) -> str:
    """
    Build a single assistant reply string from google-adk 1.x Event stream.
    Keeps only model-role content; skips user/tool-only events.
    """
    chunks: List[str] = []
    for ev in events or []:
        content = getattr(ev, "content", None)
        if not content or not getattr(content, "parts", None):
            continue
        role = getattr(content, "role", None)
        if role is not None and role != "model":
            continue
        for part in content.parts:
            text = getattr(part, "text", None)
            if text:
                chunks.append(text)
    return "\n".join(chunks).strip()


def _sanitize_adk_app_name(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9_-]+", "_", (name or "workflow_adk").strip())
    return (s[:60] or "workflow_adk").strip("_") or "workflow_adk"


def _ensure_vertex_env_if_adc_json_present() -> None:
    """
    Prefer Vertex + Application Default Credentials when GOOGLE_APPLICATION_CREDENTIALS points at a
    real file (service-account JSON). Matches Java AdkAgentRunner: ADC JSON + project before API key.

    google.genai honors GOOGLE_GENAI_USE_VERTEXAI, GOOGLE_CLOUD_PROJECT, and ADC.
    """
    cred_path = (os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "").strip()
    if not cred_path or not os.path.isfile(cred_path):
        return
    project = (os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCP_PROJECT") or "").strip()
    if not project:
        try:
            with open(cred_path, encoding="utf-8") as f:
                data = json.load(f)
            project = (data.get("project_id") or "").strip()
        except (OSError, json.JSONDecodeError, TypeError):
            project = ""
    if project:
        os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project)
        os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"


def configure_google_genai_env_for_adk(
    *,
    auth_configs: Sequence[Optional[Dict[str, Any]]],
    agent_model: str,
) -> None:
    """
    Configure os.environ for google-genai / google-adk to match workflow chat + LLMClientFactory:

    - If a Gemini **API key** exists (Settings or env), use the Gemini Developer API.
    - Otherwise use **Vertex AI + Application Default Credentials** (same project/location
      resolution as ``resolve_project_and_location`` — gcloud ADC, service-account JSON, etc.).

    Without this, ADK often defaults to the Developer API and raises "No API key was provided"
    even when chat works via Vertex.
    """
    model = (agent_model or "").strip()

    studio_key = ""
    for cfg in auth_configs:
        if not cfg:
            continue
        if str(cfg.get("type") or "").lower() != "gemini":
            continue
        studio_key = (cfg.get("api_key") or cfg.get("apiKey") or "").strip()
        if studio_key:
            break
    if not studio_key:
        studio_key = (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "").strip()

    if studio_key:
        os.environ.pop("GOOGLE_GENAI_USE_VERTEXAI", None)
        os.environ["GOOGLE_API_KEY"] = studio_key
        logger.info("ADK/genai: Gemini Developer API (API key from settings or environment)")
        return

    try:
        from ..utils.vertex_gemini import resolve_project_and_location
    except Exception as exc:  # pragma: no cover - import guard
        logger.warning("ADK/genai: vertex_gemini unavailable (%s); trying credentials-json hook only", exc)
        _ensure_vertex_env_if_adc_json_present()
        return

    try:
        project, location = resolve_project_and_location(model if model else None)
    except RuntimeError as exc:
        logger.warning(
            "ADK/genai: Vertex project/location not resolved (%s); trying GOOGLE_APPLICATION_CREDENTIALS hook",
            exc,
        )
        _ensure_vertex_env_if_adc_json_present()
        return

    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
    os.environ["GOOGLE_CLOUD_PROJECT"] = project
    os.environ["GOOGLE_CLOUD_LOCATION"] = location
    logger.info(
        "ADK/genai: Vertex AI + ADC (project=%s location=%s) — same resolution as workflow chat",
        project,
        location,
    )


class ADKAgent(BaseAgent):
    """Agent that uses Google ADK for execution"""
    
    def __init__(
        self,
        node: Node,
        llm_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        log_callback: Optional[Callable[[str, str, str], Awaitable[None]]] = None,
        settings_service: Optional[Any] = None,
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
        
        # Get agent config (top-level or React Flow data.*)
        agent_config = get_node_config(node, "agent_config", AgentConfig)
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
        self.llm_config = llm_config or get_llm_fallback_config_from_env()
        self.user_id = user_id
        self._settings_service = settings_service

        # Initialize ADK agent
        if self._adk_available:
            self._apply_genai_env()
            self._init_adk_agent()
        else:
            logger.warning("ADK agent initialized but ADK library not available")

    def _auth_configs_for_genai(self) -> List[Optional[Dict[str, Any]]]:
        """Prefer workflow-chat LLM config, then active provider, then executor/env fallback (Gemini auth)."""
        ordered: List[Optional[Dict[str, Any]]] = []
        if self._settings_service is not None:
            try:
                chat = self._settings_service.get_llm_config_for_workflow_chat(self.user_id)
                if chat:
                    ordered.append(chat)
            except Exception as exc:
                logger.debug("get_llm_config_for_workflow_chat failed: %s", exc)
            try:
                active = self._settings_service.get_active_llm_config(self.user_id)
                if active:
                    ordered.append(active)
            except Exception as exc:
                logger.debug("get_active_llm_config failed: %s", exc)
        if self.llm_config:
            ordered.append(self.llm_config)
        fb = get_llm_fallback_config_from_env()
        if fb:
            ordered.append(fb)
        return ordered

    def _apply_genai_env(self) -> None:
        configure_google_genai_env_for_adk(
            auth_configs=self._auth_configs_for_genai(),
            agent_model=self.config.model,
        )
        _ensure_vertex_env_if_adc_json_present()

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
            self._apply_genai_env()
            # google-adk 1.x: LlmAgent exposes run_async(InvocationContext), not run()/execute().
            # InMemoryRunner.run_debug is the supported path for single-turn / workflow use.
            from google.adk.runners import InMemoryRunner

            app_name = _sanitize_adk_app_name(
                self.adk_config.name or self.node.name or f"agent_{self.node_id}"
            )
            runner = InMemoryRunner(agent=self.adk_agent, app_name=app_name)
            session_id = f"wf_{self.node_id}_{uuid.uuid4().hex[:16]}"
            events = await runner.run_debug(
                adk_input,
                user_id=self.user_id or "workflow_user",
                session_id=session_id,
                quiet=True,
            )
            text = extract_assistant_text_from_adk_events(events)
            if not text:
                logger.warning(
                    "ADK run_debug returned no model text events; check API keys, model id, and ADK logs"
                )
            # Match UnifiedLLMAgent: plain string for downstream nodes / storage
            logger.info(
                "ADK agent execution completed, extracted text length: %s",
                len(text) if text else 0,
            )
            return text if text else ""
            
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

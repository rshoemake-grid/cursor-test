"""
Unit tests for ADK Agent implementation
Tests ADKAgent class, ADKAgentConfig schema, and AgentRegistry routing
"""
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from typing import Dict, Any

from backend.agents.adk_agent import ADKAgent
from backend.agents.registry import AgentRegistry
from backend.models.schemas import (
    Node, NodeType, AgentConfig, ADKAgentConfig, InputMapping
)


class TestADKAgentConfig:
    """Tests for ADKAgentConfig schema"""
    
    def test_adk_agent_config_minimal(self):
        """Test ADKAgentConfig with minimal required fields"""
        config = ADKAgentConfig(name="test_agent")
        assert config.name == "test_agent"
        assert config.description is None
        assert config.instruction is None
        assert config.sub_agents == []
        assert config.adk_tools == []
        assert config.yaml_config is None
    
    def test_adk_agent_config_full(self):
        """Test ADKAgentConfig with all fields"""
        config = ADKAgentConfig(
            name="test_agent",
            description="Test description",
            instruction="You are a test agent",
            sub_agents=["sub_agent_1", "sub_agent_2"],
            adk_tools=["google_search", "load_web_page"],
            yaml_config="name: test_agent\nmodel: gemini-2.5-flash"
        )
        assert config.name == "test_agent"
        assert config.description == "Test description"
        assert config.instruction == "You are a test agent"
        assert config.sub_agents == ["sub_agent_1", "sub_agent_2"]
        assert config.adk_tools == ["google_search", "load_web_page"]
        assert config.yaml_config is not None
    
    def test_adk_agent_config_name_required(self):
        """Test that name is required"""
        with pytest.raises(Exception):  # Pydantic validation error
            ADKAgentConfig()


class TestAgentConfigWithADK:
    """Tests for AgentConfig with ADK support"""
    
    def test_agent_config_default_workflow(self):
        """Test AgentConfig defaults to workflow type"""
        config = AgentConfig(model="gpt-4o-mini")
        assert config.agent_type == "workflow"
        assert config.adk_config is None
    
    def test_agent_config_adk_type(self):
        """Test AgentConfig with ADK type"""
        adk_config = ADKAgentConfig(name="adk_agent")
        config = AgentConfig(
            agent_type="adk",
            model="gemini-2.5-flash",
            adk_config=adk_config
        )
        assert config.agent_type == "adk"
        assert config.adk_config is not None
        assert config.adk_config.name == "adk_agent"
    
    def test_agent_config_workflow_type(self):
        """Test AgentConfig explicitly set to workflow"""
        config = AgentConfig(
            agent_type="workflow",
            model="gpt-4o-mini"
        )
        assert config.agent_type == "workflow"
        assert config.adk_config is None


class TestADKAgentInitialization:
    """Tests for ADKAgent initialization"""

    
    def create_adk_node(self, agent_type="adk", adk_config=None):
        """Helper to create ADK node"""
        if adk_config is None:
            adk_config = ADKAgentConfig(name="test_agent")
        
        agent_config = AgentConfig(
            agent_type=agent_type,
            model="gemini-2.5-flash",
            system_prompt="Test prompt",
            adk_config=adk_config
        )
        
        return Node(
            id="test-node-1",
            type=NodeType.AGENT,
            name="Test Agent",
            agent_config=agent_config,
            inputs=[]
        )
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_adk_agent_init_with_adk_available(self, mock_adk_agent, mock_init):
        """Test ADKAgent initialization when ADK is available"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        assert agent.node == node
        assert agent.config.agent_type == "adk"
        assert agent.adk_config.name == "test_agent"
    
    def test_adk_agent_init_missing_agent_config(self):
        """Test ADKAgent raises error when agent_config is missing"""
        node = Node(
            id="test-node-1",
            type=NodeType.AGENT,
            agent_config=None,
            inputs=[]
        )
        
        with pytest.raises(ValueError, match="requires agent_config"):
            ADKAgent(node)
    
    def test_adk_agent_init_missing_adk_config(self):
        """Test ADKAgent raises error when adk_config is missing"""
        agent_config = AgentConfig(
            agent_type="adk",
            model="gemini-2.5-flash"
        )
        node = Node(
            id="test-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
        
        with pytest.raises(ValueError, match="requires adk_config"):
            ADKAgent(node)
    
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test-key'})
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_get_fallback_config_with_gemini_key(self, mock_adk_agent, mock_init):
        """Test fallback config uses GEMINI_API_KEY"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        config = agent._get_fallback_config()
        assert config is not None
        assert config["type"] == "gemini"
        assert config["api_key"] == "test-key"
    
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'google-key'})
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_get_fallback_config_with_google_key(self, mock_adk_agent, mock_init):
        """Test fallback config uses GOOGLE_API_KEY"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        config = agent._get_fallback_config()
        assert config is not None
        assert config["type"] == "gemini"
        assert config["api_key"] == "google-key"
    
    @patch.dict('os.environ', {}, clear=True)
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_get_fallback_config_no_key(self, mock_adk_agent, mock_init):
        """Test fallback config returns None when no key"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        config = agent._get_fallback_config()
        assert config is None


class TestADKAgentToolLoading:
    """Tests for ADK tool loading"""

    
    def create_adk_node_with_tools(self, tools):
        """Helper to create ADK node with tools"""
        adk_config = ADKAgentConfig(
            name="test_agent",
            adk_tools=tools
        )
        agent_config = AgentConfig(
            agent_type="adk",
            model="gemini-2.5-flash",
            adk_config=adk_config
        )
        return Node(
            id="test-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_load_adk_tools_empty_list(self, mock_adk_agent, mock_init):
        """Test loading empty tool list"""
        node = self.create_adk_node_with_tools([])
        agent = ADKAgent(node)
        
        tools = agent._load_adk_tools([])
        assert tools == []
    
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    @patch('backend.agents.adk_agent.ADKAgent._get_adk_tool')
    def test_load_adk_tools_success(self, mock_get_tool, mock_init):
        """Test loading tools successfully"""
        mock_tool = Mock()
        mock_get_tool.return_value = mock_tool
        
        node = self.create_adk_node_with_tools(["google_search"])
        agent = ADKAgent(node)
        agent._adk_available = True
        
        tools = agent._load_adk_tools(["google_search"])
        assert len(tools) == 1
        assert tools[0] == mock_tool
        mock_get_tool.assert_called_once_with("google_search")
    
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    @patch('backend.agents.adk_agent.ADKAgent._get_adk_tool')
    def test_load_adk_tools_not_found(self, mock_get_tool, mock_init):
        """Test loading non-existent tool"""
        mock_get_tool.return_value = None
        
        node = self.create_adk_node_with_tools(["unknown_tool"])
        agent = ADKAgent(node)
        agent._adk_available = True
        
        tools = agent._load_adk_tools(["unknown_tool"])
        assert tools == []


class TestADKAgentInputOutputConversion:
    """Tests for input/output conversion"""

    
    def create_adk_node(self):
        """Helper to create ADK node"""
        adk_config = ADKAgentConfig(name="test_agent")
        agent_config = AgentConfig(
            agent_type="adk",
            model="gemini-2.5-flash",
            adk_config=adk_config
        )
        return Node(
            id="test-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_inputs_single_data(self, mock_adk_agent, mock_init):
        """Test converting single 'data' input"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        inputs = {"data": "test message"}
        result = agent._convert_inputs_to_adk_format(inputs)
        assert result == "test message"
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_inputs_single_other(self, mock_adk_agent, mock_init):
        """Test converting single non-data input"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        inputs = {"query": "test query"}
        result = agent._convert_inputs_to_adk_format(inputs)
        assert result == "test query"
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_inputs_multiple(self, mock_adk_agent, mock_init):
        """Test converting multiple inputs"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        inputs = {"key1": "value1", "key2": "value2"}
        result = agent._convert_inputs_to_adk_format(inputs)
        assert "key1: value1" in result
        assert "key2: value2" in result
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_result_dict_with_output(self, mock_adk_agent, mock_init):
        """Test converting dict result with 'output' key"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        result = {"output": "test output"}
        output = agent._convert_adk_result_to_output(result)
        assert output == {"output": "test output"}
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_result_dict_with_content(self, mock_adk_agent, mock_init):
        """Test converting dict result with 'content' key"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        result = {"content": "test content"}
        output = agent._convert_adk_result_to_output(result)
        assert output == {"output": "test content"}
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_result_string(self, mock_adk_agent, mock_init):
        """Test converting string result"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        result = "test string"
        output = agent._convert_adk_result_to_output(result)
        assert output == {"output": "test string"}
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_convert_result_other_type(self, mock_adk_agent, mock_init):
        """Test converting other type result"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        
        result = 12345
        output = agent._convert_adk_result_to_output(result)
        assert output == {"output": "12345"}


class TestADKAgentExecution:
    """Tests for ADKAgent execution"""

    
    def create_adk_node(self):
        """Helper to create ADK node"""
        adk_config = ADKAgentConfig(name="test_agent")
        agent_config = AgentConfig(
            agent_type="adk",
            model="gemini-2.5-flash",
            adk_config=adk_config
        )
        return Node(
            id="test-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
    
    @pytest.mark.asyncio
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    async def test_execute_adk_not_available(self, mock_init):
        """Test execute raises error when ADK not available"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        agent._adk_available = False
        
        with pytest.raises(RuntimeError, match="ADK library not available"):
            await agent.execute({"data": "test"})
    
    @pytest.mark.asyncio
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    async def test_execute_missing_inputs(self, mock_init):
        """Test execute validates inputs"""
        node = self.create_adk_node()
        node.inputs = [InputMapping(name="required_input")]
        agent = ADKAgent(node)
        agent._adk_available = True
        
        with pytest.raises(ValueError, match="Missing required input"):
            await agent.execute({})
    
    @pytest.mark.asyncio
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    async def test_execute_async_run(self, mock_init):
        """Test execute with async run method"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        agent._adk_available = True
        
        # Mock ADK agent with async run
        mock_adk_agent = AsyncMock()
        mock_adk_agent.run = AsyncMock(return_value="test result")
        agent.adk_agent = mock_adk_agent
        
        # Mock asyncio.iscoroutinefunction to return True for async
        with patch('asyncio.iscoroutinefunction', return_value=True):
            result = await agent.execute({"data": "test input"})
        
        assert result == {"output": "test result"}
        mock_adk_agent.run.assert_called_once_with("test input")
    
    @pytest.mark.asyncio
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    async def test_execute_sync_run(self, mock_init):
        """Test execute with sync run method"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        agent._adk_available = True
        
        # Mock ADK agent with sync run
        mock_adk_agent = Mock()
        mock_adk_agent.run = Mock(return_value="test result")
        agent.adk_agent = mock_adk_agent
        
        # Mock asyncio.iscoroutinefunction to return False for sync
        # Mock run_in_executor to execute sync function
        with patch('asyncio.iscoroutinefunction', return_value=False),              patch('asyncio.get_event_loop') as mock_get_loop:
            mock_loop = Mock()
            mock_loop.run_in_executor = AsyncMock(return_value="test result")
            mock_get_loop.return_value = mock_loop
            
            result = await agent.execute({"data": "test input"})
        
        assert result == {"output": "test result"}
    
    @pytest.mark.asyncio
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    async def test_execute_no_run_method(self, mock_init):
        """Test execute raises error when no run/execute method"""
        node = self.create_adk_node()
        agent = ADKAgent(node)
        agent._adk_available = True
        
        # Mock ADK agent without run or execute
        mock_adk_agent = Mock()
        delattr(mock_adk_agent, 'run')
        delattr(mock_adk_agent, 'execute')
        agent.adk_agent = mock_adk_agent
        
        with pytest.raises(RuntimeError, match="does not have 'run' or 'execute' method"):
            await agent.execute({"data": "test input"})


class TestAgentRegistryADKRouting:
    """Tests for AgentRegistry routing to ADKAgent"""

    
    def create_workflow_node(self):
        """Helper to create workflow agent node"""
        agent_config = AgentConfig(
            agent_type="workflow",
            model="gpt-4o-mini"
        )
        return Node(
            id="workflow-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
    
    def create_adk_node(self):
        """Helper to create ADK agent node"""
        adk_config = ADKAgentConfig(name="adk_agent")
        agent_config = AgentConfig(
            agent_type="adk",
            model="gemini-2.5-flash",
            adk_config=adk_config
        )
        return Node(
            id="adk-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
    
    def test_registry_routes_workflow_agent(self):
        """Test registry routes workflow agent to UnifiedLLMAgent"""
        node = self.create_workflow_node()
        llm_config = {"type": "openai", "api_key": "test-key"}
        
        agent = AgentRegistry.get_agent(node, llm_config=llm_config)
        
        from backend.agents.unified_llm_agent import UnifiedLLMAgent
        assert isinstance(agent, UnifiedLLMAgent)
    
    @patch('google.adk.agents.llm_agent.Agent', new_callable=Mock)
    @patch('backend.agents.adk_agent.ADKAgent._init_adk_agent')
    def test_registry_routes_adk_agent(self, mock_adk_agent, mock_init):
        """Test registry routes ADK agent to ADKAgent"""
        node = self.create_adk_node()
        llm_config = {"type": "gemini", "api_key": "test-key"}
        
        agent = AgentRegistry.get_agent(node, llm_config=llm_config)
        
        assert isinstance(agent, ADKAgent)
        assert agent.config.agent_type == "adk"
    
    def test_registry_defaults_to_workflow(self):
        """Test registry defaults to workflow when agent_type not specified"""
        agent_config = AgentConfig(model="gpt-4o-mini")  # No agent_type
        node = Node(
            id="default-node-1",
            type=NodeType.AGENT,
            agent_config=agent_config,
            inputs=[]
        )
        llm_config = {"type": "openai", "api_key": "test-key"}
        
        agent = AgentRegistry.get_agent(node, llm_config=llm_config)
        
        from backend.agents.unified_llm_agent import UnifiedLLMAgent
        assert isinstance(agent, UnifiedLLMAgent)

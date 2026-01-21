"""Tests for UnifiedLLMAgent vision model support"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
import base64

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def vision_node():
    """Create a vision model node"""
    config = AgentConfig(
        model="gpt-4-vision-preview",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Vision Agent",
        agent_config=config
    )
    return node


@pytest.fixture
def mock_llm_config():
    """Create mock LLM config"""
    return {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4-vision-preview"
    }


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_openai_vision_with_multiple_images(vision_node, mock_llm_config):
    """Test UnifiedLLMAgent with multiple images"""
    agent = UnifiedLLMAgent(vision_node, llm_config=mock_llm_config)
    
    # Mock httpx response
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{"message": {"content": "I see multiple images"}}]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        # Test with multiple images
        vision_input = [
            {"type": "text", "text": "Compare these images"},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64,image1"}},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64,image2"}}
        ]
        result = await agent.execute({"input": vision_input})
        assert result == "I see multiple images"


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message_with_dict_image(vision_node, mock_llm_config):
    """Test building user message with image in dict"""
    agent = UnifiedLLMAgent(vision_node, llm_config=mock_llm_config)
    
    inputs = {
        "input": "What's in this image?",
        "image_data": {
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message_with_bytes_in_dict(vision_node, mock_llm_config):
    """Test building user message with bytes image in dict"""
    agent = UnifiedLLMAgent(vision_node, llm_config=mock_llm_config)
    
    # PNG magic bytes
    png_bytes = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
    inputs = {
        "input": "Process image",
        "data": {
            "image": png_bytes
        }
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_anthropic_vision(vision_node):
    """Test UnifiedLLMAgent execution with Anthropic vision model"""
    config = AgentConfig(
        model="claude-3-5-sonnet-20241022",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Vision Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "anthropic",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.anthropic.com/v1",
        "model": "claude-3-5-sonnet-20241022"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response for Anthropic vision
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "content": [{"text": "I see an image"}]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            # Test with vision input
            vision_input = [
                {"type": "text", "text": "What's in this image?"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
            ]
            result = await agent.execute({"input": vision_input})
            assert result == "I see an image"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_gemini_multiple_images(vision_node):
    """Test UnifiedLLMAgent with Gemini and multiple images"""
    config = AgentConfig(
        model="gemini-2.0-flash-exp",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Vision Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.0-flash-exp"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response for Gemini
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [
                    {"text": "I see multiple images"}
                ]
            }
        }]
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            # Test with multiple images
            vision_input = [
                {"type": "text", "text": "Compare images"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,img1"}},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,img2"}}
            ]
            result = await agent.execute({"input": vision_input})
            assert result == "I see multiple images"


@pytest.mark.asyncio
async def test_unified_llm_agent_validate_api_key_short(vision_node):
    """Test API key validation with short key"""
    llm_config = {
        "type": "openai",
        "api_key": "short",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(vision_node, llm_config=llm_config)
    
    # Validation happens during execute, but may be caught earlier
    with pytest.raises(ValueError):
        await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_validate_api_key_empty(vision_node):
    """Test API key validation with empty key"""
    llm_config = {
        "type": "openai",
        "api_key": "",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    
    agent = UnifiedLLMAgent(vision_node, llm_config=llm_config)
    
    # Validation happens during execute
    with pytest.raises(ValueError):
        await agent.execute({"input": "Hello"})


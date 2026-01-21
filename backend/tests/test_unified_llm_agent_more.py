"""More comprehensive tests for UnifiedLLMAgent - vision models, error handling, edge cases"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any

from backend.agents.unified_llm_agent import UnifiedLLMAgent
from backend.models.schemas import Node, NodeType, AgentConfig


@pytest.fixture
def mock_node():
    """Create a mock agent node"""
    config = AgentConfig(
        model="gpt-4",
        temperature=0.7,
        system_prompt="You are a helpful assistant"
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
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
        "model": "gpt-4"
    }


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message_with_images(mock_node, mock_llm_config):
    """Test building user message with image inputs"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # Test with base64 image
    inputs = {
        "input": "What's in this image?",
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert len(message) == 2  # Text + image
    assert message[0]["type"] == "text"
    assert message[1]["type"] == "image_url"


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message_with_image_url(mock_node, mock_llm_config):
    """Test building user message with image URL"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    inputs = {
        "input": "Analyze this image",
        "image_url": "https://example.com/image.png"
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message_with_bytes_image(mock_node, mock_llm_config):
    """Test building user message with bytes image"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    # PNG magic bytes
    png_bytes = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
    inputs = {
        "input": "Process image",
        "image_data": png_bytes
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    assert any(item.get("type") == "image_url" for item in message)


@pytest.mark.asyncio
async def test_unified_llm_agent_build_user_message_duplicate_images(mock_node, mock_llm_config):
    """Test building user message with duplicate images"""
    agent = UnifiedLLMAgent(mock_node, llm_config=mock_llm_config)
    
    image_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    inputs = {
        "image1": image_data,
        "image2": image_data,  # Duplicate
        "input": "Process images"
    }
    message = agent._build_user_message(inputs)
    assert isinstance(message, list)
    # Should only have one image (deduplicated)
    image_count = sum(1 for item in message if item.get("type") == "image_url")
    assert image_count == 1


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_gemini_vision(mock_node):
    """Test UnifiedLLMAgent execution with Gemini vision model"""
    config = AgentConfig(
        model="gemini-2.0-flash-exp",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.0-flash-exp"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response for Gemini vision
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [
                    {"text": "I see an image"}
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
            
            # Test with vision input
            vision_input = [
                {"type": "text", "text": "What's in this image?"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
            ]
            result = await agent.execute({"input": vision_input})
            assert result == "I see an image"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_gemini_image_generation(mock_node):
    """Test UnifiedLLMAgent with Gemini image generation model"""
    config = AgentConfig(
        model="gemini-2.0-flash-image-exp",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.0-flash-image-exp"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response with image generation
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "inlineData": {
                        "mimeType": "image/png",
                        "data": "base64imagedata"
                    }
                }]
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
            
            result = await agent.execute({"input": "Generate an image"})
            assert isinstance(result, str)
            assert result.startswith("data:image/")


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_custom_vision(mock_node):
    """Test UnifiedLLMAgent execution with custom provider vision model"""
    config = AgentConfig(
        model="custom-vision-model",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "custom",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://custom-api.example.com/v1",
        "model": "custom-vision-model"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response for custom provider
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "choices": [{"message": {"content": "Vision response"}}]
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
                {"type": "text", "text": "Analyze image"},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
            ]
            result = await agent.execute({"input": vision_input})
            assert result == "Vision response"


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_gemini_error_handling(mock_node):
    """Test UnifiedLLMAgent error handling with Gemini"""
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response with error
    mock_http_response = Mock()
    mock_http_response.status_code = 400
    mock_http_response.text = "Invalid request"
    mock_http_response.json.return_value = {
        "error": {
            "message": "Invalid request",
            "details": []
        }
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            with pytest.raises(RuntimeError, match="Gemini API error"):
                await agent.execute({"input": "Hello"})


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_gemini_no_candidates(mock_node):
    """Test UnifiedLLMAgent with Gemini response having no candidates"""
    config = AgentConfig(
        model="gemini-2.5-flash",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "gemini",
        "api_key": "test-key-123456789012345678901234567890",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model": "gemini-2.5-flash"
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    # Mock httpx response with no candidates
    mock_http_response = Mock()
    mock_http_response.status_code = 200
    mock_http_response.json.return_value = {
        "candidates": []
    }
    
    with patch("backend.agents.unified_llm_agent.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_http_response)
        mock_client_class.return_value = mock_client
        
        with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
            mock_get_provider.return_value = None
            
            result = await agent.execute({"input": "Hello"})
            assert result == ""


@pytest.mark.asyncio
async def test_unified_llm_agent_execute_custom_no_base_url(mock_node):
    """Test UnifiedLLMAgent with custom provider missing base_url"""
    config = AgentConfig(
        model="custom-model",
        temperature=0.7
    )
    node = Node(
        id="test-agent-1",
        type=NodeType.AGENT,
        name="Test Agent",
        agent_config=config
    )
    
    llm_config = {
        "type": "custom",
        "api_key": "test-key-123456789012345678901234567890",
        "model": "custom-model"
        # Missing base_url
    }
    
    agent = UnifiedLLMAgent(node, llm_config=llm_config)
    
    with patch("backend.api.settings_routes.get_provider_for_model") as mock_get_provider:
        mock_get_provider.return_value = None
        
        with pytest.raises(ValueError, match="base_url is required"):
            await agent.execute({"input": "Hello"})


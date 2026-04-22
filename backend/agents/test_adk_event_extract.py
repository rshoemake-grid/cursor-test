"""Tests for ADK event text extraction (google-adk 1.x)."""

from google.adk.runners import Event
from google.genai import types

from backend.agents.adk_agent import extract_assistant_text_from_adk_events, _sanitize_adk_app_name


def test_extract_skips_user_role_keeps_model():
    events = [
        Event(
            author="user",
            content=types.Content(role="user", parts=[types.Part(text="hello")]),
        ),
        Event(
            author="model",
            content=types.Content(
                role="model", parts=[types.Part(text="world"), types.Part(text="!")]
            ),
        ),
    ]
    assert extract_assistant_text_from_adk_events(events) == "world\n!"


def test_extract_empty_events():
    assert extract_assistant_text_from_adk_events([]) == ""
    assert extract_assistant_text_from_adk_events(None) == ""


def test_sanitize_app_name():
    assert _sanitize_adk_app_name("my agent") == "my_agent"
    assert _sanitize_adk_app_name("") == "workflow_adk"

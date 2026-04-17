"""Regression: workflow chat must pass publisher/model id to Vertex after LLMClientFactory mutates llm_config."""

from backend.utils.vertex_gemini import vertex_openai_model_id


def test_chat_loop_model_should_match_llm_config_after_vertex_openai_normalization():
    """Mirrors routes.py: create_client rewrites model; run_chat_loop must use the rewritten value."""
    llm_config = {
        "type": "gemini",
        "model": "gemini-3.1-pro-preview",
        "api_key": "",
    }
    model = llm_config.get("model", "gpt-4")
    raw = str(llm_config.get("model") or "").strip()
    llm_config["model"] = vertex_openai_model_id(raw)
    cfg_model = llm_config.get("model")
    if cfg_model is not None and str(cfg_model).strip() != "":
        model = str(cfg_model).strip()
    assert model == "google/gemini-3.1-pro-preview"

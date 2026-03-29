"""Model-agnostic LLM provider via LiteLLM.

Supports Claude, GPT, Gemini, Ollama, OpenRouter, and any OpenAI-compatible API.
Configuration via environment variables or .env file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env if present
_env_path = Path.cwd() / ".env"
if _env_path.exists():
    load_dotenv(_env_path)


def get_provider() -> str:
    """Get the configured LLM provider."""
    return os.getenv("LLM_PROVIDER", "anthropic")


def get_routing_model() -> str:
    """Get the small model used for question routing."""
    return os.getenv("LLM_ROUTING_MODEL", "claude-haiku-4-5-20251001")


def get_main_model() -> str:
    """Get the main model used for generating responses."""
    return os.getenv("LLM_MAIN_MODEL", "claude-sonnet-4-6")


def _prepare_model_name(model: str) -> str:
    """Prepare model name for litellm (add provider prefix if needed)."""
    provider = get_provider()

    # If model already has a provider prefix, use as-is
    if "/" in model:
        return model

    # Ollama models need the ollama/ prefix
    if provider == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        os.environ["OLLAMA_API_BASE"] = base_url
        return f"ollama/{model}"

    # OpenRouter models need openrouter/ prefix
    if provider == "openrouter":
        return f"openrouter/{model}"

    return model


def chat_completion(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.1,
    max_tokens: int = 1024,
) -> str:
    """Send a chat completion request via LiteLLM.

    Args:
        messages: List of message dicts with 'role' and 'content'.
        model: Model to use. Defaults to main model.
        temperature: Temperature for generation.
        max_tokens: Maximum tokens to generate.

    Returns:
        The assistant's response text.

    Raises:
        ImportError: If litellm is not installed.
        Exception: On API errors.
    """
    try:
        import litellm
    except ImportError:
        raise ImportError(
            "litellm is required for AI features. Install with: "
            "pip install mygovassist[ai]"
        )

    model = model or get_main_model()
    model = _prepare_model_name(model)

    response = litellm.completion(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )

    return response.choices[0].message.content


def is_ai_available() -> bool:
    """Check if AI features are available (litellm installed + API key or Ollama configured)."""
    try:
        import litellm  # noqa: F401
    except ImportError:
        return False

    provider = get_provider()
    if provider == "ollama":
        return True  # No API key needed for Ollama

    # Check for API key
    key_vars = {
        "anthropic": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
    }
    key_var = key_vars.get(provider, "LLM_API_KEY")
    return bool(os.getenv(key_var) or os.getenv("LLM_API_KEY"))

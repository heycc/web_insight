import os
from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ProviderType(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"

class ProviderConfig(BaseModel):
    api_key: str
    api_endpoint: str
    models: List[str]
    available: bool = False

# Provider configurations
PROVIDER_CONFIGS: Dict[ProviderType, Dict[str, ProviderConfig]] = {
    ProviderType.OPENAI: {
        "openrouter": ProviderConfig(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            api_endpoint="https://openrouter.ai/api/v1",
            models=["openai/gpt-4-turbo", "anthropic/claude-3-opus", "mistral/mistral-large"],
            available=False
        ),
        "deepseek": ProviderConfig(
            api_key=os.getenv("DEEPSEEK_API_KEY", ""),
            api_endpoint="https://api.deepseek.com/v1",
            models=["deepseek-chat", "deepseek-reasoner"],
            available=True
        ),
        "siliconflow": ProviderConfig(
            api_key=os.getenv("SILICONFLOW_API_KEY", ""),
            api_endpoint="https://api.siliconflow.cn/v1",
            models=["deepseek-ai/DeepSeek-R1", "deepseek-ai/DeepSeek-V3", "Qwen/QwQ-32B"],
            available=False
        )
    },
    ProviderType.GEMINI: {
        "google_aistudio": ProviderConfig(
            api_key=os.getenv("GEMINI_AISTUDIO_API_KEY", ""),
            api_endpoint="https://generativelanguage.googleapis.com/v1beta/openai",
            models=["gemini-2.5-pro-preview-03-25", "gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-2.0-flash-lite"],
            available=True
        )
    },
    ProviderType.ANTHROPIC: {
        "anthropic": ProviderConfig(
            api_key=os.getenv("ANTHROPIC_API_KEY", ""),
            api_endpoint="https://api.anthropic.com/v1",
            models=["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
            available=False
        )
    }
}

# Flattened model to provider mapping
MODEL_TO_PROVIDER: Dict[str, tuple[ProviderType, str]] = {}
for provider_type, providers in PROVIDER_CONFIGS.items():
    for provider_name, config in providers.items():
        for model in config.models:
            MODEL_TO_PROVIDER[model] = (provider_type, provider_name)

# Proxy settings
PROXY_API_KEYS = os.getenv("PROXY_API_KEYS", "").split(",")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "60"))

# Generic proxy model names that map to actual provider models
PROXY_MODELS = {
    # Format: "proxy_name": (provider_type, provider_name, model_name)
    "gemini-2.0-flash:proxy": (ProviderType.GEMINI, "google_aistudio", "gemini-2.0-flash"),
    "deepseek-v3:proxy": (ProviderType.OPENAI, "deepseek", "deepseek-chat"),
    "deepseek-r1:proxy": (ProviderType.OPENAI, "deepseek", "deepseek-reasoner")
}

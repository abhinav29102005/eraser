import os
import httpx
import importlib

AsyncOpenAI = None
try:
    openai_module = importlib.import_module("openai")
    AsyncOpenAI = getattr(openai_module, "AsyncOpenAI", None)
except Exception:
    AsyncOpenAI = None

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
AI_PROVIDER = os.getenv("AI_PROVIDER", "auto").strip().lower()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

client = AsyncOpenAI(api_key=OPENAI_API_KEY) if (OPENAI_API_KEY and AsyncOpenAI) else None


def _resolve_provider() -> str:
    if AI_PROVIDER in {"openai", "ollama", "mock"}:
        return AI_PROVIDER
    if OPENAI_API_KEY:
        return "openai"
    return "mock"


async def _ollama_chat(prompt: str, system: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=60) as ac:
        resp = await ac.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


def _mock_diagram(prompt: str) -> str:
    return (
        "[FREE AI MODE]\n"
        "Use this scaffold and refine manually:\n\n"
        f"Diagram topic: {prompt}\n"
        "┌───────────────┐    ┌───────────────┐\n"
        "│   Client UI   │───▶│   API Server  │\n"
        "└───────────────┘    └───────────────┘\n"
        "         │                    │\n"
        "         ▼                    ▼\n"
        "   Real-time WS         Database/Cache\n"
    )


def _mock_suggestions(content: str) -> str:
    return (
        "[FREE AI MODE]\n"
        "Suggestions:\n"
        "1) Add clear title and legend.\n"
        "2) Align shapes and use consistent spacing.\n"
        "3) Group related blocks by color.\n"
        "4) Label arrows with action names.\n"
        f"5) Reduce ambiguity in: {content[:80]}..."
    )


async def generate_diagram(prompt: str) -> str:
    """Generate a diagram based on text prompt.

    Providers:
    - openai (paid)
    - ollama (free local)
    - mock (free fallback)
    """
    provider = _resolve_provider()
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at creating ASCII diagrams and describing visual layouts.",
                    },
                    {
                        "role": "user",
                        "content": f"Create an ASCII diagram for: {prompt}",
                    },
                ],
                max_tokens=800,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Create an ASCII diagram for: {prompt}",
                "You are an expert at creating concise ASCII diagrams.",
            )

        return _mock_diagram(prompt)
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_diagram(prompt)


async def analyze_sketch(image_url: str) -> str:
    """Analyze a sketch and provide suggestions."""
    provider = _resolve_provider()
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing sketches and diagrams.",
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this sketch URL and give improvements: {image_url}",
                    },
                ],
                max_tokens=500,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Analyze this sketch URL and give improvements: {image_url}",
                "You are an expert at diagram quality reviews.",
            )

        return _mock_suggestions(image_url)
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_suggestions(image_url)


async def suggest_edits(content: str) -> str:
    """Suggest improvements for diagram content."""
    provider = _resolve_provider()
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Provide concise, actionable suggestions for improving diagrams.",
                    },
                    {
                        "role": "user",
                        "content": f"Suggest improvements for this diagram/sketch: {content}",
                    },
                ],
                max_tokens=300,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Suggest improvements for this diagram/sketch: {content}",
                "Provide concise bullet-point design suggestions.",
            )

        return _mock_suggestions(content)
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_suggestions(content)

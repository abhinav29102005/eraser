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
    """Generate a Mermaid diagram template based on prompt keywords."""
    keywords = prompt.split()[:4]
    
    # Basic Mermaid flowchart template
    mermaid_code = "graph TD\n"
    
    if len(keywords) >= 2:
        # Create a simple flow diagram
        mermaid_code += f'    A["{keywords[0].capitalize()}"] --> B["{keywords[1].capitalize()}"]\n'
        if len(keywords) >= 3:
            mermaid_code += f'    B --> C["{keywords[2].capitalize()}"]\n'
        if len(keywords) >= 4:
            mermaid_code += f'    C --> D["{keywords[3].capitalize()}"]\n'
    else:
        # Fallback simple template
        mermaid_code += '    A["Client"] --> B["Server"]\n'
        mermaid_code += '    B --> C["Database"]\n'
    
    return mermaid_code


def _humanize_response(prompt: str, extra: str = "") -> str:
    """Wrap AI output in a warm, conversational tone."""
    import random
    openers = [
        f"Hey! I've put together a visual for \"{ prompt[:60] }\" — here's what I came up with.",
        f"Great idea! I sketched out \"{ prompt[:60] }\" for you. Take a look and tweak as you like.",
        f"Here you go! I turned \"{ prompt[:60] }\" into a diagram. Feel free to move things around.",
        f"Nice prompt! I whipped up a visual of \"{ prompt[:60] }\". Hope it captures what you had in mind!",
        f"Alright, I gave \"{ prompt[:60] }\" my best shot — the diagram is on your canvas now.",
    ]
    tips = [
        "💡 Tip: You can drag and resize the image once it's on the canvas.",
        "💡 Tip: Try zooming in to check the finer details.",
        "💡 Tip: Pair this diagram with labels using the Text tool.",
        "💡 Tip: Use the document panel to annotate what each part means.",
    ]
    parts = [random.choice(openers)]
    if extra:
        parts.append(extra)
    parts.append(random.choice(tips))
    return "\n\n".join(parts)


def _build_mock_svg(prompt: str) -> str:
    """Generate a nice mock SVG diagram from the prompt."""
    import hashlib
    h = hashlib.md5(prompt.encode()).hexdigest()
    # Derive stable colours from the hash
    c1 = f"#{h[0:6]}"
    c2 = f"#{h[6:12]}"
    c3 = f"#{h[12:18]}"

    words = prompt.split()
    # Build up to 5 labelled boxes from prompt keywords
    boxes = []
    keywords = [w.strip(",.!?") for w in words if len(w) > 2][:5]
    if len(keywords) < 2:
        keywords = ["Service A", "Service B", "Database"]

    cols = min(len(keywords), 3)
    box_w, box_h, gap_x, gap_y = 150, 60, 40, 80
    start_x, start_y = 30, 30
    svg_items = []
    positions = []

    for i, kw in enumerate(keywords):
        row = i // cols
        col = i % cols
        x = start_x + col * (box_w + gap_x)
        y = start_y + row * (box_h + gap_y)
        positions.append((x, y, kw))
        rx = 12
        fills = [c1, c2, c3]
        fill = fills[i % len(fills)]
        svg_items.append(
            f'<rect x="{x}" y="{y}" width="{box_w}" height="{box_h}" rx="{rx}" '
            f'fill="{fill}" fill-opacity="0.15" stroke="{fill}" stroke-width="2"/>'
        )
        svg_items.append(
            f'<text x="{x + box_w // 2}" y="{y + box_h // 2 + 5}" '
            f'text-anchor="middle" font-family="Inter,system-ui,sans-serif" '
            f'font-size="13" font-weight="600" fill="{fill}">{kw.capitalize()}</text>'
        )

    # Draw arrows between consecutive boxes
    for i in range(len(positions) - 1):
        x1 = positions[i][0] + box_w
        y1 = positions[i][1] + box_h // 2
        x2 = positions[i + 1][0]
        y2 = positions[i + 1][1] + box_h // 2
        # If wrapping to next row, adjust
        if positions[i + 1][0] <= positions[i][0]:
            x1 = positions[i][0] + box_w // 2
            y1 = positions[i][1] + box_h
            x2 = positions[i + 1][0] + box_w // 2
            y2 = positions[i + 1][1]
        svg_items.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>'
        )

    total_cols = min(len(keywords), cols)
    total_rows = (len(keywords) + cols - 1) // cols
    svg_w = start_x * 2 + total_cols * box_w + (total_cols - 1) * gap_x
    svg_h = start_y * 2 + total_rows * box_h + (total_rows - 1) * gap_y

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_w}" height="{svg_h}" viewBox="0 0 {svg_w} {svg_h}">'
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" '
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
        '<path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/></marker></defs>'
        '<rect width="100%" height="100%" fill="#1e1e2e" rx="16"/>'
        + "".join(svg_items)
        + "</svg>"
    )
    return svg


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
    """Generate a Mermaid diagram based on text prompt.

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
                        "content": """You are an expert at creating Mermaid diagrams. 
Generate clean, professional Mermaid diagram syntax. Choose the best diagram type (flowchart, graph, sequence, state, class, etc.) based on the prompt.
Return ONLY valid Mermaid syntax without markdown code blocks or explanations.""",
                    },
                    {
                        "role": "user",
                        "content": f"Create a Mermaid diagram for: {prompt}",
                    },
                ],
                max_tokens=1000,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Create a Mermaid diagram for: {prompt}",
                """You are an expert at creating Mermaid diagrams. Generate clean, professional Mermaid syntax.
Choose the best diagram type based on the prompt. Return ONLY valid Mermaid code without markdown blocks.""",
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


async def generate_diagram_svg(prompt: str) -> dict:
    """Generate a Mermaid diagram + humanized explanation.

    Returns {"mermaid": "mermaid code...", "message": "…", "type": "mermaid"}.
    """
    provider = _resolve_provider()
    mermaid_code = ""
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at creating professional Mermaid diagrams. "
                            "Return ONLY valid Mermaid syntax without markdown code blocks. "
                            "Choose the best diagram type (flowchart, graph, sequence, state, class, etc.) based on the prompt. "
                            "Use clear labels, logical flow, and proper Mermaid syntax. "
                            "Make diagrams professional and suitable for technical documentation."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Create a Mermaid diagram for: {prompt}",
                    },
                ],
                max_tokens=1500,
            )
            mermaid_code = response.choices[0].message.content or ""
            # Clean up if wrapped in markdown code blocks
            mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()

        elif provider == "ollama":
            mermaid_code = await _ollama_chat(
                f"Create a Mermaid diagram for: {prompt}",
                (
                    "You are an expert at creating professional Mermaid diagrams. "
                    "Return ONLY valid Mermaid syntax without markdown blocks. "
                    "Choose the best diagram type based on the prompt."
                ),
            )
            mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()
    except Exception as e:
        print(f"AI Mermaid Error: {e}")

    # Fallback to mock Mermaid diagram
    if not mermaid_code or "graph" not in mermaid_code.lower():
        mermaid_code = _mock_diagram(prompt)

    message = _humanize_response(prompt, "I've created a Mermaid diagram for you!")

    return {
        "mermaid": mermaid_code,
        "message": message,
        "type": "mermaid",
    }
